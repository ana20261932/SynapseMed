import { IStorageAdapter } from './IStorageAdapter';

export class CloudObjectStorageAdapter implements IStorageAdapter {
  readonly providerName = 'ibm-cos';
  readonly isMock = false;

  async getUploadUrl(params: { practiceId: string; fileName: string; mimeType: string }): Promise<{ uploadUrl: string; objectKey: string; method: 'PUT' | 'POST' }> {
    // Placeholder implementation - requires IBM COS SDK credentials
    throw new Error('IBM_COS_NOT_CONFIGURED: Set IBM_COS_ENDPOINT, IBM_COS_BUCKET, IBM_COS_INSTANCE_ID and credentials to use COS adapter.');
  }

  async getDownloadUrl(_objectKey: string): Promise<string> {
    throw new Error('IBM_COS_NOT_CONFIGURED');
  }

  async deleteObject(_objectKey: string): Promise<void> {
    throw new Error('IBM_COS_NOT_CONFIGURED');
  }
}

export function getCOSAdapter(): IStorageAdapter {
  return new CloudObjectStorageAdapter();
}
