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

/**
 * LessonNote — personal notes a user writes per lesson.
 * One note per user per lesson, upsert semantics.
 * Uniqueness enforced via partial index IDX_NOTE_USER_LESSON WHERE deleted_at IS NULL (see migrations).
 */
@Entity('lesson_notes')
export class LessonNote extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index('IDX_NOTE_USER')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'lesson_id', type: 'uuid' })
  @Index('IDX_NOTE_LESSON')
  lessonId!: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson?: Lesson;

  @Column({ type: 'text' })
  content!: string;
}
