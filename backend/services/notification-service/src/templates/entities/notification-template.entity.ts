import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TemplateType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook',
}

export enum TemplateStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

@Entity('notification_templates')
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: TemplateType })
  type: TemplateType;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  subject: string;

  @Column('text')
  content: string;

  @Column('text', { nullable: true })
  htmlContent: string;

  @Column('text', { nullable: true })
  smsContent: string;

  @Column('text', { nullable: true })
  pushContent: string;

  @Column('json', { nullable: true })
  variables: string[];

  @Column('json', { nullable: true })
  tags: string[];

  @Column({ type: 'enum', enum: TemplateStatus, default: TemplateStatus.DRAFT })
  status: TemplateStatus;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ default: false })
  isFavorite: boolean;

  @Column({ default: false })
  isLocked: boolean;

  @Column({ nullable: true })
  lockedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  lockedAt: Date;

  @Column({ nullable: true })
  lockReason: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  approvalNotes: string;

  @Column({ nullable: true })
  rejectedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ default: 0 })
  usageCount: number;

  @Column('json', { nullable: true })
  metadata: any;

  @Column({ nullable: true })
  originalTemplateId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
