import { IsString, IsNumber, IsEnum, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { RefundType } from '../entities/refund.entity';

export class RefundItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  condition?: string;
}

export class CreateRefundDto {
  @IsString()
  orderId: string;

  @IsString()
  paymentId: string;

  @IsNumber()
  amount: number;

  @IsEnum(RefundType)
  type: RefundType;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RefundItemDto)
  items?: RefundItemDto[];

  @IsOptional()
  @IsString()
  returnShippingMethod?: string;

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
  customerNotes?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
