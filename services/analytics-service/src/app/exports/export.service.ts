import fs from 'fs';
import path from 'path';

import { getRedisClient } from '../../infrastructure/cache/redis.client';
import { logger } from '../../config/logger';
import { AppError } from '../../shared/errors';
import { ExportRepository } from './export.repository';
import { ExportMapper } from './export.mapper';
import {
  EXPORT_CACHE_KEYS,
  EXPORT_CACHE_TTL,
  EXPORT_ERRORS,
  EXPORT_MIME_TYPES,
  EXPORT_FILE_EXTENSIONS,
  EXPORT_TEMP_DIR,
  EXPORT_MAX_ROWS,
} from './export.constants';
import type {
  CreateExportInput,
  ExportListFilters,
  ExportResponse,
  PaginatedExportsResponse,
  ExportDownloadMeta,
} from './export.types';

export class ExportService {
  private readonly repository: ExportRepository;

  constructor(repository: ExportRepository) {
    this.repository = repository;
  }

  async createExport(input: CreateExportInput): Promise<ExportResponse> {
    const exportRecord = await this.repository.create(input);

    logger.info(
      { exportId: exportRecord.id, format: exportRecord.format, name: exportRecord.name },
      'Export job created',
    );

    setImmediate(() => {
      this.processExport(exportRecord.id).catch((err) => {
        logger.error({ exportId: exportRecord.id, error: err }, 'Export processing failed');
      });
    });

    return ExportMapper.toResponse(exportRecord);
  }

  async getExportById(id: string, requestedBy?: string): Promise<ExportResponse> {
    const redis = getRedisClient();
    const cacheKey = EXPORT_CACHE_KEYS.export(id);
    const cached = await redis.get(cacheKey);

    if (cached) {
      const parsed = JSON.parse(cached) as ExportResponse;
      if (requestedBy && parsed.requestedBy !== requestedBy) {
        throw new AppError(EXPORT_ERRORS.NOT_OWNED, 403);
      }
      return parsed;
    }

    const exportRecord = await this.repository.findById(id);

    if (!exportRecord) {
      throw new AppError(EXPORT_ERRORS.NOT_FOUND, 404);
    }

    if (requestedBy && exportRecord.requestedBy !== requestedBy) {
      throw new AppError(EXPORT_ERRORS.NOT_OWNED, 403);
    }

    const response = ExportMapper.toResponse(exportRecord);

    if (exportRecord.status === 'COMPLETED' || exportRecord.status === 'FAILED') {
      await redis.setex(cacheKey, String(EXPORT_CACHE_TTL.EXPORT), JSON.stringify(response));
    }

    return response;
  }

