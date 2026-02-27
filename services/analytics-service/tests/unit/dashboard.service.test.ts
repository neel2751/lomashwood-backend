import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DashboardService } from '../../src/app/dashboards/dashboard.service';
import { DashboardRepository, DashboardType } from '../../src/app/dashboards/dashboard.repository';
import type {
  Dashboard,
  DashboardWithWidgets,
  PaginatedDashboards,
  Widget,
  DashboardResponse,
  WidgetResponse,
} from '../../src/app/dashboards/dashboard.types';

jest.mock('../../src/infrastructure/cache/redis.client');
jest.mock('../../src/config/logger');

const mockRepository: {
  [K in keyof DashboardRepository]: jest.MockedFunction<DashboardRepository[K]>;
} = {
  create:                    jest.fn<DashboardRepository['create']>(),
  findById:                  jest.fn<DashboardRepository['findById']>(),
  findByIdWithWidgets:       jest.fn<DashboardRepository['findByIdWithWidgets']>(),
  findDefaultWithWidgets:    jest.fn<DashboardRepository['findDefaultWithWidgets']>(),
  findAll:                   jest.fn<DashboardRepository['findAll']>(),
  count:                     jest.fn<DashboardRepository['count']>(),
  update:                    jest.fn<DashboardRepository['update']>(),
  setDefault:                jest.fn<DashboardRepository['setDefault']>(),
  softDelete:                jest.fn<DashboardRepository['softDelete']>(),
  createWidget:              jest.fn<DashboardRepository['createWidget']>(),
  findWidgetById:            jest.fn<DashboardRepository['findWidgetById']>(),
  findWidgetsByDashboardId:  jest.fn<DashboardRepository['findWidgetsByDashboardId']>(),
  countWidgetsByDashboardId: jest.fn<DashboardRepository['countWidgetsByDashboardId']>(),
  updateWidget:              jest.fn<DashboardRepository['updateWidget']>(),
  deleteWidget:              jest.fn<DashboardRepository['deleteWidget']>(),
};

const makeService = () => new DashboardService(mockRepository as unknown as DashboardRepository);

