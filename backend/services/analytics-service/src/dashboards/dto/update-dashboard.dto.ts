import { IsString, IsOptional, IsBoolean, IsArray, IsObject } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateDashboardDto } from './create-dashboard.dto';

export class UpdateDashboardDto extends PartialType(CreateDashboardDto) {
  @IsOptional()
  @IsString()
  override name?: string;

  @IsOptional()
  @IsString()
  override description?: string;

  @IsOptional()
  @IsBoolean()
  override isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  override isPublic?: boolean;

  @IsOptional()
  @IsObject()
  override layout?: any;

  @IsOptional()
  @IsObject()
  override theme?: any;

  @IsOptional()
  @IsArray()
  override widgets?: any[];

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
