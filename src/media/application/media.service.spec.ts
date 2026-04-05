import { Test } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import type { TestingModule } from '@nestjs/testing';

import { MediaService } from './media.service';
import { MediaFileRepository } from '../infrastructure/media-file.repository';
import { MEDIA_UPLOAD_PORT } from '../domain/ports';
import { MediaFile } from '../domain/entities/media-file.entity';

import type { MediaUploadPort } from '../domain/ports';

// Mock file-type: by default returns undefined (no magic bytes detected → falls back to MIME header)
jest.mock('file-type', () => ({
  fromBuffer: jest.fn().mockResolvedValue(undefined),
}));

const { fromBuffer: mockFromBuffer } = jest.requireMock('file-type') as {
  fromBuffer: jest.Mock;
};

const createMockMediaFile = (
  overrides: Partial<MediaFile> = {},
): MediaFile => {
  const file = new MediaFile();
  file.id = 'media-uuid-001';
  file.originalName = 'document.pdf';
  file.storagePath = 'uploads/2026/03/document.pdf';
  file.mimeType = 'application/pdf';
  file.size = 1024000;
  file.uploadedById = 'user-uuid-001';
  Object.assign(file, overrides);
  return file;
};

describe('MediaService', () => {
  let service: MediaService;
  let fileRepo: jest.Mocked<MediaFileRepository>;
  let storageAdapter: jest.Mocked<MediaUploadPort>;

  beforeEach(async () => {
    fileRepo = {
      findById: jest.fn(),
      create: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MediaFileRepository>;

    storageAdapter = {
      upload: jest.fn(),
      getPresignedUrl: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: MediaFileRepository, useValue: fileRepo },
        { provide: MEDIA_UPLOAD_PORT, useValue: storageAdapter },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  describe('upload', () => {
    it('should upload a valid PDF file', async () => {
      const buffer = Buffer.from('fake-pdf-content');
      const file = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024000,
        buffer,
      };

      storageAdapter.upload.mockResolvedValue({
        storagePath: 'uploads/2026/03/document.pdf',
        url: 'http://storage/uploads/2026/03/document.pdf',
      });
      fileRepo.create.mockResolvedValue(createMockMediaFile());

      const result = await service.upload(file, 'user-uuid-001');

      expect(result.originalName).toBe('document.pdf');
      expect(storageAdapter.upload).toHaveBeenCalled();
    });

    it('should upload a valid image file', async () => {
      const file = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 2 * 1024 * 1024, // 2MB
        buffer: Buffer.from('fake-image'),
      };

      storageAdapter.upload.mockResolvedValue({
        storagePath: 'uploads/photo.jpg',
        url: 'http://storage/photo.jpg',
      });
      fileRepo.create.mockResolvedValue(
        createMockMediaFile({
          originalName: 'photo.jpg',
          mimeType: 'image/jpeg',
          size: 2 * 1024 * 1024,
        }),
      );

      const result = await service.upload(file, 'user-uuid-001');

      expect(result.mimeType).toBe('image/jpeg');
    });

    it('should reject files with unsupported MIME type', async () => {
      const file = {
        originalname: 'virus.exe',
        mimetype: 'application/x-msdownload',
        size: 1024,
        buffer: Buffer.from('fake'),
      };

      await expect(
        service.upload(file, 'user-uuid-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject images larger than 10MB', async () => {
      const file = {
        originalname: 'huge.jpg',
        mimetype: 'image/jpeg',
        size: 11 * 1024 * 1024, // 11MB
        buffer: Buffer.from('fake'),
      };

      await expect(
        service.upload(file, 'user-uuid-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject videos larger than 500MB', async () => {
      const file = {
        originalname: 'huge.mp4',
        mimetype: 'video/mp4',
        size: 501 * 1024 * 1024, // 501MB
        buffer: Buffer.from('fake'),
      };

      await expect(
        service.upload(file, 'user-uuid-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject PDFs larger than 50MB', async () => {
      const file = {
        originalname: 'huge.pdf',
        mimetype: 'application/pdf',
        size: 51 * 1024 * 1024, // 51MB
        buffer: Buffer.from('fake'),
      };

      await expect(
        service.upload(file, 'user-uuid-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject file when magic bytes reveal a different category than MIME header', async () => {
      mockFromBuffer.mockResolvedValueOnce({ ext: 'exe', mime: 'application/x-msdownload' });

      const file = {
        originalname: 'totally-safe.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('MZ-fake-exe'),
      };

      await expect(
        service.upload(file, 'user-uuid-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject file when magic bytes detect an unallowed type', async () => {
      mockFromBuffer.mockResolvedValueOnce({ ext: 'exe', mime: 'application/x-msdownload' });

      const file = {
        originalname: 'virus.exe',
        mimetype: 'application/x-msdownload',
        size: 1024,
        buffer: Buffer.from('MZ-fake-exe'),
      };

      await expect(
        service.upload(file, 'user-uuid-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept file when magic bytes match the claimed MIME type', async () => {
      mockFromBuffer.mockResolvedValueOnce({ ext: 'pdf', mime: 'application/pdf' });

      const file = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024000,
        buffer: Buffer.from('%PDF-1.4'),
      };

      storageAdapter.upload.mockResolvedValue({
        storagePath: 'uploads/2026/03/document.pdf',
        url: 'http://storage/uploads/2026/03/document.pdf',
      });
      fileRepo.create.mockResolvedValue(createMockMediaFile());

      const result = await service.upload(file, 'user-uuid-001');
      expect(result.originalName).toBe('document.pdf');
    });
  });

  describe('getPresignedUrl', () => {
    it('should return a presigned URL for an existing file', async () => {
      fileRepo.findById.mockResolvedValue(createMockMediaFile());
      storageAdapter.getPresignedUrl.mockResolvedValue(
        'http://storage/signed-url',
      );

      const url = await service.getPresignedUrl('media-uuid-001');

      expect(url).toBe('http://storage/signed-url');
    });

    it('should throw NotFoundException when file not found', async () => {
      fileRepo.findById.mockResolvedValue(null);

      await expect(
        service.getPresignedUrl('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteFile', () => {
    it('should delete file from storage and soft-delete record', async () => {
      fileRepo.findById.mockResolvedValue(createMockMediaFile());
      storageAdapter.delete.mockResolvedValue(undefined);
      fileRepo.softDelete.mockResolvedValue(undefined);

      await service.deleteFile('media-uuid-001');

      expect(storageAdapter.delete).toHaveBeenCalledWith(
        'uploads/2026/03/document.pdf',
      );
      expect(fileRepo.softDelete).toHaveBeenCalledWith('media-uuid-001');
    });
  });
});
