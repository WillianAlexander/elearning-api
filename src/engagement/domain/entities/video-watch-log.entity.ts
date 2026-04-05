import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { User } from '@/users/domain/entities/user.entity';
import { Lesson } from '@/courses/domain/entities/lesson.entity';

/**
 * VideoWatchLog — tracks actual video watch time via heartbeat mechanism.
 * Client sends a heartbeat POST every 15 seconds.
 * One record per user+lesson+contentBlock (upsert semantics).
 * Uniqueness enforced via partial index WHERE deleted_at IS NULL.
 */
@Entity('video_watch_logs')
export class VideoWatchLog extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index('IDX_VIDEO_WATCH_USER')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'lesson_id', type: 'uuid' })
  @Index('IDX_VIDEO_WATCH_LESSON')
  lessonId!: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson?: Lesson;

  @Column({ name: 'content_block_id', type: 'uuid' })
  @Index('IDX_VIDEO_WATCH_BLOCK')
  contentBlockId!: string;

  @Column({ name: 'watched_seconds', type: 'int', default: 0 })
  watchedSeconds!: number;

  @Column({ name: 'total_duration_seconds', type: 'int', default: 0 })
  totalDurationSeconds!: number;

  @Column({
    name: 'last_position',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  lastPosition!: number;
}
