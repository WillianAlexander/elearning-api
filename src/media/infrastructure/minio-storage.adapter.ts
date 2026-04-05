import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

import type { MediaUploadPort, UploadResult } from '../domain/ports';

/**
 * MinIO storage adapter for production use.
 * S3-compatible object storage deployed on-prem.
 */
@Injectable()
export class MinioStorageAdapter implements MediaUploadPort, OnModuleInit {
  private readonly logger = new Logger(MinioStorageAdapter.name);
  private client!: Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('minio.bucket', 'lms-files');
  }

  async onModuleInit(): Promise<void> {
    this.client = new Client({
      endPoint: this.configService.get<string>('minio.endpoint', 'localhost'),
      port: this.configService.get<number>('minio.port', 9000),
      useSSL: this.configService.get<boolean>('minio.useSSL', false),
      accessKey: this.configService.get<string>(
        'minio.accessKey',
        'minio_access_key',
      ),
      secretKey: this.configService.get<string>(
        'minio.secretKey',
        'minio_secret_key',
      ),
    });
    this.logger.log('MinIO client initialized');
  }

  async upload(
    key: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<UploadResult> {
    this.ensureClient();
    await this.ensureBucket();

    await this.client.putObject(this.bucket, key, buffer, buffer.length, {
      'Content-Type': mimeType,
    });

    this.logger.log(
      `Uploaded ${key} to MinIO (${buffer.length} bytes, ${mimeType})`,
    );

    const url = await this.getPresignedUrl(key);

    return { storagePath: key, url };
  }

  async getPresignedUrl(
    key: string,
    expiresInSeconds: number = 3600,
  ): Promise<string> {
    this.ensureClient();
    return this.client.presignedGetObject(
      this.bucket,
      key,
      expiresInSeconds,
    );
  }

  async delete(key: string): Promise<void> {
    this.ensureClient();
    await this.client.removeObject(this.bucket, key);
    this.logger.log(`Deleted ${key} from MinIO`);
  }

  private async ensureBucket(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
      this.logger.log(`Created bucket: ${this.bucket}`);
    }
  }

  private ensureClient(): void {
    if (!this.client) {
      throw new Error(
        'MinIO client not initialized. Ensure the minio package is installed.',
      );
    }
  }
}
