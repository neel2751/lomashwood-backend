import { z } from 'zod';

export const ExportFormat = {
  CSV:   'CSV',
  XLSX:  'XLSX',
  PDF:   'PDF',
  JSON:  'JSON',
} as const;
export type ExportFormat = (typeof ExportFormat)[keyof typeof ExportFormat];

export const ExportStatus = {
  PENDING:    'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED:  'COMPLETED',
  FAILED:     'FAILED',
  EXPIRED:    'EXPIRED',
  CANCELLED:  'CANCELLED',
} as const;
export type ExportStatus = (typeof ExportStatus)[keyof typeof ExportStatus];

export const CreateExportSchema = z.object({
  reportId:    z.string().uuid().optional(),
  name:        z.string().min(1).max(255),
  format:      z.nativeEnum(ExportFormat),
  parameters:  z.record(z.unknown()).optional().default({}),
  requestedBy: z.string().min(1).max(128),
});

export const ExportListQuerySchema = z.object({
  status:      z.nativeEnum(ExportStatus).optional(),
  format:      z.nativeEnum(ExportFormat).optional(),
  requestedBy: z.string().max(128).optional(),
  page:        z.coerce.number().int().min(1).optional().default(1),
  limit:       z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateExportDto    = z.infer<typeof CreateExportSchema>;
export type ExportListQueryDto = z.infer<typeof ExportListQuerySchema>;