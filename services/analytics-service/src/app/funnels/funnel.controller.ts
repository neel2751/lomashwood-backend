import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

import { FunnelService } from './funnel.service';
import { FunnelRepository } from './funnel.repository';
import { sendSuccess, sendCreated } from '../../shared/response';
import {
  CreateFunnelSchema,
  UpdateFunnelSchema,
  ComputeFunnelSchema,
  FunnelListQuerySchema,
  FunnelResultQuerySchema,
} from './funnel.schemas';
import type { FunnelListFilters } from './funnel.types';

const funnelService = new FunnelService(new FunnelRepository());

export class FunnelController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = CreateFunnelSchema.parse(req.body) as Parameters<typeof funnelService.createFunnel>[0];
      const result = await funnelService.createFunnel(dto);
      sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const result = await funnelService.getFunnelById(id);
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = FunnelListQuerySchema.parse(req.query) as FunnelListFilters;
      const result = await funnelService.listFunnels(query);
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const dto = UpdateFunnelSchema.parse(req.body) as Parameters<typeof funnelService.updateFunnel>[1];
      const result = await funnelService.updateFunnel(id, dto);
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  async pause(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const result = await funnelService.pauseFunnel(id);
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  async resume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const result = await funnelService.resumeFunnel(id);
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      await funnelService.archiveFunnel(id);
      sendSuccess(res, null, StatusCodes.NO_CONTENT);
    } catch (error) {
      next(error);
    }
  }

  async compute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const dto = ComputeFunnelSchema.parse(req.body);
      const result = await funnelService.computeFunnel({
        funnelId: id,
        periodStart: new Date(dto.startDate),
        periodEnd: new Date(dto.endDate),
      });
      sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const query = FunnelResultQuerySchema.parse(req.query);
      const result = await funnelService.getFunnelResults(id, query);
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }
}