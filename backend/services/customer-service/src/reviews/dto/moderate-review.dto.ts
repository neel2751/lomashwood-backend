import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ReviewStatus } from '../entities/review.entity';

export class ModerateReviewDto {
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  moderatedBy?: string;

  @IsOptional()
  @IsString()
  response?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsString()
  sentiment?: string;

  @IsOptional()
  @IsNumber()
  sentimentScore?: number;
}
