import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export enum UploadProvider {
  S3 = 's3',
  CLOUDINARY = 'cloudinary',
}

export class UploadFileDto {
  @IsOptional()
  @IsEnum(UploadProvider)
  provider?: UploadProvider;

  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum([true, false, 'true', 'false'])
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  metadata?: any;
}