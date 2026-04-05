import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Domain
import { MEDIA_UPLOAD_PORT } from './domain/ports';

// Infrastructure
import { MediaFileRepository } from './infrastructure/media-file.repository';
import { MinioStorageAdapter } from './infrastructure/minio-storage.adapter';
import { MockStorageAdapter } from './infrastructure/mock-storage.adapter';

// Application
import { MediaService } from './application/media.service';

// Presentation
import { MediaController } from './presentation/media.controller';

// Auth module (for guards)
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MediaController],
  providers: [
    MediaFileRepository,
    MediaService,
    {
      provide: MEDIA_UPLOAD_PORT,
      useFactory: (config: ConfigService) => {
        if (config.get<boolean>('minio.useMock') === true) {
          return new MockStorageAdapter();
        }
        return new MinioStorageAdapter(config);
      },
      inject: [ConfigService],
    },
  ],
  exports: [MediaService],
})
export class MediaModule {}
