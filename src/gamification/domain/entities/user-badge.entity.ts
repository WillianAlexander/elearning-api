import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { User } from '@/users/domain/entities/user.entity';

import { BadgeDefinition } from './badge-definition.entity';

/**
 * UserBadge — tracks when a user earns a specific badge.
 * Uniqueness enforced via partial index IDX_USER_BADGE_UNIQUE WHERE deleted_at IS NULL (see migrations).
 */
@Entity('user_badges')
export class UserBadge extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index('IDX_USER_BADGE_USER')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'badge_definition_id', type: 'uuid' })
  @Index('IDX_USER_BADGE_DEFINITION')
  badgeDefinitionId!: string;

  @ManyToOne(() => BadgeDefinition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'badge_definition_id' })
  badgeDefinition?: BadgeDefinition;

  @Column({ name: 'earned_at', type: 'timestamptz', default: () => 'now()' })
  earnedAt!: Date;
}
