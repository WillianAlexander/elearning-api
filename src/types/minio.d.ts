declare module 'minio' {
  export class Client {
    constructor(options: {
      endPoint: string;
      port: number;
      useSSL: boolean;
      accessKey: string;
      secretKey: string;
    });
    putObject(
      bucket: string,
      key: string,
      buffer: Buffer,
      size: number,
      metadata: Record<string, string>,
    ): Promise<void>;
    presignedGetObject(
      bucket: string,
      key: string,
      expiry: number,
    ): Promise<string>;
    removeObject(bucket: string, key: string): Promise<void>;
    bucketExists(bucket: string): Promise<boolean>;
    makeBucket(bucket: string): Promise<void>;
  }
}
