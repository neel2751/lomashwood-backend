import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  CAROUSEL = 'CAROUSEL',
  GALLERY = 'GALLERY',
}

export enum MediaStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

@Entity('media_items')
export class MediaItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  caption: string;

  @Column({
    type: 'enum',
    enum: MediaType,
    default: MediaType.IMAGE,
  })
  type: MediaType;

  @Column({
    type: 'enum',
    enum: MediaStatus,
    default: MediaStatus.DRAFT,
  })
  status: MediaStatus;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  tags: string[]; // Array of tags

  @Column()
  url: string; // Main media URL

  @Column({ nullable: true })
  thumbnailUrl: string; // Thumbnail URL

  @Column({ nullable: true })
  previewUrl: string; // Preview URL

  @Column({ nullable: true })
  downloadUrl: string; // Download URL

  @Column({ nullable: true })
  altText: string; // Alt text for accessibility

  @Column({ nullable: true })
  titleText: string; // Title text for accessibility

  @Column({ nullable: true })
  descriptionText: string; // Description text for accessibility

  @Column({ nullable: true })
  metadata: string; // JSON string with media metadata

  @Column({ nullable: true })
  exifData: string; // JSON string with EXIF data for images

  @Column({ nullable: true })
  fileInfo: string; // JSON string with file information

  @Column({ nullable: true })
  dimensions: string; // JSON string with width/height

  @Column({ nullable: true })
  fileSize: number; // File size in bytes

  @Column({ nullable: true })
  duration: number; // Duration in seconds for video/audio

  @Column({ nullable: true })
  format: string; // File format (jpg, mp4, etc.)

  @Column({ nullable: true })
  mimeType: string; // MIME type

  @Column({ nullable: true })
  encoding: string; // File encoding

  @Column({ nullable: true })
  colorProfile: string; // Color profile for images

  @Column({ nullable: true })
  colorSpace: string; // Color space (RGB, CMYK, etc.)

  @Column({ nullable: true })
  resolution: string; // Resolution (DPI)

  @Column({ nullable: true })
  aspectRatio: string; // Aspect ratio (16:9, 4:3, etc.)

  @Column({ nullable: true })
  orientation: string; // Orientation (landscape, portrait)

  @Column({ nullable: true })
  quality: string; // Quality (high, medium, low)

  @Column({ nullable: true })
  compression: string; // Compression type

  @Column({ nullable: true })
  watermark: boolean; // Has watermark

  @Column({ nullable: true })
  watermarkUrl: string; // Watermark URL

  @Column({ nullable: true })
  watermarkPosition: string; // Watermark position

  @Column({ nullable: true })
  watermarkOpacity: number; // Watermark opacity

  @Column({ nullable: true })
  filters: string[]; // Array of applied filters

  @Column({ nullable: true })
  adjustments: string; // JSON string with adjustments

  @Column({ nullable: true })
  cropData: string; // JSON string with crop information

  @Column({ nullable: true })
  rotation: number; // Rotation angle

  @Column({ nullable: true })
  flip: string; // Flip direction (horizontal, vertical)

  @Column({ nullable: true })
  zoom: number; // Zoom level

  @Column({ nullable: true })
  pan: string; // Pan coordinates

  @Column({ nullable: true })
  featured: boolean;

  @Column({ nullable: true })
  featuredAt: Date;

  @Column({ nullable: true })
  featuredBy: string;

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
  downloadCount: number;

  @Column({ nullable: true })
  embedCount: number;

  @Column({ nullable: true })
  rating: number;

  @Column({ nullable: true })
  ratingCount: number;

  @Column({ nullable: true })
  popularity: number; // Popularity score

  @Column({ nullable: true })
  trending: boolean;

  @Column({ nullable: true })
  trendingAt: Date;

  @Column({ nullable: true })
  trendingScore: number;

  @Column({ nullable: true })
  seoTitle: string;

  @Column({ nullable: true })
  seoDescription: string;

  @Column({ nullable: true })
  seoKeywords: string[];

  @Column({ nullable: true })
  canonicalUrl: string;

  @Column({ nullable: true })
  openGraph: string; // JSON string with Open Graph data

  @Column({ nullable: true })
  twitterCard: string; // JSON string with Twitter Card data

  @Column({ nullable: true })
  schemaMarkup: string; // JSON string with schema markup

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  region: string; // Geographic region

  @Column({ nullable: true })
  audience: string[]; // Target audience

  @Column({ nullable: true })
  contentRating: string; // Content rating (G, PG, R, etc.)

  @Column({ nullable: true })
  ageRestriction: number; // Age restriction

  @Column({ nullable: true })
  geoRestriction: string[]; // Geographic restrictions

  @Column({ nullable: true })
  deviceRestriction: string[]; // Device restrictions

  @Column({ nullable: true })
  platformRestriction: string[]; // Platform restrictions

  @Column({ nullable: true })
  copyright: string;

  @Column({ nullable: true })
  license: string;

  @Column({ nullable: true })
  attribution: string;

  @Column({ nullable: true })
  source: string;

  @Column({ nullable: true })
  sourceUrl: string;

  @Column({ nullable: true })
  sourceAuthor: string;

  @Column({ nullable: true })
  photographer: string;

  @Column({ nullable: true })
  videographer: string;

  @Column({ nullable: true })
  designer: string;

  @Column({ nullable: true })
  artist: string;

  @Column({ nullable: true })
  agency: string;

  @Column({ nullable: true })
  client: string;

  @Column({ nullable: true })
  project: string;

  @Column({ nullable: true })
  campaign: string;

  @Column({ nullable: true })
  productIds: string[]; // Related product IDs

  @Column({ nullable: true })
  serviceIds: string[]; // Related service IDs

  @Column({ nullable: true })
  blogIds: string[]; // Related blog IDs

  @Column({ nullable: true })
  collectionIds: string[]; // Related collection IDs

  @Column({ nullable: true })
  relatedMediaIds: string[]; // Related media IDs

  @Column({ nullable: true })
  uploadedBy: string;

  @Column({ nullable: true })
  uploadedAt: Date;

  @Column({ nullable: true })
  uploadSource: string; // Upload source (web, mobile, api, etc.)

  @Column({ nullable: true })
  uploadIp: string;

  @Column({ nullable: true })
  uploadUserAgent: string;

  @Column({ nullable: true })
  processingStatus: string; // Processing status (pending, processing, completed, failed)

  @Column({ nullable: true })
  processingStartedAt: Date;

  @Column({ nullable: true })
  processingCompletedAt: Date;

  @Column({ nullable: true })
  processingError: string;

  @Column({ nullable: true })
  processingAttempts: number;

  @Column({ nullable: true })
  processingLog: string; // JSON string with processing log

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

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  internalNotes: string; // For staff use

  @Column({ nullable: true })
  additionalTags: string[]; // Additional tags for categorization

  @Column({ nullable: true })
  customFields: string; // JSON string for custom fields

  @Column({ nullable: true })
  settings: string; // JSON string with media settings

  @Column({ nullable: true })
  permissions: string; // JSON string with permission settings

  @Column({ nullable: true })
  accessControl: string; // JSON string with access control rules

  @Column({ nullable: true })
  sharing: string; // JSON string with sharing settings

  @Column({ nullable: true })
  embedding: string; // JSON string with embedding settings

  @Column({ nullable: true })
  apiSettings: string; // JSON string with API settings

  @Column({ nullable: true })
  webhookSettings: string; // JSON string with webhook settings

  @Column({ nullable: true })
  integrationSettings: string; // JSON string with integration settings

  @Column({ nullable: true })
  backup: boolean; // Has backup

  @Column({ nullable: true })
  backupLocation: string; // Backup location

  @Column({ nullable: true })
  backupAt: Date;

  @Column({ nullable: true })
  retention: number; // Retention period in days

  @Column({ nullable: true })
  archive: boolean; // Is archived

  @Column({ nullable: true })
  archiveLocation: string; // Archive location

  @Column({ nullable: true })
  archiveAt: Date;

  @Column({ nullable: true })
  version: number; // Media version

  @Column({ nullable: true })
  versions: string; // JSON string with version history

  @Column({ nullable: true })
  variants: string; // JSON string with media variants

  @Column({ nullable: true })
  derivatives: string; // JSON string with derivative files

  @Column({ nullable: true })
  transformations: string; // JSON string with applied transformations

  @Column({ nullable: true })
  optimizations: string; // JSON string with optimizations

  @Column({ nullable: true })
  compressions: string; // JSON string with compression data

  @Column({ nullable: true })
  formats: string; // JSON string with available formats

  @Column({ nullable: true })
  resolutions: string; // JSON string with available resolutions

  @Column({ nullable: true })
  qualities: string; // JSON string with available qualities

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
