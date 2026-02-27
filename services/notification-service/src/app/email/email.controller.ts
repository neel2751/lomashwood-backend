import type { Request, Response, NextFunction } from 'express';
import { emailService } from './email.service';
import { sendEmailSchema, sendBulkEmailSchema, emailIdParamSchema } from './email.schemas';
import { logger } from '../../config/logger';

export class EmailController {
  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = sendEmailSchema.parse(req.body);
      const result = await emailService.send(dto);

      res.status(202).json({
        success: true,
        data: result,
        message: 'Email queued successfully.',
      });
    } catch (err: unknown) {
      logger.error(err instanceof Error ? err.message : String(err));
      next(err);
    }
  }

  async sendBulk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = sendBulkEmailSchema.parse(req.body);
      const result = await emailService.sendBulk(dto);

      res.status(202).json({
        success: true,
        data: result,
        message: 'Bulk email batch queued successfully.',
      });
    } catch (err: unknown) {
      logger.error(err instanceof Error ? err.message : String(err));
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = emailIdParamSchema.parse(req.params);
      const result = await emailService.getById(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      logger.error(err instanceof Error ? err.message : String(err));
      next(err);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = emailIdParamSchema.parse(req.params);
      await emailService.cancel(id);

      res.status(200).json({
        success: true,
        data: null,
        message: 'Email job cancelled successfully.',
      });
    } catch (err: unknown) {
      logger.error(err instanceof Error ? err.message : String(err));
      next(err);
    }
  }
}

export const emailController = new EmailController();