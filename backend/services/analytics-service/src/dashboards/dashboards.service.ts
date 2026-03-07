import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsDashboard } from './entities/analytics-dashboard.entity';
import { DashboardWidget } from './entities/dashboard-widget.entity';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';

@Injectable()
export class DashboardsService {
  constructor(
    @InjectRepository(AnalyticsDashboard)
    private readonly dashboardRepository: Repository<AnalyticsDashboard>,
    @InjectRepository(DashboardWidget)
    private readonly widgetRepository: Repository<DashboardWidget>,
  ) {}

  async createDashboard(createDashboardDto: CreateDashboardDto): Promise<AnalyticsDashboard> {
    const dashboard = this.dashboardRepository.create(createDashboardDto);
    return this.dashboardRepository.save(dashboard);
  }

  async getDashboards(query: any): Promise<{ dashboards: AnalyticsDashboard[]; total: number }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const [dashboards, total] = await this.dashboardRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['widgets'],
    });

    return { dashboards, total };
  }

  async getDashboard(id: string): Promise<AnalyticsDashboard> {
    const dashboard = await this.dashboardRepository.findOne({
      where: { id },
      relations: ['widgets'],
    });

    if (!dashboard) {
      throw new NotFoundException(`Dashboard with id ${id} not found`);
    }

    return dashboard;
  }

  async updateDashboard(id: string, updateDashboardDto: UpdateDashboardDto): Promise<AnalyticsDashboard> {
    const dashboard = await this.dashboardRepository.findOne({ where: { id } });

    if (!dashboard) {
      throw new NotFoundException(`Dashboard with id ${id} not found`);
    }

    Object.assign(dashboard, updateDashboardDto);
    return this.dashboardRepository.save(dashboard);
  }

  async deleteDashboard(id: string): Promise<any> {
    await this.widgetRepository.delete({ dashboardId: id });
    await this.dashboardRepository.delete(id);
    return { success: true };
  }

  async addWidget(
  dashboardId: string,
  widgetDto: {
    title: string;
    type: string;
    query?: any;
    config?: any;
    position?: any;
  }
): Promise<DashboardWidget> {
  const widget = this.widgetRepository.create({
    ...widgetDto,
    dashboardId,
  });
  return this.widgetRepository.save(widget);
}

  async updateWidget(dashboardId: string, widgetId: string, widgetDto: any): Promise<DashboardWidget> {
    const widget = await this.widgetRepository.findOne({ where: { id: widgetId, dashboardId } });

    if (!widget) {
      throw new NotFoundException(`Widget with id ${widgetId} not found`);
    }

    Object.assign(widget, widgetDto);
    return this.widgetRepository.save(widget);
  }

  async removeWidget(dashboardId: string, widgetId: string): Promise<any> {
    await this.widgetRepository.delete({ id: widgetId, dashboardId });
    return { success: true };
  }

  async getDashboardData(id: string, query: any): Promise<any> {
    const dashboard = await this.getDashboard(id);
    const { startDate, endDate } = query;

    return {
      dashboard,
      data: dashboard.widgets?.map(widget => ({
        widgetId: widget.id,
        widgetName: widget.title,
        data: this.generateMockData(widget.type),
      })) || [],
      period: { startDate, endDate },
    };
  }

  async cloneDashboard(id: string, name: string): Promise<AnalyticsDashboard> {
    const originalDashboard = await this.getDashboard(id);

    const clonedDashboard = this.dashboardRepository.create({
      name,
      description: `Cloned from ${originalDashboard.name}`,
      layout: originalDashboard.layout,
      createdBy: originalDashboard.createdBy,
    });

    const savedDashboard = await this.dashboardRepository.save(clonedDashboard);

    for (const widget of originalDashboard.widgets) {
      await this.addWidget(savedDashboard.id, {
        title: widget.title,
        type: widget.type,
        query: widget.query,
        config: widget.config,
        position: widget.position,
      });
    }

    return this.getDashboard(savedDashboard.id);
  }

  async shareDashboard(id: string, users: string[], permissions: string[]): Promise<any> {
    const dashboard = await this.dashboardRepository.findOne({ where: { id } });

    if (!dashboard) {
      throw new NotFoundException(`Dashboard with id ${id} not found`);
    }

    dashboard.sharedWith = users;
    dashboard.permissions = permissions;
    await this.dashboardRepository.save(dashboard);

    return { success: true, sharedWith: users, permissions };
  }

  private generateMockData(type: string): any {
    switch (type) {
      case 'LINE_CHART':
        return { labels: ['Jan', 'Feb', 'Mar'], datasets: [{ data: [100, 200, 150] }] };
      case 'BAR_CHART':
        return { labels: ['A', 'B', 'C'], datasets: [{ data: [50, 75, 100] }] };
      case 'PIE_CHART':
        return { labels: ['X', 'Y', 'Z'], datasets: [{ data: [30, 40, 30] }] };
      case 'NUMBER':
        return { value: 1234, change: 12.5 };
      default:
        return {};
    }
  }
}