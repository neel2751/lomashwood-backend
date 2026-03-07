import { IsString, IsOptional, IsBoolean, IsArray, IsObject } from 'class-validator';

export class CreateDashboardDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsObject()
  layout?: any;

  @IsOptional()
  @IsObject()
  theme?: any;

  @IsOptional()
  @IsArray()
  widgets?: any[];

  @IsOptional()
  @IsString()
  createdBy?: string;
}
