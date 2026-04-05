import { Entity, Column, Index, ManyToOne, JoinColumn, type Relation } from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import type { ContentBlockType } from '@lms/shared';

import { Lesson } from './lesson.entity';

/**
 * ContentBlock entity — a block of content within a lesson.
 * Stores block-specific data as JSONB (text content, video URL, quiz questions, etc).
 * Course → Modules → Lessons → **Content Blocks**
 */
@Entity('content_blocks')
export class ContentBlock extends BaseEntity {
  @Column({ name: 'lesson_id', type: 'uuid' })
  @Index('IDX_BLOCK_LESSON')
  lessonId!: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.blocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson?: Relation<Lesson>;

  @Column({ type: 'varchar', length: 20 })
  type!: ContentBlockType;

  @Column({ type: 'jsonb', default: '{}' })
  content!: Record<string, unknown>;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  @Index('IDX_BLOCK_ORDER')
  orderIndex!: number;
}
