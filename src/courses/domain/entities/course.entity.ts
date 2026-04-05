import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
  type Relation,
} from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { User } from '@/users/domain/entities/user.entity';
import type { CourseStatus, DifficultyLevel } from '@lms/shared';

import { Category } from './category.entity';
import { Tag } from './tag.entity';
import { CourseModule } from './course-module.entity';

/**
 * Course entity — the top level of the learning hierarchy.
 * Course → Modules → Lessons → Content Blocks
 */
@Entity('courses')
export class Course extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  /** Uniqueness enforced via partial index IDX_COURSE_SLUG WHERE deleted_at IS NULL (see migrations) */
  @Column({ type: 'varchar', length: 300 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 500, nullable: true })
  thumbnailUrl?: string | null;

  @Column({
    name: 'estimated_duration',
    type: 'int',
    nullable: true,
    comment: 'Estimated duration in minutes',
  })
  estimatedDuration?: number | null;

  @Column({
    name: 'difficulty_level',
    type: 'varchar',
    length: 30,
    default: 'beginner',
  })
  difficultyLevel!: DifficultyLevel;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  @Index('IDX_COURSE_STATUS')
  status!: CourseStatus;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId?: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: Category | null;

  @Column({ name: 'created_by_id', type: 'uuid' })
  @Index('IDX_COURSE_INSTRUCTOR')
  createdById!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy?: User;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date | null;

  @OneToMany(() => CourseModule, (m) => m.course, { cascade: true })
  modules?: Relation<CourseModule[]>;

  @ManyToMany(() => Tag, { cascade: true })
  @JoinTable({
    name: 'course_tags',
    joinColumn: { name: 'course_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags?: Tag[];

  @Column({
    name: 'completion_criteria',
    type: 'jsonb',
    default: '{"requireAllLessons":true,"requireQuizPass":false,"minQuizScore":0}',
    comment: 'Configurable criteria for course completion',
  })
  completionCriteria!: CompletionCriteria;

  @Column({
    name: 'rejection_reason',
    type: 'text',
    nullable: true,
    comment: 'Reason provided by admin when rejecting a course from pending_review back to draft',
  })
  rejectionReason?: string | null;

  @Column({
    name: 'avg_rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
    comment: 'Denormalized average review rating (1-5)',
  })
  avgRating!: number;

  @Column({
    name: 'review_count',
    type: 'int',
    default: 0,
    comment: 'Denormalized count of reviews',
  })
  reviewCount!: number;
}

export interface CompletionCriteria {
  requireAllLessons: boolean;
  requireQuizPass: boolean;
  minQuizScore: number;
}
