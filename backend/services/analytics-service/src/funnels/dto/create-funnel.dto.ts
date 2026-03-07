import { IsString, IsOptional, IsBoolean, IsArray, IsObject } from 'class-validator';

export class CreateFunnelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsObject()
  config?: any;

  @IsOptional()
  @IsArray()
  steps?: any[];

  @IsOptional()
  @IsString()
  createdBy?: string;
}
