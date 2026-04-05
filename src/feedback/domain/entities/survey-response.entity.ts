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

import { SurveyTemplate } from './survey-template.entity';

/**
 * Individual answer within a survey response.
 */
export interface SurveyAnswer {
  questionId: string;
  value: string | number;
}

/**
 * SurveyResponse — a user's answers to a survey template.
 * One response per user per template (via enrollment).
 * Uniqueness enforced via partial index WHERE deleted_at IS NULL.
 */
@Entity('survey_responses')
export class SurveyResponse extends BaseEntity {
  @Column({ name: 'template_id', type: 'uuid' })
  @Index('IDX_SURVEY_RESPONSE_TEMPLATE')
  templateId!: string;

  @ManyToOne(() => SurveyTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template?: SurveyTemplate;

  @Column({ name: 'enrollment_id', type: 'uuid' })
  @Index('IDX_SURVEY_RESPONSE_ENROLLMENT')
  enrollmentId!: string;

  @ManyToOne(() => Enrollment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment?: Enrollment;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index('IDX_SURVEY_RESPONSE_USER')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'jsonb', default: '[]' })
  answers!: SurveyAnswer[];
}
