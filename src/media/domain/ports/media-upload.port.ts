/**
 * Port for file storage operations.
 * Infrastructure adapters implement this to abstract storage backends.
 * - MockStorageAdapter: stores files locally in /tmp for dev/test
 * - MinioStorageAdapter: real MinIO (S3-compatible) integration
 */
export const MEDIA_UPLOAD_PORT = Symbol('MEDIA_UPLOAD_PORT');

export interface UploadResult {
  storagePath: string;
  url: string;
}

export interface MediaUploadPort {
  /**
   * Upload a file to storage.
   * @param key - The storage key (path) for the file
   * @param buffer - File content as Buffer
   * @param mimeType - MIME type of the file
   */
  upload(key: string, buffer: Buffer, mimeType: string): Promise<UploadResult>;

  /**
   * Get a presigned URL for reading a file.
   * @param key - The storage key (path) of the file
   * @param expiresInSeconds - URL validity duration (default: 3600)
   */
  getPresignedUrl(key: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Delete a file from storage.
   * @param key - The storage key (path) of the file
   */
  delete(key: string): Promise<void>;
}
