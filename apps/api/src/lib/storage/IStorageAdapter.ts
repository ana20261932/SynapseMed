/**
 * IStorageAdapter — provider-independent object storage interface
 * Default: local in-memory/mock. Can wire IBM Cloud Object Storage, AWS S3 etc.
 */
export interface StoredObjectMeta {
  objectKey: string;
  bucket?: string;
  location?: string;
}

export interface IStorageAdapter {
  readonly providerName: string;
  readonly isMock: boolean;
  /** Generate a presigned/upload URL or return a key to upload to */
  getUploadUrl(params: { practiceId: string; fileName: string; mimeType: string }): Promise<{ uploadUrl: string; objectKey: string; method: 'PUT' | 'POST' }>;
  /** Get a presigned download URL */
  getDownloadUrl(objectKey: string): Promise<string>;
  /** Delete an object */
  deleteObject(objectKey: string): Promise<void>;
}
