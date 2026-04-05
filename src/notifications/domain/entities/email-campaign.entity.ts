import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { User } from '@/users/domain/entities/user.entity';
import { Course } from '@/courses/domain/entities/course.entity';

/**
 * EmailCampaign — record of a bulk email sent to enrolled users.
 */
@Entity('email_campaigns')
export class EmailCampaign extends BaseEntity {
  @Column({ name: 'course_id', type: 'uuid' })
  @Index('IDX_EMAIL_CAMPAIGN_COURSE')
  courseId!: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'sent_by', type: 'uuid' })
  sentBy!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sent_by' })
  sender?: User;

  @Column({ name: 'sent_at', type: 'timestamptz', default: () => 'now()' })
  sentAt!: Date;

  @Column({ name: 'recipient_count', type: 'int', default: 0 })
  recipientCount!: number;

  @Column({ name: 'failed_count', type: 'int', default: 0 })
  failedCount!: number;
}
