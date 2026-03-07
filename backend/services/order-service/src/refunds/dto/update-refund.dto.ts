import { IsString, IsNumber, IsEnum, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { RefundType, RefundStatus } from '../entities/refund.entity';

export class UpdateRefundDto {
  @IsOptional()
  @IsEnum(RefundStatus)
  status?: RefundStatus;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  providerRefundId?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  processedBy?: string;

  @IsOptional()
  @IsString()
  returnShippingMethod?: string;

  @IsOptional()
  @IsString()
  returnTrackingNumber?: string;

  @IsOptional()
  @IsString()
  returnAddress?: string;

  @IsOptional()
  @IsNumber()
  restockFee?: number;

  @IsOptional()
  @IsNumber()
  shippingFee?: number;

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  @IsArray()
  items?: Array<{
    productId: string;
    quantity: number;
    reason: string;
    condition: string;
  }>;
}
