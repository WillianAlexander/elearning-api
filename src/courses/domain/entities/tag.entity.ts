import { Entity, Column } from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';

/**
 * Tag entity for labeling and filtering courses.
 * Uniqueness enforced via partial index IDX_TAG_NAME WHERE deleted_at IS NULL (see migrations).
 */
@Entity('tags')
export class Tag extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;
}
