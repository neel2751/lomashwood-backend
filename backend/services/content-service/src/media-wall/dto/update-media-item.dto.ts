import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { MediaType, MediaStatus } from '../entities/media-item.entity';

export class UpdateMediaItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;

  @IsOptional()
  @IsEnum(MediaStatus)
  status?: MediaStatus;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  previewUrl?: string;

  @IsOptional()
  @IsString()
  downloadUrl?: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsString()
  titleText?: string;

  @IsOptional()
  @IsString()
  descriptionText?: string;

  @IsOptional()
  @IsString()
  metadata?: string;

  @IsOptional()
  @IsString()
  exifData?: string;

  @IsOptional()
  @IsString()
  fileInfo?: string;

  @IsOptional()
  @IsString()
  dimensions?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fileSize?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  encoding?: string;

  @IsOptional()
  @IsString()
  colorProfile?: string;

  @IsOptional()
  @IsString()
  colorSpace?: string;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsString()
  aspectRatio?: string;

  @IsOptional()
  @IsString()
  orientation?: string;

  @IsOptional()
  @IsString()
  quality?: string;

  @IsOptional()
  @IsString()
  compression?: string;

  @IsOptional()
  @IsBoolean()
  watermark?: boolean;

  @IsOptional()
  @IsString()
  watermarkUrl?: string;

  @IsOptional()
  @IsString()
  watermarkPosition?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  watermarkOpacity?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  filters?: string[];

  @IsOptional()
  @IsString()
  adjustments?: string;

  @IsOptional()
  @IsString()
  cropData?: string;

  @IsOptional()
  @IsNumber()
  rotation?: number;

  @IsOptional()
  @IsString()
  flip?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  zoom?: number;

  @IsOptional()
  @IsString()
  pan?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  featuredAt?: string;

  @IsOptional()
  @IsString()
  featuredBy?: string;

  @IsOptional()
  @IsString()
  publishedAt?: string;

  @IsOptional()
  @IsString()
  publishedBy?: string;

  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  archivedAt?: string;

  @IsOptional()
  @IsString()
  archivedBy?: string;

  @IsOptional()
  @IsString()
  deletedAt?: string;

  @IsOptional()
  @IsString()
  deletedBy?: string;

  @IsOptional()
  @IsString()
  deletionReason?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  viewCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  likeCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commentCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shareCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  downloadCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  embedCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ratingCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  popularity?: number;

  @IsOptional()
  @IsBoolean()
  trending?: boolean;

  @IsOptional()
  @IsString()
  trendingAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  trendingScore?: number;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoKeywords?: string[];

  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @IsOptional()
  @IsString()
  openGraph?: string;

  @IsOptional()
  @IsString()
  twitterCard?: string;

  @IsOptional()
  @IsString()
  schemaMarkup?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  audience?: string[];

  @IsOptional()
  @IsString()
  contentRating?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ageRestriction?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  geoRestriction?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deviceRestriction?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platformRestriction?: string[];

  @IsOptional()
  @IsString()
  copyright?: string;

  @IsOptional()
  @IsString()
  license?: string;

  @IsOptional()
  @IsString()
  attribution?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  sourceAuthor?: string;

  @IsOptional()
  @IsString()
  photographer?: string;

  @IsOptional()
  @IsString()
  videographer?: string;

  @IsOptional()
  @IsString()
  designer?: string;

  @IsOptional()
  @IsString()
  artist?: string;

  @IsOptional()
  @IsString()
  agency?: string;

  @IsOptional()
  @IsString()
  client?: string;

  @IsOptional()
  @IsString()
  project?: string;

  @IsOptional()
  @IsString()
  campaign?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blogIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  collectionIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedMediaIds?: string[];

  @IsOptional()
  @IsString()
  uploadedBy?: string;

  @IsOptional()
  @IsString()
  uploadedAt?: string;

  @IsOptional()
  @IsString()
  uploadSource?: string;

  @IsOptional()
  @IsString()
  uploadIp?: string;

  @IsOptional()
  @IsString()
  uploadUserAgent?: string;

  @IsOptional()
  @IsString()
  processingStatus?: string;

  @IsOptional()
  @IsString()
  processingStartedAt?: string;

  @IsOptional()
  @IsString()
  processingCompletedAt?: string;

  @IsOptional()
  @IsString()
  processingError?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  processingAttempts?: number;

  @IsOptional()
  @IsString()
  processingLog?: string;

  @IsOptional()
  @IsString()
  analytics?: string;

  @IsOptional()
  @IsString()
  performance?: string;

  @IsOptional()
  @IsBoolean()
  aBTest?: boolean;

  @IsOptional()
  @IsString()
  aBTestId?: string;

  @IsOptional()
  @IsString()
  aBTestVariant?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  @IsString()
  customFields?: string;

  @IsOptional()
  @IsString()
  settings?: string;

  @IsOptional()
  @IsString()
  permissions?: string;

  @IsOptional()
  @IsString()
  accessControl?: string;

  @IsOptional()
  @IsString()
  sharing?: string;

  @IsOptional()
  @IsString()
  embedding?: string;

  @IsOptional()
  @IsString()
  apiSettings?: string;

  @IsOptional()
  @IsString()
  webhookSettings?: string;

  @IsOptional()
  @IsString()
  integrationSettings?: string;

  @IsOptional()
  @IsBoolean()
  backup?: boolean;

  @IsOptional()
  @IsString()
  backupLocation?: string;

  @IsOptional()
  @IsString()
  backupAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  retention?: number;

  @IsOptional()
  @IsBoolean()
  archive?: boolean;

  @IsOptional()
  @IsString()
  archiveLocation?: string;

  @IsOptional()
  @IsString()
  archiveAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  version?: number;

  @IsOptional()
  @IsString()
  versions?: string;

  @IsOptional()
  @IsString()
  variants?: string;

  @IsOptional()
  @IsString()
  derivatives?: string;

  @IsOptional()
  @IsString()
  transformations?: string;

  @IsOptional()
  @IsString()
  optimizations?: string;

  @IsOptional()
  @IsString()
  compressions?: string;

  @IsOptional()
  @IsString()
  formats?: string;

  @IsOptional()
  @IsString()
  resolutions?: string;

  @IsOptional()
  @IsString()
  qualities?: string;
}
