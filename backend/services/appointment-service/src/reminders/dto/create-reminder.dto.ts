import { IsString, IsDate, IsOptional, IsEnum, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { ReminderType, ReminderMethod } from '../entities/reminder.entity';

export class CreateReminderDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ReminderType)
  type: ReminderType;

  @IsOptional()
  @IsEnum(ReminderMethod)
  method?: ReminderMethod;

  @IsDate()
  scheduledAt: Date;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  userId?: string; // For admin-created reminders

  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsString()
  recurringPattern?: string;

  @IsOptional()
  @IsDate()
  recurringEndDate?: Date;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsString()
  templateData?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  maxRetries?: number;

  @IsOptional()
  @IsString()
  metadata?: string;
}
