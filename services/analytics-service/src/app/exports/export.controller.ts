import fs from 'fs';
import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ExportService } from './export.service';
import { ExportRepository } from './export.repository';
import { sendSuccess, sendCreated } from '../../shared/response';
import { CreateExportSchema, ExportListQuerySchema } from './export.schemas';
import type { CreateExportInput, ExportListFilters } from './export.types';

const exportService = new ExportService(new ExportRepository());

export class ExportController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = CreateExportSchema.parse(req.body) as CreateExportInput;
      const result = await exportService.createExport(dto);
      sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const result = await exportService.getExportById(id);
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = ExportListQuerySchema.parse(req.query) as ExportListFilters;
      const result = await exportService.listExports(query);
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const meta = await exportService.getDownloadMeta(id);

      res.setHeader('Content-Disposition', `attachment; filename="${meta.fileName}"`);
      res.setHeader('Content-Type', meta.mimeType);
      res.setHeader('Content-Length', meta.fileSize.toString());
      res.setHeader('X-Export-Id', meta.exportId);

      const stream = fs.createReadStream(meta.filePath);

      stream.on('error', (err) => {
        next(err);
      });

      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const result = await exportService.cancelExport(id);
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  async retry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const result = await exportService.retryExport(id);
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }
}