import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import type { MediaUploadPort, UploadResult } from '../domain/ports';

/**
 * Mock storage adapter for development/testing.
 * Stores files in /tmp/lms-uploads/ directory.
 * Files are served via NestJS ServeStaticModule at /uploads.
 */
@Injectable()
export class MockStorageAdapter implements MediaUploadPort {
  private readonly logger = new Logger(MockStorageAdapter.name);
  private readonly basePath = '/tmp/lms-uploads';
  private readonly apiBaseUrl: string;

  constructor() {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
    const port = process.env['PORT'] ?? '3001';
    this.apiBaseUrl = `http://localhost:${port}`;
  }

  async upload(
    key: string,
    buffer: Buffer,
    _mimeType: string,
  ): Promise<UploadResult> {
    const filePath = path.join(this.basePath, key);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, buffer);
    this.logger.log(`Stored file at ${filePath} (${buffer.length} bytes)`);

    return {
      storagePath: key,
      url: `${this.apiBaseUrl}/${key}`,
    };
  }

  async getPresignedUrl(key: string, _expiresInSeconds?: number): Promise<string> {
    return `${this.apiBaseUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      this.logger.log(`Deleted file at ${filePath}`);
    }
  }
}
