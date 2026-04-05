import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { Course } from '@/courses/domain/entities/course.entity';
import type { RubricCriterion } from './rubric-criterion.entity';

/**
 * Rubric — evaluation template with criteria and levels for instructor assessment.
 */
@Entity('rubrics')
export class Rubric extends BaseEntity {
  @Column({ name: 'course_id', type: 'uuid' })
  @Index('IDX_RUBRIC_COURSE')
  courseId!: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @OneToMany('RubricCriterion', 'rubric', { cascade: true })
  criteria?: RubricCriterion[];
}
