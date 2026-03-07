import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CategoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Entity('blog_categories')
export class BlogCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: CategoryStatus,
    default: CategoryStatus.ACTIVE,
  })
  status: CategoryStatus;

  @Column({ nullable: true })
  image: string; // Category image URL

  @Column({ nullable: true })
  icon: string; // Icon URL or class name

  @Column({ nullable: true })
  color: string; // Hex color code

  @Column({ nullable: true })
  parentId: string; // For nested categories

  @Column({ nullable: true })
  sortOrder: number;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ nullable: true })
  seoTitle: string;

  @Column({ nullable: true })
  seoDescription: string;

  @Column({ nullable: true })
  seoKeywords: string[];

  @Column({ nullable: true })
  metadata: string; // JSON string for additional data

  @Column({ nullable: true })
  settings: string; // JSON string with category settings

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  internalNotes: string; // For staff use

  @Column({ nullable: true })
  featured: boolean;

  @Column({ nullable: true })
  featuredAt: Date;

  @Column({ nullable: true })
  featuredBy: string;

  @Column({ nullable: true })
  blogCount: number; // Number of blogs in this category

  @Column({ nullable: true })
  totalViews: number; // Total views of all blogs in this category

  @Column({ nullable: true })
  lastBlogAt: Date; // Date of last blog in this category

  @Column({ nullable: true })
  lastBlogId: string; // ID of last blog in this category

  @Column({ nullable: true })
  permissions: string; // JSON string with permission settings

  @Column({ nullable: true })
  allowedRoles: string[]; // Array of roles that can post to this category

  @Column({ nullable: true })
  moderationRequired: boolean;

  @Column({ nullable: true })
  moderators: string[]; // Array of user IDs who can moderate

  @Column({ nullable: true })
  autoPublish: boolean;

  @Column({ nullable: true })
  notificationSettings: string; // JSON string with notification preferences

  @Column({ nullable: true })
  template: string; // Template for blogs in this category

  @Column({ nullable: true })
  defaultTags: string[]; // Default tags for blogs in this category

  @Column({ nullable: true })
  relatedCategories: string[]; // Array of related category IDs

  @Column({ nullable: true })
  crossPosting: boolean; // Allow cross-posting to other categories

  @Column({ nullable: true })
  maxBlogLength: number; // Maximum blog length in characters

  @Column({ nullable: true })
  minBlogLength: number; // Minimum blog length in characters

  @Column({ nullable: true })
  allowedFileTypes: string[]; // Array of allowed file types

  @Column({ nullable: true })
  maxFileSize: number; // Maximum file size in bytes

  @Column({ nullable: true })
  imageRequirements: string; // JSON string with image requirements

  @Column({ nullable: true })
  contentGuidelines: string; // Content guidelines for this category

  @Column({ nullable: true })
  styleGuide: string; // Style guide for this category

  @Column({ nullable: true })
  audience: string; // Target audience for this category

  @Column({ nullable: true })
  topics: string[]; // Array of topics covered in this category

  @Column({ nullable: true })
  keywords: string[]; // SEO keywords for this category

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  region: string; // Geographic region for this category

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true })
  businessHours: string; // JSON string with business hours

  @Column({ nullable: true })
  responseTime: number; // Expected response time in hours

  @Column({ nullable: true })
  sla: string; // Service level agreement

  @Column({ nullable: true })
  priority: number; // Priority level for this category

  @Column({ nullable: true })
  weight: number; // Weight for sorting and recommendations

  @Column({ nullable: true })
  score: number; // Quality score for this category

  @Column({ nullable: true })
  rating: number; // Average rating for blogs in this category

  @Column({ nullable: true })
  ratingCount: number; // Number of ratings

  @Column({ nullable: true })
  engagement: number; // Engagement score

  @Column({ nullable: true })
  popularity: number; // Popularity score

  @Column({ nullable: true })
  trending: boolean;

  @Column({ nullable: true })
  trendingAt: Date;

  @Column({ nullable: true })
  trendingScore: number;

  @Column({ nullable: true })
  analytics: string; // JSON string with analytics data

  @Column({ nullable: true })
  performance: string; // JSON string with performance metrics

  @Column({ nullable: true })
  goals: string; // JSON string with category goals

  @Column({ nullable: true })
  metrics: string; // JSON string with KPI metrics

  @Column({ nullable: true })
  reports: string; // JSON string with report settings

  @Column({ nullable: true })
  integrations: string; // JSON string with third-party integrations

  @Column({ nullable: true })
  webhooks: string; // JSON string with webhook URLs

  @Column({ nullable: true })
  apiSettings: string; // JSON string with API settings

  @Column({ nullable: true })
  exportSettings: string; // JSON string with export settings

  @Column({ nullable: true })
  importSettings: string; // JSON string with import settings

  @Column({ nullable: true })
  backupSettings: string; // JSON string with backup settings

  @Column({ nullable: true })
  archiveSettings: string; // JSON string with archive settings

  @Column({ nullable: true })
  retention: number; // Retention period in days

  @Column({ nullable: true })
  compliance: string; // Compliance requirements

  @Column({ nullable: true })
  security: string; // Security settings

  @Column({ nullable: true })
  privacy: string; // Privacy settings

  @Column({ nullable: true })
  gdpr: boolean; // GDPR compliance

  @Column({ nullable: true })
  ccpa: boolean; // CCPA compliance

  @Column({ nullable: true })
  accessibility: string; // Accessibility settings

  @Column({ nullable: true })
  localization: string; // Localization settings

  @Column({ nullable: true })
  internationalization: string; // Internationalization settings

  @Column({ nullable: true })
  version: number; // Category version

  @Column({ nullable: true })
  changelog: string; // JSON string with changelog

  @Column({ nullable: true })
  migration: string; // Migration data

  @Column({ nullable: true })
  legacy: boolean; // Legacy category flag

  @Column({ nullable: true })
  deprecated: boolean;

  @Column({ nullable: true })
  deprecationDate: Date;

  @Column({ nullable: true })
  replacementId: string; // Replacement category ID

  @Column({ nullable: true })
  migrationPath: string; // Migration path for deprecated categories

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
