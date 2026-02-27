import { z } from 'zod';

import {
  DASHBOARD_NAME_MAX_LENGTH,
  DASHBOARD_DESCRIPTION_MAX_LENGTH,
  WIDGET_TYPES,
} from './dashboard.constants';

export enum DashboardType {
  PERSONAL = 'PERSONAL',
  SHARED = 'SHARED',
  SYSTEM = 'SYSTEM',
}

const WidgetPositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(12),
  h: z.number().int().min(1).max(12),
});

const WidgetConfigSchema = z
  .record(z.unknown())
  .optional()
  .default({});

const DashboardConfigSchema = z
  .record(z.unknown())
  .optional()
  .default({});

export const CreateDashboardSchema = z.object({
  name: z.string().min(1).max(DASHBOARD_NAME_MAX_LENGTH),
  description: z.string().max(DASHBOARD_DESCRIPTION_MAX_LENGTH).optional(),
  type: z.nativeEnum(DashboardType),
  isDefault: z.boolean().optional().default(false),
  createdBy: z.string().min(1).max(128),
  config: DashboardConfigSchema,
});

export const UpdateDashboardSchema = z.object({
  name: z.string().min(1).max(DASHBOARD_NAME_MAX_LENGTH).optional(),
  description: z.string().max(DASHBOARD_DESCRIPTION_MAX_LENGTH).optional(),
  config: DashboardConfigSchema,
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export const CreateWidgetSchema = z.object({
  title: z.string().min(1).max(255),
  widgetType: z.enum([
    WIDGET_TYPES.METRIC_CARD,
    WIDGET_TYPES.LINE_CHART,
    WIDGET_TYPES.BAR_CHART,
    WIDGET_TYPES.PIE_CHART,
    WIDGET_TYPES.TABLE,
    WIDGET_TYPES.HEATMAP,
    WIDGET_TYPES.FUNNEL_CHART,
    WIDGET_TYPES.AREA_CHART,
    WIDGET_TYPES.SCATTER_PLOT,
    WIDGET_TYPES.GAUGE,
  ]),
  metricKey: z.string().min(1).max(255).optional(),
  config: WidgetConfigSchema,
  position: WidgetPositionSchema,
});

export const UpdateWidgetSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  widgetType: z
    .enum([
      WIDGET_TYPES.METRIC_CARD,
      WIDGET_TYPES.LINE_CHART,
      WIDGET_TYPES.BAR_CHART,
      WIDGET_TYPES.PIE_CHART,
      WIDGET_TYPES.TABLE,
      WIDGET_TYPES.HEATMAP,
      WIDGET_TYPES.FUNNEL_CHART,
      WIDGET_TYPES.AREA_CHART,
      WIDGET_TYPES.SCATTER_PLOT,
      WIDGET_TYPES.GAUGE,
    ])
    .optional(),
  metricKey: z.string().min(1).max(255).optional(),
  config: WidgetConfigSchema,
  position: WidgetPositionSchema.optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export const DashboardListQuerySchema = z.object({
  type: z.nativeEnum(DashboardType).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateDashboardDto = z.infer<typeof CreateDashboardSchema>;
export type UpdateDashboardDto = z.infer<typeof UpdateDashboardSchema>;
export type CreateWidgetDto = z.infer<typeof CreateWidgetSchema>;
export type UpdateWidgetDto = z.infer<typeof UpdateWidgetSchema>;
export type DashboardListQueryDto = z.infer<typeof DashboardListQuerySchema>;




