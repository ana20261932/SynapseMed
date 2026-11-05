import { randomUUID } from 'crypto';
import { IStorageAdapter, StoredObjectMeta } from './IStorageAdapter';

export class MockStorageAdapter implements IStorageAdapter {
  readonly providerName = 'mock';
  readonly isMock = true;

  async getUploadUrl(params: { practiceId: string; fileName: string; mimeType: string }) {
    const objectKey = `mock/${params.practiceId}/${randomUUID()}-${params.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    return {
      uploadUrl: `http://localhost:8080/api/v1/mock-storage/upload/${objectKey}`,
      objectKey,
      method: 'PUT' as const,
    };
  }

  async getDownloadUrl(objectKey: string): Promise<string> {
    return `http://localhost:8080/api/v1/mock-storage/download/${encodeURIComponent(objectKey)}`;
  }

  async deleteObject(_objectKey: string): Promise<void> {
    // no-op in mock
  }
}

let instance: MockStorageAdapter | null = null;
export function getStorageAdapter(): IStorageAdapter {
  if (!instance) instance = new MockStorageAdapter();
  return instance;
}
