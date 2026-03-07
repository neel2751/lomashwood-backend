import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum EmailStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
  SOFT_BOUNCED = 'SOFT_BOUNCED',
  COMPLAINED = 'COMPLAINED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
}

export enum EmailProvider {
  SENDGRID = 'sendgrid',
  NODEMAILER = 'nodemailer',
  MAILGUN = 'mailgun',
  AWS_SES = 'aws-ses',
  POSTMARK = 'postmark',
}

@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  to: string;

  @Column({ nullable: true })
  cc: string;

  @Column({ nullable: true })
  bcc: string;

  @Column()
  from: string;

  @Column({ nullable: true })
  replyTo: string;

  @Column()
  subject: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  textContent: string;

  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.PENDING,
  })
  status: EmailStatus;

  @Column({
    type: 'enum',
    enum: EmailProvider,
    default: EmailProvider.SENDGRID,
  })
  provider: EmailProvider;

  @Column({ nullable: true })
  messageId: string;

  @Column({ nullable: true })
  externalId: string;

  @Column({ nullable: true })
  trackingId: string;

  @Column({ nullable: true })
  template: string;

  @Column({ type: 'json', nullable: true })
  templateData: any;

  @Column({ type: 'json', nullable: true })
  attachments: any[];

  @Column({ nullable: true })
  priority: string;

  @Column({ type: 'json', nullable: true })
  headers: any;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @Column({ nullable: true })
  openedAt: Date;

  @Column({ nullable: true })
  clickedAt: Date;

  @Column({ nullable: true })
  bouncedAt: Date;

  @Column({ nullable: true })
  complainedAt: Date;

  @Column({ nullable: true })
  unsubscribedAt: Date;

  @Column({ nullable: true })
  failedAt: Date;

  @Column({ nullable: true })
  failureReason: string;

  @Column({ nullable: true })
  bounceType: string;

  @Column({ nullable: true })
  bounceReason: string;

  @Column({ nullable: true })
  complaintReason: string;

  @Column({ nullable: true })
  unsubscribeReason: string;

  @Column({ nullable: true })
  retryCount: number;

  @Column({ nullable: true })
  maxRetries: number;

  @Column({ nullable: true })
  nextRetryAt: Date;

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true })
  locale: string;

  @Column({ nullable: true })
  campaignId: string;

  @Column({ nullable: true })
  batchId: string;

  @Column({ nullable: true })
  correlationId: string;

  @Column({ nullable: true })
  parentEmailId: string;

  @Column({ type: 'json', nullable: true })
  childEmailIds: string[];

  @Column({ nullable: true })
  clickThroughUrl: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  platform: string;

  @Column({ nullable: true })
  device: string;

  @Column({ nullable: true })
  browser: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  latitude: number;

  @Column({ nullable: true })
  longitude: number;

  @Column({ nullable: true })
  responseCode: number;

  @Column({ nullable: true })
  responseMessage: string;

  @Column({ type: 'json', nullable: true })
  providerResponse: any;

  @Column({ nullable: true })
  deliveryTime: number;

  @Column({ nullable: true })
  processingTime: number;

  @Column({ nullable: true })
  queueTime: number;

  @Column({ nullable: true })
  workerId: string;

  @Column({ nullable: true })
  serverId: string;

  @Column({ nullable: true })
  environment: string;

  @Column({ nullable: true })
  version: string;

  @Column({ nullable: true })
  metadata: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  internalNotes: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  rejectedAt: Date;

  @Column({ nullable: true })
  rejectedBy: string;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  archivedAt: Date;

  @Column({ nullable: true })
  archivedBy: string;

  @Column({ nullable: true })
  deletedAt: Date;

  @Column({ nullable: true })
  deletedBy: string;

  @Column({ nullable: true })
  deletionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
