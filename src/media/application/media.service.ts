import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { fromBuffer as fileTypeFromBuffer } from 'file-type';

import { MediaFileRepository } from '../infrastructure/media-file.repository';
import { MEDIA_UPLOAD_PORT } from '../domain/ports';
import type { MediaUploadPort } from '../domain/ports';
import type { MediaFile } from '../domain/entities/media-file.entity';

interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Max file sizes per category (in bytes) */
const MAX_FILE_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024, // 10MB
  video: 500 * 1024 * 1024, // 500MB
  document: 50 * 1024 * 1024, // 50MB
};

/** Allowed MIME types grouped by category */
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm'],
  document: ['application/pdf'],
};

/**
 * Service for file upload and media management.
 * Validates file types and sizes before delegating to storage adapter.
 */
@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly fileRepository: MediaFileRepository,
    @Inject(MEDIA_UPLOAD_PORT)
    private readonly storageAdapter: MediaUploadPort,
  ) {}

  async upload(file: UploadedFile, userId: string): Promise<MediaFile> {
    await this.validateFile(file);

    const key = this.generateStorageKey(file.originalname);

    const uploadResult = await this.storageAdapter.upload(
      key,
      file.buffer,
      file.mimetype,
    );

    const mediaFile = await this.fileRepository.create({
      originalName: file.originalname,
      storagePath: uploadResult.storagePath,
      mimeType: file.mimetype,
      size: file.size,
      uploadedById: userId,
    });

    this.logger.log(
      `Uploaded file: ${file.originalname} (${file.size} bytes) by user ${userId}`,
    );

    // Attach the public URL for the response (not persisted in DB)
    return Object.assign(mediaFile, { url: uploadResult.url });
  }

  async getPresignedUrl(id: string): Promise<string> {
    const file = await this.fileRepository.findById(id);
    if (!file) {
      throw new NotFoundException(`Media file with id ${id} not found`);
    }
    return this.storageAdapter.getPresignedUrl(file.storagePath);
  }

  async findById(id: string): Promise<MediaFile> {
    const file = await this.fileRepository.findById(id);
    if (!file) {
      throw new NotFoundException(`Media file with id ${id} not found`);
    }
    return file;
  }

  async deleteFile(id: string): Promise<void> {
    const file = await this.findById(id);
    await this.storageAdapter.delete(file.storagePath);
    await this.fileRepository.softDelete(id);
    this.logger.log(`Deleted file: ${file.originalName} (${id})`);
  }

  /**
   * Validate file type (via magic bytes + MIME) and size against allowed rules.
   */
  private async validateFile(file: UploadedFile): Promise<void> {
    // Validate real file type via magic bytes — don't trust Content-Type header
    const detected = await fileTypeFromBuffer(file.buffer);

    const effectiveMime = detected?.mime ?? file.mimetype;

    const category = this.getFileCategory(effectiveMime);

    if (!category) {
      const detail = detected
        ? `Detected type "${detected.mime}" does not match any allowed type.`
        : `File type "${file.mimetype}" is not allowed.`;
      throw new BadRequestException(
        `${detail} Allowed types: images (jpg, png, gif, webp), videos (mp4, webm), documents (pdf).`,
      );
    }

    // If client claims one type but magic bytes say another, reject
    if (detected && detected.mime !== file.mimetype) {
      const clientCategory = this.getFileCategory(file.mimetype);
      const realCategory = this.getFileCategory(detected.mime);
      if (clientCategory !== realCategory) {
        throw new BadRequestException(
          `MIME type mismatch: header says "${file.mimetype}" but file content is "${detected.mime}".`,
        );
      }
    }

    const maxSize = MAX_FILE_SIZES[category]!;
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      throw new BadRequestException(
        `File size ${Math.round(file.size / (1024 * 1024))}MB exceeds maximum ${maxMB}MB for ${category} files.`,
      );
    }
  }

  /**
   * Determine file category (image/video/document) from MIME type.
   */
  private getFileCategory(mimeType: string): string | null {
    for (const [category, types] of Object.entries(ALLOWED_MIME_TYPES)) {
      if (types.includes(mimeType)) return category;
    }
    return null;
  }

  /**
   * Generate a unique storage key with date prefix.
   */
  private generateStorageKey(originalName: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uniqueId = randomUUID().slice(0, 8);
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `uploads/${year}/${month}/${uniqueId}-${safeName}`;
  }
}
