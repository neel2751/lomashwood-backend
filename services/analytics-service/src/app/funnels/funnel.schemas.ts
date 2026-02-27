import { z } from 'zod';

export enum FunnelStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED',
}

const FunnelStepSchema = z.object({
  order: z.number().int().min(1),
  name: z.string().min(1),
  eventType: z.string().min(1),
  eventName: z.string().min(1),
  page: z.string().optional(),
  filters: z.record(z.unknown()).optional(),
});

export const CreateFunnelSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  createdBy: z.string().min(1),
  steps: z.array(FunnelStepSchema),
});

export const UpdateFunnelSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  steps: z.array(FunnelStepSchema).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export const ComputeFunnelSchema = z.object({
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  filters: z.record(z.unknown()).optional(),
});

export const FunnelListQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const FunnelResultQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// Export inferred types from Zod schemas
export type CreateFunnelDto = z.infer<typeof CreateFunnelSchema>;
export type UpdateFunnelDto = z.infer<typeof UpdateFunnelSchema>;
export type ComputeFunnelDto = z.infer<typeof ComputeFunnelSchema>;
export type FunnelListQueryDto = z.infer<typeof FunnelListQuerySchema>;
export type FunnelResultQueryDto = z.infer<typeof FunnelResultQuerySchema>;
export type FunnelStep = z.infer<typeof FunnelStepSchema>;