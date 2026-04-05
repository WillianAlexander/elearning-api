import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

/**
 * Represents a permission in the RBAC system.
 * Permissions are defined by module + action (e.g., "courses:create").
 */
@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index('IDX_PERMISSION_NAME', { unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  description!: string;

  @Column({ type: 'varchar', length: 50 })
  module!: string;

  @Column({ type: 'varchar', length: 50 })
  action!: string;
}
