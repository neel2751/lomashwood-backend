import { getRedisClient } from '../../infrastructure/cache/redis.client';
import { logger } from '../../config/logger';
import { NotFoundError, UnprocessableEntityError, ForbiddenError } from '../../shared/errors';
import { DashboardRepository } from './dashboard.repository';
import { DashboardMapper } from './dashboard.mapper';
import {
  DASHBOARD_CACHE_KEYS,
  DASHBOARD_CACHE_TTL,
  DASHBOARD_ERRORS,
  DASHBOARD_MAX_WIDGETS,
} from './dashboard.constants';
import type {
  CreateDashboardInput,
  UpdateDashboardInput,
  CreateWidgetInput,
  UpdateWidgetInput,
  DashboardListFilters,
  DashboardResponse,
  DashboardDataResponse,
  WidgetResponse,
  PaginatedDashboardsResponse,
} from './dashboard.types';

export class DashboardService {
  private readonly repository: DashboardRepository;

  constructor(repository: DashboardRepository) {
    this.repository = repository;
  }

  async createDashboard(input: CreateDashboardInput): Promise<DashboardResponse> {
    if (input.isDefault) {
      await this.repository.setDefault('', input.type).catch(() => null);
    }

    const dashboard = await this.repository.create(input);
    const withWidgets = await this.repository.findByIdWithWidgets(dashboard.id);

    await this.invalidateDashboardListCache();

    logger.info({ dashboardId: dashboard.id, name: dashboard.name }, 'Dashboard created');

    return DashboardMapper.toResponse(withWidgets!);
  }

  async getDashboardById(id: string): Promise<DashboardResponse> {
    const redis = getRedisClient();
    const cacheKey = DASHBOARD_CACHE_KEYS.dashboard(id);
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as DashboardResponse;
    }

    const dashboard = await this.repository.findByIdWithWidgets(id);

    if (!dashboard) {
      throw new NotFoundError('Dashboard', id);
    }

    const response = DashboardMapper.toResponse(dashboard);
    await redis.setex(cacheKey, String(DASHBOARD_CACHE_TTL.DASHBOARD), JSON.stringify(response));

