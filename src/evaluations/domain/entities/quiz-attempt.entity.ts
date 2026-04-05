import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { Enrollment } from '@/enrollments/domain/entities/enrollment.entity';
import { ContentBlock } from '@/courses/domain/entities/content-block.entity';
import type { QuizAnswerRecord } from '@lms/shared';

/**
 * QuizAttempt — records a student's submission of a quiz.
 * Each attempt stores the full answer set and grading result.
 */
@Entity('quiz_attempts')
export class QuizAttempt extends BaseEntity {
  @Column({ name: 'enrollment_id', type: 'uuid' })
  @Index('IDX_QUIZ_ATTEMPT_ENROLLMENT')
  enrollmentId!: string;

  @ManyToOne(() => Enrollment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment?: Enrollment;

  @Column({ name: 'content_block_id', type: 'uuid' })
  @Index('IDX_QUIZ_ATTEMPT_CONTENT_BLOCK')
  contentBlockId!: string;

  @ManyToOne(() => ContentBlock, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_block_id' })
  contentBlock?: ContentBlock;

  @Column({ type: 'jsonb', default: '[]' })
  answers!: QuizAnswerRecord[];

  @Column({ type: 'smallint' })
  score!: number;

  @Column({ name: 'total_questions', type: 'smallint' })
  totalQuestions!: number;

  @Column({ name: 'correct_count', type: 'smallint' })
  correctCount!: number;

  @Column({ type: 'boolean' })
  passed!: boolean;

  @Column({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt!: Date;
}
