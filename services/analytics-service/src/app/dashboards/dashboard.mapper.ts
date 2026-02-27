import type {
  DashboardEntity,
  DashboardWidgetEntity,
  DashboardResponse,
  DashboardSummaryResponse,
  WidgetResponse,
  WidgetPosition,
  WidgetConfig,
  DashboardConfig,
} from './dashboard.types';

export class DashboardMapper {
  static toResponse(
    entity: DashboardEntity & { widgets: DashboardWidgetEntity[] },
  ): DashboardResponse {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      type: entity.type,
      isDefault: entity.isDefault,
      config: entity.config as DashboardConfig,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      widgets: entity.widgets.map(DashboardMapper.toWidgetResponse),
    };
  }

  static toSummaryResponse(
    entity: DashboardEntity,
    widgetCount: number,
  ): DashboardSummaryResponse {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      type: entity.type,
      isDefault: entity.isDefault,
      widgetCount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toWidgetResponse(entity: DashboardWidgetEntity): WidgetResponse {
    return {
      id: entity.id,
      dashboardId: entity.dashboardId,
      title: entity.title,
      widgetType: entity.widgetType,
      metricKey: entity.metricKey,
      config: entity.config as WidgetConfig,
      position: entity.position as WidgetPosition,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}