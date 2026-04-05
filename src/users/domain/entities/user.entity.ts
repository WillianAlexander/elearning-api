import {
  Entity,
  Column,
} from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import type { UserRole } from '@lms/shared';

/**
 * LMS User entity.
 * Represents an employee who can access the learning platform.
 * Identity managed via Azure AD, area/cargo from Microsoft Graph.
 *
 * Uniqueness enforced via partial indexes WHERE deleted_at IS NULL (see migrations):
 * - IDX_USER_EMAIL, IDX_USER_AZURE_AD_ID, IDX_USER_GOOGLE_ID
 */
@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 20, nullable: true })
  cedula?: string | null;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 150 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 150 })
  lastName!: string;

  @Column({ type: 'varchar', length: 50, default: 'colaborador' })
  role!: UserRole;

  @Column({ type: 'varchar', length: 150, default: '' })
  area!: string;

  @Column({ type: 'varchar', length: 150, default: '' })
  cargo!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt?: Date | null;

  @Column({
    name: 'azure_ad_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  azureAdId?: string | null;

  @Column({
    name: 'google_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  googleId?: string | null;

  @Column({ name: 'area_overridden', type: 'boolean', default: false })
  areaOverridden!: boolean;

  @Column({ name: 'cargo_overridden', type: 'boolean', default: false })
  cargoOverridden!: boolean;

  /** Computed full name */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
