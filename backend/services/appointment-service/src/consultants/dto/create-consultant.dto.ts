import { IsString, IsOptional, IsEmail, IsEnum, IsNumber, IsArray, Min, Max } from 'class-validator';
import { ConsultantStatus } from '../entities/consultant.entity';

export class CreateConsultantDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  experience?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  showroomId?: string;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsEnum(ConsultantStatus)
  status?: ConsultantStatus;

  @IsOptional()
  @IsString()
  workingHours?: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(480)
  preferredAppointmentDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxAppointmentsPerDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  bufferTime?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  socialMedia?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
