import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { User } from '@/users/domain/entities/user.entity';
import { Lesson } from '@/courses/domain/entities/lesson.entity';
import { Course } from '@/courses/domain/entities/course.entity';

/**
 * Bookmark — allows users to bookmark lessons for quick access.
 * Uniqueness enforced via partial index IDX_BOOKMARK_USER_LESSON WHERE deleted_at IS NULL (see migrations).
 */
@Entity('bookmarks')
export class Bookmark extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index('IDX_BOOKMARK_USER')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'lesson_id', type: 'uuid' })
  @Index('IDX_BOOKMARK_LESSON')
  lessonId!: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson?: Lesson;

  @Column({ name: 'course_id', type: 'uuid' })
  @Index('IDX_BOOKMARK_COURSE')
  courseId!: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course?: Course;
}
