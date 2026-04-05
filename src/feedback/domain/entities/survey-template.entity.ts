import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { Course } from '@/courses/domain/entities/course.entity';

/**
 * Survey question within a template.
 */
export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'rating' | 'text';
  required: boolean;
}

/**
 * SurveyTemplate — configurable post-course survey.
 * Admin creates templates and assigns them to courses.
 * Questions stored as JSONB.
 */
@Entity('survey_templates')
export class SurveyTemplate extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'course_id', type: 'uuid', nullable: true })
  @Index('IDX_SURVEY_TEMPLATE_COURSE')
  courseId?: string | null;

  @ManyToOne(() => Course, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'course_id' })
  course?: Course | null;

  @Column({ type: 'jsonb', default: '[]' })
  questions!: SurveyQuestion[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