const sampleWidget: Widget = {
  id: 'widget-1',
  dashboardId: 'dash-1',
  title: 'Sessions Over Time',
  widgetType: 'line_chart',
  metricKey: 'sessions',
  config: { metric: 'sessions', granularity: 'day' },
  position: { x: 0, y: 0, w: 6, h: 4 },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleDashboard: Dashboard = {
  id: 'dash-1',
  name: 'Main Dashboard',
  type: DashboardType.PERSONAL,
  isDefault: true,
  createdBy: 'user-1',
  config: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleDashboardWithWidgets: DashboardWithWidgets = {
  ...sampleDashboard,
  widgets: [sampleWidget],
};

describe('DashboardService', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('createDashboard', () => {
    it('creates a dashboard and returns it', async (): Promise<void> => {
      mockRepository.create.mockResolvedValue(sampleDashboard);
      mockRepository.findByIdWithWidgets.mockResolvedValue(sampleDashboardWithWidgets);
      mockRepository.setDefault.mockResolvedValue(undefined);

      const service = makeService();
      const result = await service.createDashboard({
        name: 'Main Dashboard',
        type: DashboardType.PERSONAL,
        isDefault: true,
        createdBy: 'user-1',
      });

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect((result as Partial<DashboardResponse>).name).toBe('Main Dashboard');
    });
  });

  describe('getDashboardById', () => {
    it('returns dashboard when found', async (): Promise<void> => {
      mockRepository.findByIdWithWidgets.mockResolvedValue(sampleDashboardWithWidgets);

      const service = makeService();
      const result = await service.getDashboardById('dash-1');

      expect((result as Partial<DashboardResponse>).id).toBe('dash-1');
    });

    it('throws NotFoundError when not found', async (): Promise<void> => {
      mockRepository.findByIdWithWidgets.mockResolvedValue(null);

      const service = makeService();
      await expect(service.getDashboardById('missing')).rejects.toThrow();
    });
  });

  describe('getDefaultDashboard', () => {
    it('returns the default dashboard', async (): Promise<void> => {
      mockRepository.findDefaultWithWidgets.mockResolvedValue(sampleDashboardWithWidgets);

      const service = makeService();
      const result = await service.getDefaultDashboard();

      expect((result as Partial<DashboardResponse>).isDefault).toBe(true);
    });
  });

  describe('listDashboards', () => {
    it('returns paginated dashboards', async (): Promise<void> => {
      const paginated: PaginatedDashboards = {
        data: [{ ...sampleDashboard, widgets: [sampleWidget], _count: { widgets: 1 } }],
        total: 1,
      };
      mockRepository.findAll.mockResolvedValue(paginated);

      const service = makeService();
      const result = await service.listDashboards({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('updateDashboard', () => {
    it('updates dashboard name and returns updated record', async (): Promise<void> => {
      mockRepository.findById.mockResolvedValue(sampleDashboard);
      const updated: DashboardWithWidgets = { ...sampleDashboardWithWidgets, name: 'Updated Dashboard' };
      mockRepository.update.mockResolvedValue({ ...sampleDashboard, name: 'Updated Dashboard' });
      mockRepository.findByIdWithWidgets.mockResolvedValue(updated);

      const service = makeService();
      const result = await service.updateDashboard('dash-1', { name: 'Updated Dashboard' });

      expect((result as Partial<DashboardResponse>).name).toBe('Updated Dashboard');
    });

    it('throws NotFoundError when dashboard not found', async (): Promise<void> => {
      mockRepository.findById.mockResolvedValue(null);

      const service = makeService();
      await expect(service.updateDashboard('missing', { name: 'x' })).rejects.toThrow();
    });
  });

  describe('deleteDashboard', () => {
    it('deletes dashboard when found', async (): Promise<void> => {
      mockRepository.findById.mockResolvedValue(sampleDashboard);
      mockRepository.softDelete.mockResolvedValue(undefined);

      const service = makeService();
      await expect(service.deleteDashboard('dash-1')).resolves.not.toThrow();
      expect(mockRepository.softDelete).toHaveBeenCalledWith('dash-1');
    });

    it('throws NotFoundError when not found', async (): Promise<void> => {
      mockRepository.findById.mockResolvedValue(null);

      const service = makeService();
      await expect(service.deleteDashboard('missing')).rejects.toThrow();
    });
  });

  describe('addWidget', () => {
    it('adds a widget to the dashboard', async (): Promise<void> => {
      mockRepository.findById.mockResolvedValue(sampleDashboard);
      mockRepository.countWidgetsByDashboardId.mockResolvedValue(1);
      mockRepository.createWidget.mockResolvedValue(sampleWidget);

      const service = makeService();
      const result = await service.addWidget('dash-1', {
        title: 'Sessions Over Time',
        widgetType: 'line_chart',
        metricKey: 'sessions',
        position: { x: 0, y: 0, w: 6, h: 4 },
      });

      expect((result as Partial<WidgetResponse>).id).toBe('widget-1');
    });
  });

  describe('removeWidget', () => {
    it('removes a widget from the dashboard', async (): Promise<void> => {
      mockRepository.findById.mockResolvedValue(sampleDashboard);
      mockRepository.findWidgetById.mockResolvedValue(sampleWidget);
      mockRepository.deleteWidget.mockResolvedValue(undefined);

      const service = makeService();
      await expect(service.removeWidget('dash-1', 'widget-1')).resolves.not.toThrow();
      expect(mockRepository.deleteWidget).toHaveBeenCalledWith('widget-1');
    });

    it('throws when widget does not exist on dashboard', async (): Promise<void> => {
      mockRepository.findById.mockResolvedValue(sampleDashboard);
      mockRepository.findWidgetById.mockResolvedValue(null);

      const service = makeService();
      await expect(service.removeWidget('dash-1', 'nonexistent-widget')).rejects.toThrow();
    });
  });
});