import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { BlogStatus, BlogType } from '../entities/blog.entity';

export class UpdateBlogDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus;

  @IsOptional()
  @IsEnum(BlogType)
  type?: BlogType;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  featuredImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

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
  @IsBoolean()
  featured?: boolean;

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
  @Min(1)
  readTime?: number;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  translation?: string;

  @IsOptional()
  @IsString()
  originalLanguage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetAudience?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedProducts?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedServices?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  externalLinks?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  internalLinks?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  @IsString()
  metadata?: string;

  @IsOptional()
  @IsString()
  settings?: string;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  lastModifiedAt?: string;

  @IsOptional()
  @IsString()
  modifiedBy?: string;

  @IsOptional()
  @IsString()
  reviewedAt?: string;

  @IsOptional()
  @IsString()
  reviewedBy?: string;

  @IsOptional()
  @IsString()
  approvedAt?: string;

  @IsOptional()
  @IsString()
  approvedBy?: string;

  @IsOptional()
  @IsString()
  rejectedAt?: string;

  @IsOptional()
  @IsString()
  rejectedBy?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;

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
  copyright?: string;

  @IsOptional()
  @IsString()
  license?: string;

  @IsOptional()
  @IsString()
  attribution?: string;

  @IsOptional()
  @IsBoolean()
  sponsored?: boolean;

  @IsOptional()
  @IsString()
  sponsoredBy?: string;

  @IsOptional()
  @IsString()
  campaign?: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

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
}
