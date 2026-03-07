import { IsString, IsDate, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { RecurringPattern } from '../entities/availability.entity';

export class AvailabilitySlotDto {
  @IsDate()
  date: Date;

  @IsDate()
  startTime: Date;

  @IsDate()
  endTime: Date;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  recurring?: boolean;

  @IsOptional()
  @IsEnum(RecurringPattern)
  recurringPattern?: RecurringPattern;

  @IsOptional()
  @IsDate()
  recurringEndDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsNumber()
  maxBookings?: number;
}

export class SetAvailabilityDto {
  @IsString()
  consultantId: string;

  @IsOptional()
  @IsString()
  showroomId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  availability: AvailabilitySlotDto[];
}
