import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
}

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Customer, customer => customer.reviews)
  customer: Customer;

  @Column()
  customerId: string;

  @Column({ nullable: true })
  productId: string;

  @Column({ nullable: true })
  orderId: string;

  @Column('decimal', { precision: 2, scale: 1 })
  rating: number;

  @Column({ nullable: true })
  title: string;

  @Column()
  content: string;

  @Column({ nullable: true })
  pros: string;

  @Column({ nullable: true })
  cons: string;

  @Column({ nullable: true })
  images: string[]; // Array of image URLs

  @Column({ nullable: true })
  videos: string[]; // Array of video URLs

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  verifiedBy: string;

  @Column({ nullable: true })
  moderationNotes: string;

  @Column({ nullable: true })
  moderatedAt: Date;

  @Column({ nullable: true })
  moderatedBy: string;

  @Column({ nullable: true })
  helpfulVotes: number;

  @Column({ nullable: true })
  notHelpfulVotes: number;

  @Column({ nullable: true })
  response: string;

  @Column({ nullable: true })
  respondedAt: Date;

  @Column({ nullable: true })
  respondedBy: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  metadata: string; // JSON string for additional data

  @Column({ nullable: true })
  tags: string[]; // Array of tags

  @Column({ nullable: true })
  isRecommended: boolean;

  @Column({ nullable: true })
  purchaseDate: Date;

  @Column({ nullable: true })
  verifiedPurchase: boolean;

  @Column({ default: false })
  isAnonymous: boolean;

  @Column({ nullable: true })
  location: string; // Customer location at time of review

  @Column({ nullable: true })
  temperature: string; // Customer sentiment analysis

  @Column({ nullable: true })
  sentiment: number; // Sentiment score

  @Column({ nullable: true })
  language: string; // Review language

  @Column({ nullable: true })
  translation: string; // Translated content if needed

  @Column({ nullable: true })
  originalLanguage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
