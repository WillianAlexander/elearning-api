import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import type { RubricLevel } from './rubric-level.entity';

/**
 * RubricCriterion — a single evaluation criterion within a rubric.
 *
 * Uses string-based relations to avoid circular imports with Rubric and RubricLevel.
 */
@Entity('rubric_criteria')
export class RubricCriterion extends BaseEntity {
  @Column({ name: 'rubric_id', type: 'uuid' })
  @Index('IDX_RUBRIC_CRITERION_RUBRIC')
  rubricId!: string;

  @ManyToOne('Rubric', 'criteria', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rubric_id' })
  rubric?: unknown;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'int', default: 1 })
  weight!: number;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex!: number;

  @OneToMany('RubricLevel', 'criterion', { cascade: true })
  levels?: RubricLevel[];
}
