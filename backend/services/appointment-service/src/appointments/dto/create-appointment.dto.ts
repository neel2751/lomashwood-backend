import { IsString, IsDate, IsOptional, IsEnum, IsNumber, Min, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentType } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @IsString()
  consultantId: string;

  @IsOptional()
  @IsString()
  showroomId?: string;

  @IsDate()
  dateTime: Date;

  @IsOptional()
  @IsDate()
  endTime?: Date;

  @IsOptional()
  @IsNumber()
  @Min(15)
  duration?: number; // in minutes

  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  customerNotes?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  preferredContactMethod?: string;

  @IsOptional()
  @IsString()
  userId?: string; // For admin-created appointments
}
