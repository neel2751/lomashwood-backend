import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED',
}

@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ nullable: true })
  recipient: string;

  @Column({ nullable: true })
  sender: string;

  @Column({ nullable: true })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @Column({ nullable: true })
  archivedAt: Date;

  @Column({ nullable: true })
  metadata: string;

  @Column({ nullable: true })
  templateId: string;

  @Column({ nullable: true })
  templateData: string;

  @Column({ nullable: true })
  priority: number;

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @Column({ nullable: true })
  failedAt: Date;

  @Column({ nullable: true })
  failureReason: string;

  @Column({ nullable: true })
  retryCount: number;

  @Column({ nullable: true })
  maxRetries: number;

  @Column({ nullable: true })
  nextRetryAt: Date;

  @Column({ nullable: true })
  externalId: string;

  @Column({ nullable: true })
  trackingId: string;

  @Column({ nullable: true })
  clickThroughUrl: string;

  @Column({ nullable: true })
  clickThroughAt: Date;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  iconUrl: string;

  @Column({ nullable: true })
  badge: number;

  @Column({ nullable: true })
  sound: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  tags: string[];

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true })
  locale: string;

  @Column({ nullable: true })
  platform: string;

  @Column({ nullable: true })
  deviceToken: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  campaignId: string;

  @Column({ nullable: true })
  batchId: string;

  @Column({ nullable: true })
  correlationId: string;

  @Column({ nullable: true })
  parentNotificationId: string;

  @Column({ nullable: true })
  childNotificationIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
