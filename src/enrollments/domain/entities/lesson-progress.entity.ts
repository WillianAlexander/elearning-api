import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { Lesson } from '@/courses/domain/entities/lesson.entity';

import { Enrollment } from './enrollment.entity';

/**
 * LessonProgress — tracks completion and bookmark state for a single lesson
 * within an enrollment.
 * Uniqueness enforced via partial index IDX_PROGRESS_ENROLLMENT_LESSON WHERE deleted_at IS NULL (see migrations).
 */
@Entity('lesson_progress')
export class LessonProgress extends BaseEntity {
  @Column({ name: 'enrollment_id', type: 'uuid' })
  enrollmentId!: string;

  @ManyToOne(() => Enrollment, (e) => e.lessonProgress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment?: Relation<Enrollment>;

  @Column({ name: 'lesson_id', type: 'uuid' })
  lessonId!: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson?: Lesson;

  @Column({ type: 'boolean', default: false })
  completed!: boolean;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @Column({ name: 'last_position', type: 'jsonb', nullable: true })
  lastPosition?: Record<string, unknown> | null;

  @Column({ name: 'time_spent_seconds', type: 'int', default: 0 })
  timeSpentSeconds!: number;
}
