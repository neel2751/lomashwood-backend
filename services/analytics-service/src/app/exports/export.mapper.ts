import type { ExportEntity, ExportResponse } from './export.types';

export class ExportMapper {
  static toResponse(entity: ExportEntity): ExportResponse {
    return {
      id: entity.id,
      reportId: entity.reportId,
      name: entity.name,
      format: entity.format,
      status: entity.status,
      filePath: entity.filePath,
      fileSize: entity.fileSize,
      rowCount: entity.rowCount,
      parameters: entity.parameters as Record<string, unknown>,
      error: entity.error,
      requestedBy: entity.requestedBy,
      expiresAt: entity.expiresAt,
      startedAt: entity.startedAt,
      completedAt: entity.completedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}