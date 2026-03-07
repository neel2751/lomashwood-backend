import { IsString, IsOptional, IsEnum, IsArray, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { TicketStatus, TicketPriority } from '../entities/support-ticket.entity';

export class UpdateTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  assignmentNotes?: string;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsString()
  closingNotes?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  customerSatisfaction?: number;

  @IsOptional()
  @IsString()
  satisfactionNotes?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  escalationLevel?: number;

  @IsOptional()
  @IsString()
  escalationReason?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  @IsBoolean()
  isEscalated?: boolean;

  @IsOptional()
  @IsString()
  reopenReason?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  @IsString()
  metadata?: string;

  @IsOptional()
  @IsString()
  additionalTags?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  translation?: string;

  @IsOptional()
  @IsString()
  originalLanguage?: string;
}
