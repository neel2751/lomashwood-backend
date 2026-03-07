import { IsString, IsOptional, IsBoolean, IsArray, IsObject } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateFunnelDto } from './create-funnel.dto';

export class UpdateFunnelDto extends PartialType(CreateFunnelDto) {
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
  @IsString()
  override category?: string;

  @IsOptional()
  @IsObject()
  override config?: any;

  @IsOptional()
  @IsArray()
  override steps?: any[];

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
