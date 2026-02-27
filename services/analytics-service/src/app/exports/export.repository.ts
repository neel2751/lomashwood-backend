import { getPrismaClient } from '../../infrastructure/db/prisma.client';
import type {
  CreateExportInput,
  ExportListFilters,
  ExportFileResult,
  ExportEntity,
} from './export.types';
import { EXPORT_FILE_EXPIRY_HOURS } from './export.constants';
  
const db = getPrismaClient() as any;

export class ExportRepository {
  async create(input: CreateExportInput): Promise<ExportEntity> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + EXPORT_FILE_EXPIRY_HOURS);

    return db.export.create({
      data: {
        reportId:    input.reportId,
        name:        input.name,
        format:      input.format,
        parameters:  input.parameters ?? {},
        requestedBy: input.requestedBy,
        expiresAt,
      },
    });
  }

  async findById(id: string): Promise<ExportEntity | null> {
    return db.export.findUnique({ where: { id } });
  }

  async findAll(
    filters: ExportListFilters,
  ): Promise<{ data: ExportEntity[]; total: number }> {
    const { status, format, requestedBy, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      ...(status      ? { status }      : {}),
      ...(format      ? { format }      : {}),
      ...(requestedBy ? { requestedBy } : {}),
    };

    const [data, total] = await getPrismaClient().$transaction([
      db.export.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.export.count({ where }),
    ]);

    return { data, total };
  }

  async markProcessing(id: string): Promise<ExportEntity> {
    return db.export.update({
      where: { id },
      data: { status: 'PROCESSING', startedAt: new Date() },
    });
  }

  async markCompleted(id: string, result: ExportFileResult): Promise<ExportEntity> {
    return db.export.update({
      where: { id },
      data: {
        status:      'COMPLETED',
        completedAt: new Date(),
        filePath:    result.filePath,
        fileSize:    BigInt(result.fileSize),
        rowCount:    result.rowCount,
        error:       null,
      },
    });
  }

  async markFailed(id: string, error: string): Promise<ExportEntity> {
    return db.export.update({
      where: { id },
      data: {
        status:      'FAILED',
        completedAt: new Date(),
        error,
      },
    });
  }

  async markExpired(id: string): Promise<ExportEntity> {
    return db.export.update({
      where: { id },
      data: { status: 'EXPIRED' },
    });
  }

  async cancel(id: string): Promise<ExportEntity> {
    return db.export.update({
      where: { id },
      data: { status: 'FAILED', error: 'Cancelled by user', completedAt: new Date() },
    });
  }

  async resetForRetry(id: string): Promise<ExportEntity> {
    return db.export.update({
      where: { id },
      data: {
        status:      'PENDING',
        error:       null,
        filePath:    null,
        fileSize:    null,
        rowCount:    null,
        startedAt:   null,
        completedAt: null,
      },
    });
  }

  async findExpired(): Promise<ExportEntity[]> {
    return db.export.findMany({
      where: {
        status:    'COMPLETED',
        expiresAt: { lt: new Date() },
      },
    });
  }

  async findPending(): Promise<ExportEntity[]> {
    return db.export.findMany({
      where:   { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateStatus(id: string, status: string): Promise<ExportEntity> {
    return db.export.update({
      where: { id },
      data:  { status },
    });
  }
}