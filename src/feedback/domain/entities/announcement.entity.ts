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
 * Announcement — instructor posts visible to enrolled users.
 * Only the course instructor (createdById) can create announcements.
 */
@Entity('announcements')
export class Announcement extends BaseEntity {
  @Column({ name: 'course_id', type: 'uuid' })
  @Index('IDX_ANNOUNCEMENT_COURSE')
  courseId!: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @Column({ name: 'author_id', type: 'uuid' })
  @Index('IDX_ANNOUNCEMENT_AUTHOR')
  authorId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author?: User;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date | null;
}
