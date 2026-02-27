import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

import { DashboardService } from './dashboard.service';
import { DashboardRepository } from './dashboard.repository';
import { sendSuccess, sendCreated } from '../../shared/response';
import {
  CreateDashboardSchema,
  UpdateDashboardSchema,
  CreateWidgetSchema,
  UpdateWidgetSchema,
  DashboardListQuerySchema,
} from './dashboard.schemas';
import type {
  CreateDashboardInput,
  UpdateDashboardInput,
  CreateWidgetInput,
  UpdateWidgetInput,
  DashboardListFilters,
} from './dashboard.types';

const dashboardService = new DashboardService(new DashboardRepository());

export class DashboardController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = CreateDashboardSchema.parse(req.body) as CreateDashboardInput;
      const result = await dashboardService.createDashboard(dto);
      sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const result = await dashboardService.getDashboardById(id);
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  async getDefault(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await dashboardService.getDefaultDashboard();
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = DashboardListQuerySchema.parse(req.query) as DashboardListFilters;
      const result = await dashboardService.listDashboards(query);
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const dto = UpdateDashboardSchema.parse(req.body) as UpdateDashboardInput;
      const result = await dashboardService.updateDashboard(id, dto);
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  async setDefault(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const result = await dashboardService.setDefaultDashboard(id);
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      await dashboardService.deleteDashboard(id);
      sendSuccess(res, null, StatusCodes.NO_CONTENT);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const result = await dashboardService.getDashboardData(id);
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  async addWidget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const dto = CreateWidgetSchema.parse(req.body) as CreateWidgetInput;
      const result = await dashboardService.addWidget(id, dto);
      sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateWidget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, widgetId } = req.params as { id: string; widgetId: string };
      const dto = UpdateWidgetSchema.parse(req.body) as UpdateWidgetInput;
      const result = await dashboardService.updateWidget(id, widgetId, dto);
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  async removeWidget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, widgetId } = req.params as { id: string; widgetId: string };
      await dashboardService.removeWidget(id, widgetId);
      sendSuccess(res, null, StatusCodes.NO_CONTENT);
    } catch (error) {
      next(error);
    }
  }
}