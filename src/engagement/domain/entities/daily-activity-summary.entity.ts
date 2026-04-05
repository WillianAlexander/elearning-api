import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { User } from '@/users/domain/entities/user.entity';

/**
 * DailyActivitySummary — aggregated daily activity for a user.
 * Tracks lesson completions, quiz submissions, and notes created per day.
 * Used for GitHub-style heatmap visualization.
 * Uniqueness enforced via partial index IDX_ACTIVITY_USER_DATE WHERE deleted_at IS NULL.
 */
@Entity('daily_activity_summaries')
export class DailyActivitySummary extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index('IDX_ACTIVITY_USER')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'activity_date', type: 'date' })
  @Index('IDX_ACTIVITY_DATE')
  activityDate!: string;

  @Column({ name: 'lessons_completed', type: 'int', default: 0 })
  lessonsCompleted!: number;

  @Column({ name: 'quizzes_submitted', type: 'int', default: 0 })
  quizzesSubmitted!: number;

  @Column({ name: 'notes_created', type: 'int', default: 0 })
  notesCreated!: number;

  @Column({ name: 'total_actions', type: 'int', default: 0 })
  totalActions!: number;
}
