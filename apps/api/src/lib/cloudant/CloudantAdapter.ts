/**
 * CloudantAdapter — IBM Cloudant NoSQL database integration
 *
 * Uses IBM Cloudant HTTP API directly (no SDK dependency required).
 * IAM API-key → IAM token exchange is handled internally.
 * Falls back to error if credentials are missing.
 *
 * Required env vars:
 *   CLOUDANT_URL      — e.g. https://<instance>.cloudantnosqldb.appdomain.cloud
 *   CLOUDANT_API_KEY  — IBM Cloud IAM API key
 *   CLOUDANT_DB_NAME  — default: synapsemed
 */
import { randomUUID } from 'crypto';

export interface CloudantDocument {
  _id?: string;
  _rev?: string;
  [key: string]: any;
}

interface CloudantCreateResult {
  id: string;
  rev: string;
  ok: boolean;
}

interface CloudantFindResult {
  docs: CloudantDocument[];
}

export class CloudantAdapter {
  readonly providerName = 'ibm-cloudant';
  readonly isMock = false;

  private url: string;
  private apiKey: string;
  private dbName: string;
  private _cachedToken: string | null = null;
  private _tokenExpiry = 0;

  constructor(config: { url?: string; apiKey?: string; dbName?: string } = {}) {
    this.url = (config.url ?? '').replace(/\/$/, '');
    this.apiKey = config.apiKey ?? '';
    this.dbName = config.dbName ?? 'synapsemed';
  }

  private assertConfigured(): void {
    if (!this.url || !this.apiKey) {
      throw new Error('CLOUDANT_NOT_CONFIGURED: Set CLOUDANT_URL and CLOUDANT_API_KEY environment variables.');
    }
  }

  /** Exchange IAM API key for a Bearer token (cached for ~55 min). */
  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this._cachedToken && now < this._tokenExpiry) return this._cachedToken;
    const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${encodeURIComponent(this.apiKey)}`,
    });
    if (!res.ok) throw new Error(`Cloudant IAM auth failed: ${res.status}`);
    const data = await res.json() as any;
    this._cachedToken = data.access_token as string;
    this._tokenExpiry = now + (data.expires_in - 300) * 1000; // expire 5 min early
    return this._cachedToken!;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    this.assertConfigured();
    const token = await this.getToken();
    const res = await fetch(`${this.url}/${this.dbName}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Cloudant API error ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  async create(doc: CloudantDocument): Promise<CloudantDocument & { _id: string }> {
    const id = doc._id ?? randomUUID();
    const result = await this.request<CloudantCreateResult>(`/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ ...doc, _id: id }),
    });
    return { ...doc, _id: result.id, _rev: result.rev };
  }

  async get(id: string): Promise<CloudantDocument | null> {
    try {
      return await this.request<CloudantDocument>(`/${encodeURIComponent(id)}`);
    } catch (err: any) {
      if (err.message.includes('404')) return null;
      throw err;
    }
  }

  /** Cloudant Mango query */
  async query(selector: any): Promise<CloudantDocument[]> {
    const result = await this.request<CloudantFindResult>('/_find', {
      method: 'POST',
      body: JSON.stringify({ selector }),
    });
    return result.docs;
  }

  async update(doc: CloudantDocument): Promise<CloudantDocument> {
    if (!doc._id) throw new Error('Document must have _id to update');
    const result = await this.request<CloudantCreateResult>(`/${encodeURIComponent(doc._id)}`, {
      method: 'PUT',
      body: JSON.stringify(doc),
    });
    return { ...doc, _rev: result.rev };
  }

  async delete(id: string, rev: string): Promise<void> {
    await this.request<any>(`/${encodeURIComponent(id)}?rev=${encodeURIComponent(rev)}`, {
      method: 'DELETE',
    });
  }
}

export function getCloudantAdapter(): CloudantAdapter {
  return new CloudantAdapter({
    url: process.env.CLOUDANT_URL,
    apiKey: process.env.CLOUDANT_API_KEY,
    dbName: process.env.CLOUDANT_DB_NAME || 'synapsemed',
  });
}
