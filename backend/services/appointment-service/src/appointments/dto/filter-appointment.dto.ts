import { IsString, IsDate, IsOptional, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { AppointmentType, AppointmentStatus } from '../entities/appointment.entity';

export class FilterAppointmentDto {
  @IsOptional()
  @IsString()
  consultantId?: string;

  @IsOptional()
  @IsString()
  showroomId?: string;

  @IsOptional()
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @IsOptional()
  @IsArray()
  @IsEnum(AppointmentStatus)
  statuses?: AppointmentStatus[];

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsBoolean()
  includeCancelled?: boolean;

  @IsOptional()
  @IsBoolean()
  includeCompleted?: boolean;

  @IsOptional()
  @IsBoolean()
  includeUpcoming?: boolean;
}
