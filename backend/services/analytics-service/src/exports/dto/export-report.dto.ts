import { IsString, IsOptional, IsObject, IsEnum, IsBoolean } from 'class-validator';

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
  JSON = 'json',
}

export enum ExportType {
  DASHBOARD = 'dashboard',
  EVENTS = 'events',
  FUNNELS = 'funnels',
  REPORTS = 'reports',
}

export class ExportReportDto {
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsEnum(ExportType)
  type: ExportType;

  @IsOptional()
  @IsObject()
  filters?: any;

  @IsOptional()
  @IsObject()
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsObject()
  config?: any;

  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsBoolean()
  includeHeaders?: boolean;

  @IsOptional()
  @IsString()
  timezone?: string;
}
