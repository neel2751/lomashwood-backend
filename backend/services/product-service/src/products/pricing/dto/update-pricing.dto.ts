import { IsString, IsNumber, IsOptional, IsBoolean, IsDate, Min, PartialType } from 'class-validator';
import { CreatePricingDto } from './create-pricing.dto';

export class UpdatePricingDto extends PartialType(CreatePricingDto) {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  colourId?: string;

  @IsOptional()
  @IsString()
  sizeId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString()
  updateReason?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @IsOptional()
  @IsString()
  taxCode?: string;
}
