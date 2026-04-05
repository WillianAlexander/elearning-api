import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { User } from '@/users/domain/entities/user.entity';

/**
 * MediaFile entity — tracks uploaded files (images, videos, PDFs).
 * Actual file storage is handled by the storage adapter (MinIO or local mock).
 */
@Entity('media_files')
export class MediaFile extends BaseEntity {
  @Column({ name: 'original_name', type: 'varchar', length: 500 })
  originalName!: string;

  @Column({ name: 'storage_path', type: 'varchar', length: 1000 })
  storagePath!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ type: 'bigint', comment: 'File size in bytes' })
  size!: number;

  @Column({ name: 'uploaded_by_id', type: 'uuid' })
  @Index('IDX_MEDIA_UPLOADED_BY')
  uploadedById!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy?: User;
}