    return response;
  }

  async getDefaultDashboard(): Promise<DashboardResponse> {
    const redis = getRedisClient();
    const cacheKey = DASHBOARD_CACHE_KEYS.defaultDashboard();
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as DashboardResponse;
    }

    const dashboard = await this.repository.findDefaultWithWidgets();

    if (!dashboard) {
      throw new NotFoundError('Dashboard');
    }

    const response = DashboardMapper.toResponse(dashboard);
    await redis.setex(cacheKey, String(DASHBOARD_CACHE_TTL.DASHBOARD), JSON.stringify(response));

    return response;
  }

  async listDashboards(filters: DashboardListFilters): Promise<PaginatedDashboardsResponse> {
    const { page = 1, limit = 20 } = filters;
    const { data, total } = await this.repository.findAll(filters);

    return {
      data: data.map((d) => DashboardMapper.toSummaryResponse(d, d._count.widgets)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateDashboard(id: string, input: UpdateDashboardInput): Promise<DashboardResponse> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError('Dashboard', id);
    }

    await this.repository.update(id, input);
    const updated = await this.repository.findByIdWithWidgets(id);

    await this.invalidateDashboardCache(id, existing.isDefault);

    logger.info({ dashboardId: id }, 'Dashboard updated');

    return DashboardMapper.toResponse(updated!);
  }

  async setDefaultDashboard(id: string): Promise<DashboardResponse> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError('Dashboard', id);
    }

    await this.repository.setDefault(id, existing.type);
    const updated = await this.repository.findByIdWithWidgets(id);

    const redis = getRedisClient();
    await Promise.all([
      redis.del(DASHBOARD_CACHE_KEYS.dashboard(id)),
      redis.del(DASHBOARD_CACHE_KEYS.defaultDashboard()),
      redis.del(DASHBOARD_CACHE_KEYS.allDashboards()),
    ]);

    logger.info({ dashboardId: id }, 'Dashboard set as default');

    return DashboardMapper.toResponse(updated!);
  }

  async deleteDashboard(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError('Dashboard', id);
    }

    await this.repository.softDelete(id);
    await this.invalidateDashboardCache(id, existing.isDefault);

    logger.info({ dashboardId: id }, 'Dashboard deleted');
  }

  async getDashboardData(id: string): Promise<DashboardDataResponse> {
    const redis = getRedisClient();
    const cacheKey = DASHBOARD_CACHE_KEYS.dashboardData(id);
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as DashboardDataResponse;
    }

    const dashboard = await this.repository.findByIdWithWidgets(id);

    if (!dashboard) {
      throw new NotFoundError('Dashboard', id);
    }

    const widgetData = dashboard.widgets.map((widget) => ({
      widgetId: widget.id,
      metricKey: widget.metricKey,
      data: null,
      refreshedAt: new Date(),
    }));

    const response: DashboardDataResponse = {
      dashboardId: id,
      widgets: widgetData,
      refreshedAt: new Date(),
    };

    await redis.setex(cacheKey, String(DASHBOARD_CACHE_TTL.DATA), JSON.stringify(response));

    return response;
  }

  async addWidget(dashboardId: string, input: Omit<CreateWidgetInput, 'dashboardId'>): Promise<WidgetResponse> {
    const dashboard = await this.repository.findById(dashboardId);

    if (!dashboard) {
      throw new NotFoundError('Dashboard', dashboardId);
    }

    const widgetCount = await this.repository.countWidgetsByDashboardId(dashboardId);

    if (widgetCount >= DASHBOARD_MAX_WIDGETS) {
      throw new UnprocessableEntityError(`Dashboard cannot exceed ${DASHBOARD_MAX_WIDGETS} widgets`);
    }

    const widget = await this.repository.createWidget({ dashboardId, ...input });

    await this.invalidateDashboardCache(dashboardId, dashboard.isDefault);

    logger.info({ dashboardId, widgetId: widget.id }, 'Widget added to dashboard');

    return DashboardMapper.toWidgetResponse(widget);
  }

  async updateWidget(
    dashboardId: string,
    widgetId: string,
    input: UpdateWidgetInput,
  ): Promise<WidgetResponse> {
    const dashboard = await this.repository.findById(dashboardId);

    if (!dashboard) {
      throw new NotFoundError('Dashboard', dashboardId);
    }

    const widget = await this.repository.findWidgetById(widgetId);

    if (!widget) {
      throw new NotFoundError('Widget', widgetId);
    }

    if (widget.dashboardId !== dashboardId) {
      throw new ForbiddenError(DASHBOARD_ERRORS.WIDGET_BELONGS_TO_OTHER);
    }

    const updated = await this.repository.updateWidget(widgetId, input);

    await this.invalidateDashboardCache(dashboardId, dashboard.isDefault);

    return DashboardMapper.toWidgetResponse(updated);
  }

  async removeWidget(dashboardId: string, widgetId: string): Promise<void> {
    const dashboard = await this.repository.findById(dashboardId);

    if (!dashboard) {
      throw new NotFoundError('Dashboard', dashboardId);
    }

    const widget = await this.repository.findWidgetById(widgetId);

    if (!widget) {
      throw new NotFoundError('Widget', widgetId);
    }

    if (widget.dashboardId !== dashboardId) {
      throw new ForbiddenError(DASHBOARD_ERRORS.WIDGET_BELONGS_TO_OTHER);
    }

    await this.repository.deleteWidget(widgetId);
    await this.invalidateDashboardCache(dashboardId, dashboard.isDefault);

    logger.info({ dashboardId, widgetId }, 'Widget removed from dashboard');
  }

  private async invalidateDashboardCache(id: string, isDefault: boolean): Promise<void> {
    const redis = getRedisClient();
    const keys = [
      DASHBOARD_CACHE_KEYS.dashboard(id),
      DASHBOARD_CACHE_KEYS.allDashboards(),
      DASHBOARD_CACHE_KEYS.dashboardData(id),
    ];

    if (isDefault) {
      keys.push(DASHBOARD_CACHE_KEYS.defaultDashboard());
    }

    await redis.del(...keys);
  }

  private async invalidateDashboardListCache(): Promise<void> {
    const redis = getRedisClient();
    await redis.del(DASHBOARD_CACHE_KEYS.allDashboards());
  }
}