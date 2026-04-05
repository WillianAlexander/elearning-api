import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { Lesson } from './lesson.entity';
import { User } from '@/users/domain/entities/user.entity';

/**
 * ContentVersion entity — a snapshot of all content blocks at a point in time.
 * Used for content versioning. NO soft delete — versions are immutable.
 */
@Entity('content_versions')
export class ContentVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'lesson_id', type: 'uuid' })
  @Index('IDX_VERSION_LESSON')
  lessonId!: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson?: Relation<Lesson>;

  @Column({ name: 'version_number', type: 'int' })
  versionNumber!: number;

  @Column({ type: 'jsonb' })
  blocks!: Record<string, unknown>[];

  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy?: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
