import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Review } from '../../reviews/entities/review.entity';
import { SupportTicket } from '../../support/entities/support-ticket.entity';
import { LoyaltyAccount } from '../../loyalty/entities/loyalty-account.entity';
import { Wishlist } from '../../wishlist/entities/wishlist.entity';
import { SavedDesign } from '../../saved-designs/entities/saved-design.entity';

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum MembershipTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
}

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  address2: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  preferences: string; // JSON string with customer preferences

  @Column({
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.ACTIVE,
  })
  status: CustomerStatus;

  @Column({
    type: 'enum',
    enum: MembershipTier,
    default: MembershipTier.BRONZE,
  })
  membershipTier: MembershipTier;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verificationDate: Date;

  @Column({ nullable: true })
  verificationNotes: string;

  @Column({ nullable: true })
  deactivationReason: string;

  @Column({ nullable: true })
  deactivatedAt: Date;

  @Column({ nullable: true })
  reactivationReason: string;

  @Column({ nullable: true })
  reactivatedAt: Date;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  registrationSource: string;

  @Column({ nullable: true })
  referralCode: string;

  @Column({ nullable: true })
  referredBy: string;

  @Column({ nullable: true })
  marketingConsent: boolean;

  @Column({ nullable: true })
  communicationPreferences: string; // JSON string with communication preferences

  @Column({ nullable: true })
  socialProfiles: string; // JSON string with social media profiles

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  jobTitle: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  tags: string[]; // Array of customer tags

  @Column({ nullable: true })
  customFields: string; // JSON string for custom fields

  @OneToMany(() => Review, review => review.customer)
  reviews: Review[];

  @OneToMany(() => SupportTicket, ticket => ticket.customer)
  supportTickets: SupportTicket[];

  @OneToMany(() => LoyaltyAccount, loyaltyAccount => loyaltyAccount.customer)
  loyaltyAccount: LoyaltyAccount[];

  @OneToMany(() => Wishlist, wishlist => wishlist.customer)
  wishlists: Wishlist[];

  @OneToMany(() => SavedDesign, savedDesign => savedDesign.customer)
  savedDesigns: SavedDesign[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
