import { Entity, Column, PrimaryGeneratedColumn, Index, Unique } from 'typeorm';

import type { UserRole } from '@lms/shared';

/**
 * Maps roles to permissions.
 * Each role has a set of permissions that determines access.
 */
@Entity('role_permissions')
@Unique('UQ_ROLE_PERMISSION', ['role', 'permissionId'])
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  @Index('IDX_ROLE_PERMISSION_ROLE')
  role!: UserRole;

  @Column({ name: 'permission_id', type: 'uuid' })
  @Index('IDX_ROLE_PERMISSION_PERMISSION')
  permissionId!: string;
}
