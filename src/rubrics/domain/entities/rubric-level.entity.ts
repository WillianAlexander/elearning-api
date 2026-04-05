import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';

/**
 * RubricLevel — a scoring level within a criterion (e.g., "Excelente", "Bueno", "Insuficiente").
 *
 * Uses string-based relation to avoid circular import with RubricCriterion.
 */
@Entity('rubric_levels')
export class RubricLevel extends BaseEntity {
  @Column({ name: 'criterion_id', type: 'uuid' })
  @Index('IDX_RUBRIC_LEVEL_CRITERION')
  criterionId!: string;

  @ManyToOne('RubricCriterion', 'levels', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'criterion_id' })
  criterion?: unknown;

  @Column({ type: 'varchar', length: 100 })
  label!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'int' })
  score!: number;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex!: number;
}
