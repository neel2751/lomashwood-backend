import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';

export enum WishlistType {
  PERSONAL = 'PERSONAL',
  GIFT = 'GIFT',
  COLLABORATIVE = 'COLLABORATIVE',
}

export enum WishlistStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

@Entity('wishlists')
export class Wishlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => 'Customer')
  customer: any;

  @Column()
  customerId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: WishlistType,
    default: WishlistType.PERSONAL,
  })
  type: WishlistType;

  @Column({
    type: 'enum',
    enum: WishlistStatus,
    default: WishlistStatus.ACTIVE,
  })
  status: WishlistStatus;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ nullable: true })
  shareToken: string;

  @Column({ nullable: true })
  shareExpiresAt: Date;

  @Column({ nullable: true })
  sharedAt: Date;

  @Column({ nullable: true })
  sharedBy: string;

  @Column({ nullable: true })
  copiedFrom: string;

  @Column({ nullable: true })
  copiedBy: string;

  @Column({ nullable: true })
  copiedAt: Date;

  @Column({ nullable: true })
  collaborators: string[]; // Array of customer IDs who can collaborate

  @Column({ nullable: true })
  permissions: string; // JSON string with permission settings

  @Column({ nullable: true })
  items: any[]; // Array of wishlist items

  @Column({ nullable: true })
  itemCount: number;

  @Column({ nullable: true })
  totalValue: number; // Total estimated value of items

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  priority: number; // Wishlist priority for sorting

  @Column({ nullable: true })
  tags: string[]; // Array of tags for categorization

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  subcategory: string;

  @Column({ nullable: true })
  occasion: string; // Birthday, Wedding, etc.

  @Column({ nullable: true })
  eventDate: Date;

  @Column({ nullable: true })
  reminderDate: Date;

  @Column({ nullable: true })
  reminderSent: boolean;

  @Column({ nullable: true })
  isPurchased: boolean;

  @Column({ nullable: true })
  purchasedAt: Date;

  @Column({ nullable: true })
  purchasedBy: string;

  @Column({ nullable: true })
  purchaseNotes: string;

  @Column({ nullable: true })
  metadata: string; // JSON string for additional data

  @Column({ nullable: true })
  settings: string; // JSON string with wishlist settings

  @Column({ nullable: true })
  theme: string; // Visual theme for wishlist display

  @Column({ nullable: true })
  coverImage: string;

  @Column({ nullable: true })
  isDefault: boolean;

  @Column({ nullable: true })
  sortOrder: number;

  @Column({ nullable: true })
  lastViewedAt: Date;

  @Column({ nullable: true })
  viewCount: number;

  @Column({ nullable: true })
  likeCount: number;

  @Column({ nullable: true })
  shareCount: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  internalNotes: string; // For staff use

  @Column({ nullable: true })
  isFeatured: boolean;

  @Column({ nullable: true })
  featuredAt: Date;

  @Column({ nullable: true })
  featuredBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
