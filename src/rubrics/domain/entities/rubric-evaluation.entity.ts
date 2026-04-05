import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { User } from '@/users/domain/entities/user.entity';
import { Enrollment } from '@/enrollments/domain/entities/enrollment.entity';
import { Rubric } from './rubric.entity';

/**
 * Score entry within JSONB scores array.
 */
export interface RubricScoreEntry {
  criterionId: string;
  levelId: string;
  comment?: string;
}

/**
 * RubricEvaluation — an instructor's assessment of an enrollment using a rubric.
 */
@Entity('rubric_evaluations')
export class RubricEvaluation extends BaseEntity {
  @Column({ name: 'rubric_id', type: 'uuid' })
  @Index('IDX_RUBRIC_EVAL_RUBRIC')
  rubricId!: string;

  @ManyToOne(() => Rubric, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rubric_id' })
  rubric?: Rubric;

  @Column({ name: 'evaluator_id', type: 'uuid' })
  @Index('IDX_RUBRIC_EVAL_EVALUATOR')
  evaluatorId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evaluator_id' })
  evaluator?: User;

  @Column({ name: 'enrollment_id', type: 'uuid' })
  @Index('IDX_RUBRIC_EVAL_ENROLLMENT')
  enrollmentId!: string;

  @ManyToOne(() => Enrollment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment?: Enrollment;

  @Column({ type: 'jsonb', default: [] })
  scores!: RubricScoreEntry[];

  @Column({ name: 'total_score', type: 'int', default: 0 })
  totalScore!: number;

  @Column({ name: 'max_score', type: 'int', default: 0 })
  maxScore!: number;

  @Column({ type: 'text', nullable: true })
  feedback?: string | null;
}
