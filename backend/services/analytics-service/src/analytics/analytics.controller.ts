import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AnalyticsService } from '../analytics/analytics.service';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export class AnalyticsController {
  private analyticsService = new AnalyticsService();

  async trackEvent(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(e => ({
            field: 'path' in e ? e.path : 'unknown',
            message: e.msg,
          })),
        } as ApiResponse);
        return;
      }

      const eventData = req.body;
      const result = await this.analyticsService.trackEvent(eventData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Track event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        userId,
        event,
        category,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        userId: userId as string,
        event: event as string,
        category: category as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await this.analyticsService.getEvents({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters,
      });

      res.json(result);
    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getEventMetrics(req: Request, res: Response): Promise<void> {
    try {
      const {
        event,
        category,
        startDate,
        endDate,
        groupBy = 'day',
      } = req.query;

      const metricsParams = {
        event: event as string,
        category: category as string,
        startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate as string) : new Date(),
        groupBy: groupBy as 'hour' | 'day' | 'week' | 'month',
      };

      const result = await this.analyticsService.getEventMetrics(metricsParams);

      res.json(result);
    } catch (error) {
      console.error('Get event metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.analyticsService.getDashboard(id);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getDashboards(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        active,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        active: active === 'true',
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await this.analyticsService.getDashboards({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters,
      });

      res.json(result);
    } catch (error) {
      console.error('Get dashboards error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async createDashboard(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(e => ({
            field: 'path' in e ? e.path : 'unknown',
            message: e.msg,
          })),
        } as ApiResponse);
        return;
      }

      const dashboardData = req.body;
      const result = await this.analyticsService.createDashboard(dashboardData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async updateDashboard(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(e => ({
            field: 'path' in e ? e.path : 'unknown',
            message: e.msg,
          })),
        } as ApiResponse);
        return;
      }

      const { id } = req.params;
      const dashboardData = req.body;
      const result = await this.analyticsService.updateDashboard(id, dashboardData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Update dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getWidget(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.analyticsService.getWidget(id);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get widget error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getWidgets(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        dashboardId,
        type,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        dashboardId: dashboardId as string,
        type: type as string,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await this.analyticsService.getWidgets({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters,
      });

      res.json(result);
    } catch (error) {
      console.error('Get widgets error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async createWidget(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(e => ({
            field: 'path' in e ? e.path : 'unknown',
            message: e.msg,
          })),
        } as ApiResponse);
        return;
      }

      const widgetData = req.body;
      const result = await this.analyticsService.createWidget(widgetData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create widget error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async updateWidget(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(e => ({
            field: 'path' in e ? e.path : 'unknown',
            message: e.msg,
          })),
        } as ApiResponse);
        return;
      }

      const { id } = req.params;
      const widgetData = req.body;
      const result = await this.analyticsService.updateWidget(id, widgetData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Update widget error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getFunnel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.analyticsService.getFunnel(id);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get funnel error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getFunnels(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        active,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        active: active === 'true',
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await this.analyticsService.getFunnels({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters,
      });

      res.json(result);
    } catch (error) {
      console.error('Get funnels error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getRealTimeStats(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analyticsService.getRealTimeStats();

      res.json(result);
    } catch (error) {
      console.error('Get real-time stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getOverviewStats(req: Request, res: Response): Promise<void> {
    try {
      const {
        startDate,
        endDate,
      } = req.query;

      const statsParams = {
        startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate as string) : new Date(),
      };

      const result = await this.analyticsService.getOverviewStats(statsParams);

      res.json(result);
    } catch (error) {
      console.error('Get overview stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }
}