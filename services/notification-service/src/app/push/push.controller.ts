import { Request, Response, NextFunction } from 'express';
import { PushService } from './push.service';
import {
  SendPushSchema,
  BulkSendPushSchema,
  SendPushToUserSchema,
  RegisterTokenSchema,
  PushNotificationFilterSchema,
} from './push.schemas';
import { sendSuccess, sendCreated } from '../../shared/utils';

export class PushController {
  constructor(private readonly pushService: PushService) {}

  send = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = SendPushSchema.parse(req.body);
      const result = await this.pushService.send(dto);
      sendCreated(res, result, 'Push notification sent');
    } catch (err) {
      next(err);
    }
  };

  sendBulk = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = BulkSendPushSchema.parse(req.body);
      const result = await this.pushService.sendBulk(dto);
      sendCreated(res, result, 'Bulk push notifications sent');
    } catch (err) {
      next(err);
    }
  };

  sendToUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const dto = SendPushToUserSchema.parse(req.body);
      const result = await this.pushService.sendToUser(userId, dto);
      sendCreated(res, result, 'Push notification sent to user');
    } catch (err) {
      next(err);
    }
  };

  registerToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user!.id;
      const dto = RegisterTokenSchema.parse(req.body);
      await this.pushService.registerToken(userId, dto);
      sendCreated(res, null, 'Push token registered');
    } catch (err) {
      next(err);
    }
  };

  unregisterToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user!.id;
      const { token } = req.params;
      await this.pushService.unregisterToken(userId, decodeURIComponent(token));
      sendSuccess(res, null, 'Push token unregistered');
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = PushNotificationFilterSchema.parse(req.query);
      const result = await this.pushService.list(filter);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const record = await this.pushService.getById(id);
      sendSuccess(res, record);
    } catch (err) {
      next(err);
    }
  };

  health = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const health = await this.pushService.checkProvidersHealth();
      sendSuccess(res, health, 'Push provider health status');
    } catch (err) {
      next(err);
    }
  };
}