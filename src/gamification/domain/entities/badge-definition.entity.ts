import {
  Entity,
  Column,
} from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';

/**
 * BadgeDefinition — defines a badge that users can earn.
 * Criteria is a JSONB column that describes the conditions for earning the badge.
 * Uniqueness on name enforced via partial index IDX_BADGE_DEF_NAME WHERE deleted_at IS NULL (see migrations).
 */
@Entity('badge_definitions')
export class BadgeDefinition extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 100, default: 'emoji_events' })
  icon!: string;

  @Column({ type: 'jsonb', default: '{}' })
  criteria!: BadgeCriteria;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}

export type BadgeCriteria =
  | { type: 'course_completed' }
  | { type: 'courses_completed'; count: number }
  | { type: 'quiz_score'; minScore: number }
  | { type: 'streak_days'; days: number };
