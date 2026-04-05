import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  type Relation,
} from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { User } from '@/users/domain/entities/user.entity';
import { Course } from '@/courses/domain/entities/course.entity';
import type { EnrollmentStatus } from '@lms/shared';

import { LessonProgress } from './lesson-progress.entity';

/**
 * Enrollment — links a user to a course with lifecycle tracking.
 * Uniqueness enforced via partial index IDX_ENROLLMENT_USER_COURSE WHERE deleted_at IS NULL (see migrations).
 */
@Entity('enrollments')
export class Enrollment extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index('IDX_ENROLLMENT_USER')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'course_id', type: 'uuid' })
  @Index('IDX_ENROLLMENT_COURSE')
  courseId!: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  @Index('IDX_ENROLLMENT_STATUS')
  status!: EnrollmentStatus;

  @Column({ name: 'enrolled_at', type: 'timestamptz' })
  enrolledAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @Column({ name: 'dropped_at', type: 'timestamptz', nullable: true })
  droppedAt?: Date | null;

  @Column({ name: 'expired_at', type: 'timestamptz', nullable: true })
  expiredAt?: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  @Column({ name: 'enrolled_by_id', type: 'uuid', nullable: true })
  enrolledById?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'enrolled_by_id' })
  enrolledBy?: User | null;

  @Column({ name: 'last_accessed_at', type: 'timestamptz', nullable: true })
  lastAccessedAt?: Date | null;

  @Column({
    name: 'progress_percentage',
    type: 'smallint',
    default: 0,
  })
  progressPercentage!: number;

  @Column({ name: 'verification_code', type: 'uuid', nullable: true })
  verificationCode?: string | null;

  @OneToMany(() => LessonProgress, (lp) => lp.enrollment, { cascade: true })
  lessonProgress?: Relation<LessonProgress[]>;
}
