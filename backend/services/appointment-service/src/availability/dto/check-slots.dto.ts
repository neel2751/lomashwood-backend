import { IsString, IsDate, IsOptional, IsNumber, Min, IsBoolean } from 'class-validator';

export class CheckSlotsDto {
  @IsString()
  consultantId: string;

  @IsDate()
  date: Date;

  @IsOptional()
  @IsNumber()
  @Min(15)
  duration?: number; // in minutes

  @IsOptional()
  @IsString()
  showroomId?: string;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsBoolean()
  includeBooked?: boolean;

  @IsOptional()
  @IsBoolean()
  includeBlocked?: boolean;
}
