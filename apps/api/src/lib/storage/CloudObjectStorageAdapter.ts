import { IStorageAdapter } from './IStorageAdapter';
import { randomUUID } from 'crypto';
import { createHmac, createHash } from 'crypto';

/**
 * CloudObjectStorageAdapter — IBM Cloud Object Storage integration
 *
 * Uses the IBM COS S3-compatible REST API with AWS Signature V4.
 * No SDK dependency required.
 *
 * Required env vars:
 *   IBM_COS_ENDPOINT           — e.g. https://s3.us-south.cloud-object-storage.appdomain.cloud
 *   IBM_COS_BUCKET             — bucket name
 *   IBM_COS_API_KEY            — IBM Cloud IAM API key
 *   IBM_COS_SERVICE_INSTANCE_CRN — COS service instance CRN (used as S3 access key ID)
 *   IBM_COS_REGION             — e.g. us-south (default: us-south)
 *
 * Presigned URLs are generated using AWS Sig V4 (IBM COS is S3-compatible).
 * Upload URLs expire in 15 minutes; download URLs expire in 1 hour.
 */
export class CloudObjectStorageAdapter implements IStorageAdapter {
  readonly providerName = 'ibm-cos';
  readonly isMock = false;

  private endpoint: string;
  private bucket: string;
  private apiKey: string;
  private serviceInstanceCrn: string;
  private region: string;
  private _cachedToken: string | null = null;
  private _tokenExpiry = 0;

  constructor(config?: {
    endpoint?: string;
    bucket?: string;
    apiKey?: string;
    serviceInstanceCrn?: string;
    region?: string;
  }) {
    this.endpoint = (config?.endpoint ?? process.env.IBM_COS_ENDPOINT ?? '').replace(/\/$/, '');
    this.bucket = config?.bucket ?? process.env.IBM_COS_BUCKET ?? '';
    this.apiKey = config?.apiKey ?? process.env.IBM_COS_API_KEY ?? '';
    this.serviceInstanceCrn = config?.serviceInstanceCrn ?? process.env.IBM_COS_SERVICE_INSTANCE_CRN ?? '';
    this.region = config?.region ?? process.env.IBM_COS_REGION ?? 'us-south';
  }

  private assertConfigured(): void {
    if (!this.endpoint || !this.bucket || !this.apiKey) {
      throw new Error(
        'IBM_COS_NOT_CONFIGURED: Set IBM_COS_ENDPOINT, IBM_COS_BUCKET, and IBM_COS_API_KEY environment variables.'
      );
    }
  }

