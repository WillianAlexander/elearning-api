import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { User } from '@/users/domain/entities/user.entity';
import { Course } from '@/courses/domain/entities/course.entity';

/**
 * CourseReview — star rating + text review per course.
 * Only users with COMPLETED enrollment can review.
 * One review per user per course (partial unique index WHERE deleted_at IS NULL).
 */
@Entity('course_reviews')
export class CourseReview extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index('IDX_REVIEW_USER')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'course_id', type: 'uuid' })
  @Index('IDX_REVIEW_COURSE')
  courseId!: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @Column({ type: 'smallint' })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment?: string | null;
}
