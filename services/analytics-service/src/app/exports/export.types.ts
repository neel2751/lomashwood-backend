export { ExportFormat, ExportStatus } from './export.schemas';
import type { ExportFormat, ExportStatus } from './export.schemas';

export interface ExportEntity {
  id:          string;
  reportId:    string | null;
  name:        string;
  format:      ExportFormat;
  status:      ExportStatus;
  parameters:  unknown;         
  requestedBy: string;
  filePath:    string | null;
  fileSize:    bigint | null;
  rowCount:    number | null;
  error:       string | null;
  expiresAt:   Date | null;
  startedAt:   Date | null;
  completedAt: Date | null;
  createdAt:   Date;
  updatedAt:   Date;
  deletedAt:   Date | null;
}

export interface CreateExportInput {
  reportId?:   string;
  name:        string;
  format:      ExportFormat;
  parameters?: Record<string, unknown>;
  requestedBy: string;
}

export interface ExportListFilters {
  status?:      ExportStatus;
  format?:      ExportFormat;
  requestedBy?: string;
  page?:        number;
  limit?:       number;
}

export interface ExportJobPayload {
  exportId:    string;
  format:      ExportFormat;
  parameters:  Record<string, unknown>;
  requestedBy: string;
}

export interface ExportFileResult {
  filePath: string;
  fileSize: number;
  rowCount: number;
}

export interface ExportResponse {
  id:          string;
  reportId:    string | null;
  name:        string;
  format:      ExportFormat;
  status:      ExportStatus;
  filePath:    string | null;
  fileSize:    bigint | null;
  rowCount:    number | null;
  parameters:  Record<string, unknown>;
  error:       string | null;
  requestedBy: string;
  expiresAt:   Date | null;
  startedAt:   Date | null;
  completedAt: Date | null;
  createdAt:   Date;
  updatedAt:   Date;
}

export interface PaginatedExportsResponse {
  data:       ExportResponse[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface ExportDownloadMeta {
  exportId:  string;
  fileName:  string;
  mimeType:  string;
  filePath:  string;
  fileSize:  bigint;
}