  async listExports(filters: ExportListFilters): Promise<PaginatedExportsResponse> {
    const { page = 1, limit = 20 } = filters;
    const { data, total } = await this.repository.findAll(filters);

    return {
      data: data.map(ExportMapper.toResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDownloadMeta(id: string, requestedBy?: string): Promise<ExportDownloadMeta> {
    const exportRecord = await this.repository.findById(id);

    if (!exportRecord) {
      throw new AppError(EXPORT_ERRORS.NOT_FOUND, 404);
    }

    if (requestedBy && exportRecord.requestedBy !== requestedBy) {
      throw new AppError(EXPORT_ERRORS.NOT_OWNED, 403);
    }

    if (exportRecord.status === 'EXPIRED') {
      throw new AppError(EXPORT_ERRORS.ALREADY_EXPIRED, 410);
    }

    if (exportRecord.status !== 'COMPLETED') {
      throw new AppError(EXPORT_ERRORS.NOT_COMPLETED, 422);
    }

    if (!exportRecord.filePath || !exportRecord.fileSize) {
      throw new AppError(EXPORT_ERRORS.FILE_NOT_FOUND, 500);
    }

    if (!fs.existsSync(exportRecord.filePath)) {
      await this.repository.markExpired(id);
      throw new AppError(EXPORT_ERRORS.ALREADY_EXPIRED, 410);
    }

    const ext = EXPORT_FILE_EXTENSIONS[exportRecord.format] ?? 'dat';
    const mimeType = EXPORT_MIME_TYPES[exportRecord.format] ?? 'application/octet-stream';
    const fileName = `${exportRecord.name.replace(/\s+/g, '_')}.${ext}`;

    return {
      exportId: id,
      fileName,
      mimeType,
      filePath: exportRecord.filePath,
      fileSize: exportRecord.fileSize,
    };
  }

  async cancelExport(id: string, requestedBy?: string): Promise<ExportResponse> {
    const exportRecord = await this.repository.findById(id);

    if (!exportRecord) {
      throw new AppError(EXPORT_ERRORS.NOT_FOUND, 404);
    }

    if (requestedBy && exportRecord.requestedBy !== requestedBy) {
      throw new AppError(EXPORT_ERRORS.NOT_OWNED, 403);
    }

    if (exportRecord.status !== 'PENDING' && exportRecord.status !== 'PROCESSING') {
      throw new AppError(EXPORT_ERRORS.CANNOT_CANCEL, 422);
    }

    const cancelled = await this.repository.cancel(id);

    await this.invalidateExportCache(id);

    logger.info({ exportId: id }, 'Export cancelled');

    return ExportMapper.toResponse(cancelled);
  }

  async retryExport(id: string, requestedBy?: string): Promise<ExportResponse> {
    const exportRecord = await this.repository.findById(id);

    if (!exportRecord) {
      throw new AppError(EXPORT_ERRORS.NOT_FOUND, 404);
    }

    if (requestedBy && exportRecord.requestedBy !== requestedBy) {
      throw new AppError(EXPORT_ERRORS.NOT_OWNED, 403);
    }

    if (exportRecord.status !== 'FAILED') {
      throw new AppError(EXPORT_ERRORS.CANNOT_RETRY, 422);
    }

    const reset = await this.repository.resetForRetry(id);

    await this.invalidateExportCache(id);

    logger.info({ exportId: id }, 'Export queued for retry');

    setImmediate(() => {
      this.processExport(id).catch((err) => {
        logger.error({ exportId: id, error: err }, 'Export retry processing failed');
      });
    });

    return ExportMapper.toResponse(reset);
  }

  async expireStaleExports(): Promise<number> {
    const expired = await this.repository.findExpired();

    if (expired.length === 0) {
      return 0;
    }

    let count = 0;

    for (const exportRecord of expired) {
      await this.repository.markExpired(exportRecord.id);

      if (exportRecord.filePath && fs.existsSync(exportRecord.filePath)) {
        fs.unlinkSync(exportRecord.filePath);
      }

      await this.invalidateExportCache(exportRecord.id);
      count++;
    }

    logger.info({ count }, 'Stale exports expired and files cleaned up');

    return count;
  }

  private async processExport(exportId: string): Promise<void> {
    await this.repository.markProcessing(exportId);

    try {
      const exportRecord = await this.repository.findById(exportId);

      if (!exportRecord) {
        throw new Error('Export record not found after marking as processing');
      }

      const rowCount = Math.min(1000, EXPORT_MAX_ROWS);
      const rows = Array.from({ length: rowCount }, (_, i) => ({
        index: i + 1,
        timestamp: new Date().toISOString(),
        event: 'PAGE_VIEW',
        page: '/',
        sessions: Math.floor(Math.random() * 100),
      }));

      await fs.promises.mkdir(EXPORT_TEMP_DIR, { recursive: true });

      const ext = EXPORT_FILE_EXTENSIONS[exportRecord.format] ?? 'dat';
      const fileName = `export_${exportId}.${ext}`;
      const filePath = path.join(EXPORT_TEMP_DIR, fileName);

      let content: string;

      if (exportRecord.format === 'CSV') {
        const headers = Object.keys(rows[0] ?? {}).join(',');
        const body = rows.map((row) => Object.values(row).join(',')).join('\n');
        content = `${headers}\n${body}`;
      } else {
        content = JSON.stringify(rows, null, 2);
      }

      await fs.promises.writeFile(filePath, content, 'utf-8');

      const stat = fs.statSync(filePath);

      await this.repository.markCompleted(exportId, {
        filePath,
        fileSize: stat.size,
        rowCount,
      });

      logger.info({ exportId, filePath, rowCount }, 'Export processing completed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown processing error';
      await this.repository.markFailed(exportId, message);
      logger.error({ exportId, error }, 'Export processing failed');
    }
  }

  private async invalidateExportCache(id: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(EXPORT_CACHE_KEYS.export(id));
  }
}