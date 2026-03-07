import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { BlogCategory } from './blog-category.entity';

export enum BlogStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export enum BlogType {
  ARTICLE = 'ARTICLE',
  TUTORIAL = 'TUTORIAL',
  NEWS = 'NEWS',
  CASE_STUDY = 'CASE_STUDY',
  INTERVIEW = 'INTERVIEW',
  REVIEW = 'REVIEW',
}

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  excerpt: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: BlogStatus,
    default: BlogStatus.DRAFT,
  })
  status: BlogStatus;

  @Column({
    type: 'enum',
    enum: BlogType,
    default: BlogType.ARTICLE,
  })
  type: BlogType;

  @ManyToOne(() => BlogCategory)
  category: BlogCategory;

  @Column({ nullable: true })
  categoryId: string;

  @ManyToOne(() => 'User')
  author: any;

  @Column({ nullable: true })
  authorId: string;

  @Column({ nullable: true })
  featuredImage: string;

  @Column({ nullable: true })
  images: string[]; // Array of image URLs

  @Column({ nullable: true })
  tags: string[]; // Array of tags

  @Column({ nullable: true })
  seoTitle: string;

  @Column({ nullable: true })
  seoDescription: string;

  @Column({ nullable: true })
  seoKeywords: string[];

  @Column({ default: false })
  featured: boolean;

  @Column({ nullable: true })
  featuredAt: Date;

  @Column({ nullable: true })
  publishedAt: Date;

  @Column({ nullable: true })
  publishedBy: string;

  @Column({ nullable: true })
  scheduledAt: Date;

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

  @Column({ nullable: true })
  viewCount: number;

  @Column({ nullable: true })
  likeCount: number;

  @Column({ nullable: true })
  commentCount: number;

  @Column({ nullable: true })
  shareCount: number;

  @Column({ nullable: true })
  readTime: number; // Estimated reading time in minutes

  @Column({ nullable: true })
  difficulty: string; // BEGINNER, INTERMEDIATE, ADVANCED

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  translation: string; // Translated content if needed

  @Column({ nullable: true })
  originalLanguage: string;

  @Column({ nullable: true })
  targetAudience: string[]; // Array of target audiences

  @Column({ nullable: true })
  relatedProducts: string[]; // Array of product IDs

  @Column({ nullable: true })
  relatedServices: string[]; // Array of service IDs

  @Column({ nullable: true })
  externalLinks: string[]; // Array of external URLs

  @Column({ nullable: true })
  internalLinks: string[]; // Array of internal URLs

  @Column({ nullable: true })
  attachments: string[]; // Array of file URLs

  @Column({ nullable: true })
  metadata: string; // JSON string for additional data

  @Column({ nullable: true })
  settings: string; // JSON string with blog settings

  @Column({ nullable: true })
  template: string; // Template used for rendering

  @Column({ nullable: true })
  priority: number; // Priority for ordering

  @Column({ nullable: true })
  sortOrder: number;

  @Column({ nullable: true })
  lastModifiedAt: Date;

  @Column({ nullable: true })
  modifiedBy: string;

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
  notes: string;

  @Column({ nullable: true })
  internalNotes: string; // For staff use

  @Column({ nullable: true })
  source: string; // INTERNAL, EXTERNAL, GUEST

  @Column({ nullable: true })
  sourceUrl: string;

  @Column({ nullable: true })
  sourceAuthor: string;

  @Column({ nullable: true })
  copyright: string;

  @Column({ nullable: true })
  license: string;

  @Column({ nullable: true })
  attribution: string;

  @Column({ nullable: true })
  sponsored: boolean;

  @Column({ nullable: true })
  sponsoredBy: string;

  @Column({ nullable: true })
  campaign: string;

  @Column({ nullable: true })
  campaignId: string;

  @Column({ nullable: true })
  analytics: string; // JSON string with analytics data

  @Column({ nullable: true })
  performance: string; // JSON string with performance metrics

  @Column({ nullable: true })
  aBTest: boolean;

  @Column({ nullable: true })
  aBTestId: string;

  @Column({ nullable: true })
  aBTestVariant: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
