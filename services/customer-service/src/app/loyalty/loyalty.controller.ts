import { Request, Response, NextFunction } from 'express';
import { LoyaltyService } from './loyalty.service';
import { EarnPointsSchema, RedeemPointsSchema, AdjustPointsSchema, LoyaltyTransactionQuerySchema } from './loyalty.schemas';
import { sendSuccess, sendCreated } from '../../shared/utils';

export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  getMyAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.user!.id;
      const account = await this.loyaltyService.getOrCreateAccount(customerId);
      sendSuccess(res, account);
    } catch (error) {
      next(error);
    }
  };

  getMyTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.user!.id;
      const query = LoyaltyTransactionQuerySchema.parse(req.query);
      const result = await this.loyaltyService.getTransactions(customerId, query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  redeemPoints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.user!.id;
      const data = RedeemPointsSchema.parse(req.body);
      const result = await this.loyaltyService.redeemPoints(customerId, data);
      sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  };

  earnPoints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = EarnPointsSchema.parse(req.body);
      const result = await this.loyaltyService.earnPoints(data);
      sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  };

  adjustPoints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = AdjustPointsSchema.parse(req.body);
      const result = await this.loyaltyService.adjustPoints(data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getAccountByCustomerId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { customerId } = req.params;
      const account = await this.loyaltyService.getAccount(customerId);
      sendSuccess(res, account);
    } catch (error) {
      next(error);
    }
  };

  getTransactionsByCustomerId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { customerId } = req.params;
      const query = LoyaltyTransactionQuerySchema.parse(req.query);
      const result = await this.loyaltyService.getTransactions(customerId, query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}