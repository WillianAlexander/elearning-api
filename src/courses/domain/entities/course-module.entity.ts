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

import { Course } from './course.entity';
import { Lesson } from './lesson.entity';

/**
 * CourseModule entity — a section/chapter within a course.
 * Named "CourseModule" to avoid conflict with NestJS Module.
 * Course → **Modules** → Lessons → Content Blocks
 */
@Entity('modules')
export class CourseModule extends BaseEntity {
  @Column({ name: 'course_id', type: 'uuid' })
  @Index('IDX_MODULE_COURSE')
  courseId!: string;

  @ManyToOne(() => Course, (course) => course.modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course?: Relation<Course>;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  @Index('IDX_MODULE_ORDER')
  orderIndex!: number;

  @Column({
    name: 'prerequisite_module_id',
    type: 'uuid',
    nullable: true,
    comment: 'Module that must be completed before this one is accessible',
  })
  prerequisiteModuleId?: string | null;

  @ManyToOne(() => CourseModule, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'prerequisite_module_id' })
  prerequisiteModule?: Relation<CourseModule> | null;

  @OneToMany(() => Lesson, (lesson) => lesson.module, { cascade: true })
  lessons?: Relation<Lesson[]>;
}
