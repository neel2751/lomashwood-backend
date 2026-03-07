import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { LoyaltyTransaction } from './loyalty-transaction.entity';

export enum LoyaltyTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
}

@Entity('loyalty_accounts')
export class LoyaltyAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => 'Customer')
  customer: any;

  @Column({ unique: true })
  customerId: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  points: number;

  @Column({
    type: 'enum',
    enum: LoyaltyTier,
    default: LoyaltyTier.BRONZE,
  })
  tier: LoyaltyTier;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.ACTIVE,
  })
  status: AccountStatus;

  @Column({ nullable: true })
  memberSince: Date;

  @Column({ nullable: true })
  lastActivityAt: Date;

  @Column({ nullable: true })
  birthdayBonusApplied: Date;

  @Column({ nullable: true })
  referralBonus: number;

  @Column({ nullable: true })
  totalEarned: number;

  @Column({ nullable: true })
  totalRedeemed: number;

  @Column({ nullable: true })
  averageMonthlyPoints: number;

  @Column({ nullable: true })
  streakDays: number;

  @Column({ nullable: true })
  longestStreak: number;

  @Column({ nullable: true })
  tierUpgradeDate: Date;

  @Column({ nullable: true })
  tierDowngradeDate: Date;

  @Column({ nullable: true })
  expirationDate: Date;

  @Column({ nullable: true })
  pointsExpiring: number;

  @Column({ nullable: true })
  nextExpirationDate: Date;

  @Column({ nullable: true })
  preferences: string; // JSON string with loyalty preferences

  @Column({ nullable: true })
  notifications: string; // JSON string with notification preferences

  @Column({ nullable: true })
  referralCode: string;

  @Column({ nullable: true })
  referredBy: string;

  @Column({ nullable: true })
  referralCount: number;

  @Column({ nullable: true })
  bonusMultiplier: number;

  @Column({ nullable: true })
  specialOffers: string; // JSON string with special offers

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  metadata: string; // JSON string for additional data

  @OneToMany(() => LoyaltyTransaction, transaction => transaction.account)
  transactions: LoyaltyTransaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
