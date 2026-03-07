import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';

export enum TransactionType {
  EARNED = 'EARNED',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
  ADJUSTED = 'ADJUSTED',
  REFUNDED = 'REFUNDED',
  BONUS = 'BONUS',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('loyalty_transactions')
export class LoyaltyTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => 'LoyaltyAccount', account => account.transactions)
  account: any;

  @Column()
  accountId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  points: number;

  @Column({ nullable: true })
  balance: number; // Balance after transaction

  @Column()
  description: string;

  @Column({ nullable: true })
  reference: string; // Order ID, Reward ID, etc.

  @Column({ nullable: true })
  referenceType: string; // ORDER, REWARD, ADJUSTMENT, etc.

  @Column({ nullable: true })
  orderId: string;

  @Column({ nullable: true })
  rewardId: string;

  @Column({ nullable: true })
  promotionId: string;

  @Column({ nullable: true })
  campaignId: string;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  processedAt: Date;

  @Column({ nullable: true })
  failureReason: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  metadata: string; // JSON string for additional data

  @Column({ nullable: true })
  tags: string[]; // Array of tags

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  subcategory: string;

  @Column({ nullable: true })
  source: string; // PURCHASE, REFERRAL, BONUS, ADJUSTMENT

  @Column({ nullable: true })
  sourceDetails: string; // JSON string with source-specific data

  @Column({ nullable: true })
  batchId: string; // For bulk transactions

  @Column({ nullable: true })
  reversalReason: string;

  @Column({ nullable: true })
  reversedAt: Date;

  @Column({ nullable: true })
  reversalId: string;

  @Column({ nullable: true })
  multiplier: number; // Points multiplier applied

  @Column({ nullable: true })
  basePoints: number; // Original points before multiplier

  @Column({ nullable: true })
  bonusPoints: number; // Additional bonus points

  @Column({ nullable: true })
  isTaxable: boolean;

  @Column({ nullable: true })
  taxAmount: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  exchangeRate: number;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
