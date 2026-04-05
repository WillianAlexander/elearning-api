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
import type { LessonType } from '@lms/shared';

import { CourseModule } from './course-module.entity';
import { ContentBlock } from './content-block.entity';
import { ContentVersion } from './content-version.entity';

/**
 * Lesson entity — a single learning unit within a module.
 * Course → Modules → **Lessons** → Content Blocks
 */
@Entity('lessons')
export class Lesson extends BaseEntity {
  @Column({ name: 'module_id', type: 'uuid' })
  @Index('IDX_LESSON_MODULE')
  moduleId!: string;

  @ManyToOne(() => CourseModule, (m) => m.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module?: Relation<CourseModule>;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 30, default: 'text' })
  type!: LessonType;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  @Index('IDX_LESSON_ORDER')
  orderIndex!: number;

  @Column({
    name: 'estimated_duration',
    type: 'int',
    nullable: true,
    comment: 'Estimated duration in minutes',
  })
  estimatedDuration?: number | null;

  @OneToMany(() => ContentBlock, (block) => block.lesson, { cascade: true })
  blocks?: Relation<ContentBlock[]>;

  @OneToMany(() => ContentVersion, (version) => version.lesson)
  versions?: Relation<ContentVersion[]>;
}
