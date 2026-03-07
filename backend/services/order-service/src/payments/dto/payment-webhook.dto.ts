import { IsString, IsOptional, IsObject } from 'class-validator';

export class PaymentWebhookDto {
  @IsString()
  event: string;

  @IsObject()
  payload: any;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsObject()
  headers?: any;

  @IsOptional()
  @IsString()
  provider?: string;
}
