import type { Request, Response, NextFunction } from 'express';
import { smsService }    from './sms.service';
import { sendSmsSchema, sendBulkSmsSchema, smsIdParamSchema } from './sms.schemas';
import { createLogger }  from '../../config/logger';
import { successResponse } from '../../shared/response';
import { StatusCodes }   from 'http-status-codes';

const logger = createLogger('sms.controller');

export class SmsController {
  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto    = sendSmsSchema.parse(req.body);
      const result = await smsService.send(dto);

      res
        .status(StatusCodes.ACCEPTED)
        .json(successResponse(result, 'SMS queued successfully.'));
    } catch (err: unknown) {
      next(err);
    }
  }

  async sendBulk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto    = sendBulkSmsSchema.parse(req.body);
      const result = await smsService.sendBulk(dto);

      res
        .status(StatusCodes.ACCEPTED)
        .json(successResponse(result, 'Bulk SMS batch queued successfully.'));
    } catch (err: unknown) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = smsIdParamSchema.parse(req.params);
      const result = await smsService.getById(id);

      res
        .status(StatusCodes.OK)
        .json(successResponse(result));
    } catch (err: unknown) {
      next(err);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = smsIdParamSchema.parse(req.params);
      await smsService.cancel(id);

      res
        .status(StatusCodes.OK)
        .json(successResponse(null, 'SMS job cancelled successfully.'));
    } catch (err: unknown) {
      next(err);
    }
  }
}

export const smsController = new SmsController();