  private async getIAMToken(): Promise<string> {
    const now = Date.now();
    if (this._cachedToken && now < this._tokenExpiry) return this._cachedToken;
    const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${encodeURIComponent(this.apiKey)}`,
    });
    if (!res.ok) throw new Error(`IBM COS IAM auth failed: ${res.status}`);
    const data = await res.json() as any;
    this._cachedToken = data.access_token as string;
    this._tokenExpiry = now + (data.expires_in - 300) * 1000;
    return this._cachedToken!;
  }

  /**
   * Generate a presigned PUT URL using AWS Signature Version 4.
   * IBM COS is S3-compatible and accepts the same signing scheme.
   * The IBM COS service instance CRN acts as the access key ID.
   */
  private generatePresignedUrl(objectKey: string, method: 'PUT' | 'GET', expiresIn: number): string {
    // IBM COS presigned URLs use the service instance CRN as "access key"
    // and a derived HMAC key from the CRN. However, IBM COS also supports
    // HMAC credentials (separate from IAM). When HMAC creds are set, use them.
    // When only IAM key is available, fall back to a signed token URL approach.
    const hmacKeyId = process.env.IBM_COS_HMAC_ACCESS_KEY_ID;
    const hmacSecret = process.env.IBM_COS_HMAC_SECRET_ACCESS_KEY;

    if (!hmacKeyId || !hmacSecret) {
      // Without HMAC credentials, we can't sign a presigned URL.
      // Return a placeholder that the caller can use with a Bearer token instead.
      throw new Error(
        'IBM_COS_HMAC_NOT_CONFIGURED: Presigned URLs require IBM_COS_HMAC_ACCESS_KEY_ID and IBM_COS_HMAC_SECRET_ACCESS_KEY. ' +
        'Generate HMAC credentials from your COS service credentials page.'
      );
    }

    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const amzDate = now.toISOString().replace(/[:\-]/g, '').slice(0, 15) + 'Z';
    const service = 's3';
    const credentialScope = `${dateStamp}/${this.region}/${service}/aws4_request`;
    const credential = `${hmacKeyId}/${credentialScope}`;

    // Parse host from endpoint
    const endpointUrl = new URL(this.endpoint.startsWith('http') ? this.endpoint : `https://${this.endpoint}`);
    const host = endpointUrl.host;
    const objectPath = `/${this.bucket}/${objectKey}`;

    const queryParams: Record<string, string> = {
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': credential,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': String(expiresIn),
      'X-Amz-SignedHeaders': 'host',
    };
    if (this.serviceInstanceCrn) {
      queryParams['x-amz-meta-ibmserviceinstanceid'] = this.serviceInstanceCrn;
    }

    const sortedQuery = Object.keys(queryParams)
      .sort()
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
      .join('&');

    const canonicalRequest = [
      method,
      objectPath,
      sortedQuery,
      `host:${host}\n`,
      'host',
      'UNSIGNED-PAYLOAD',
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const signingKey = ['aws4_request', service, this.region, dateStamp].reduce(
      (key, data) => createHmac('sha256', key).update(data).digest(),
      Buffer.from(`AWS4${hmacSecret}`) as Buffer | string
    ) as Buffer;

    const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    return `${this.endpoint}${objectPath}?${sortedQuery}&X-Amz-Signature=${signature}`;
  }

  /**
   * Returns a presigned PUT URL for direct browser upload.
   * If HMAC credentials are not configured, falls back to a server-proxy upload key
   * so callers always get a consistent response shape.
   */
  async getUploadUrl(params: {
    practiceId: string;
    fileName: string;
    mimeType: string;
  }): Promise<{ uploadUrl: string; objectKey: string; method: 'PUT' | 'POST' }> {
    this.assertConfigured();
    const objectKey = `practices/${params.practiceId}/${randomUUID()}/${params.fileName}`;
    try {
      const uploadUrl = this.generatePresignedUrl(objectKey, 'PUT', 900); // 15 min
      return { uploadUrl, objectKey, method: 'PUT' };
    } catch (e: any) {
      // HMAC not configured — return a server-side upload key reference
      // (the API route should proxy the upload using the IAM token)
      return {
        uploadUrl: `${process.env.API_BASE_URL || 'http://localhost:8080'}/api/storage/proxy-upload/${encodeURIComponent(objectKey)}`,
        objectKey,
        method: 'POST',
      };
    }
  }

  async getDownloadUrl(objectKey: string): Promise<string> {
    this.assertConfigured();
    try {
      return this.generatePresignedUrl(objectKey, 'GET', 3600); // 1 hour
    } catch {
      // Fall back to server-proxy download
      return `${process.env.API_BASE_URL || 'http://localhost:8080'}/api/storage/proxy-download/${encodeURIComponent(objectKey)}`;
    }
  }

  /** Delete an object via the COS REST API using a Bearer token. */
  async deleteObject(objectKey: string): Promise<void> {
    this.assertConfigured();
    const token = await this.getIAMToken();
    const url = `${this.endpoint}/${this.bucket}/${objectKey}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(this.serviceInstanceCrn ? { 'ibm-service-instance-id': this.serviceInstanceCrn } : {}),
      },
    });
    if (!res.ok && res.status !== 204) {
      const body = await res.text().catch(() => '');
      throw new Error(`IBM COS delete failed: ${res.status} ${body}`);
    }
  }

  /**
   * Proxy upload: PUT an object to COS using a Bearer token (server-side).
   * Called when HMAC presigned URLs are not available.
   */
  async proxyUpload(objectKey: string, body: Buffer, contentType: string): Promise<void> {
    this.assertConfigured();
    const token = await this.getIAMToken();
    const url = `${this.endpoint}/${this.bucket}/${objectKey}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
        ...(this.serviceInstanceCrn ? { 'ibm-service-instance-id': this.serviceInstanceCrn } : {}),
      },
      body,
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`IBM COS upload failed: ${res.status} ${err}`);
    }
  }

  /**
   * Proxy download: GET an object from COS using a Bearer token (server-side).
   */
  async proxyDownload(objectKey: string): Promise<{ data: Buffer; contentType: string }> {
    this.assertConfigured();
    const token = await this.getIAMToken();
    const url = `${this.endpoint}/${this.bucket}/${objectKey}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(this.serviceInstanceCrn ? { 'ibm-service-instance-id': this.serviceInstanceCrn } : {}),
      },
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`IBM COS download failed: ${res.status} ${err}`);
    }
    const data = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('Content-Type') ?? 'application/octet-stream';
    return { data, contentType };
  }
}

export function getCOSAdapter(): IStorageAdapter {
  return new CloudObjectStorageAdapter();
}
