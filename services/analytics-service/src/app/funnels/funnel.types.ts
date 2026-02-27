import { FunnelStatus } from './funnel.schemas';

export type EventType = 'PAGE_VIEW' | 'CLICK' | 'FORM_SUBMIT' | 'CUSTOM';

export interface FunnelStep {
  order: number;
  name: string;
  eventType: EventType;
  eventName?: string;
  page?: string;
  filters?: Record<string, unknown>;
}

export interface FunnelStepResult {
  order: number;
  name: string;
  entries: number;
  dropoffs: number;
  conversionRate: number;
}

export interface CreateFunnelInput {
  name: string;
  description?: string;
  steps: FunnelStep[];
  createdBy: string;
}

export interface UpdateFunnelInput {
  name?: string;
  description?: string;
  steps?: FunnelStep[];
}

export interface ComputeFunnelInput {
  funnelId: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface FunnelListFilters {
  status?: FunnelStatus;
  page?: number;
  limit?: number;
}

export interface FunnelResponse {
  id: string;
  name: string;
  description: string | null;
  status: FunnelStatus;
  steps: FunnelStep[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FunnelResultResponse {
  id: string;
  funnelId: string;
  periodStart: Date;
  periodEnd: Date;
  stepResults: FunnelStepResult[];
  totalEntries: number;
  totalCompletions: number;
  conversionRate: number;
  computedAt: Date;
}

export interface FunnelWithResultsResponse extends FunnelResponse {
  latestResult: FunnelResultResponse | null;
}

export interface PaginatedFunnelsResponse {
  data: FunnelResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FunnelEntity {
  id: string;
  name: string;
  description: string | null;
  status: FunnelStatus;
  steps: FunnelStep[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface FunnelResultEntity {
  id: string;
  funnelId: string;
  periodStart: Date;
  periodEnd: Date;
  stepResults: FunnelStepResult[];
  totalEntries: number;
  totalCompletions: number;
  conversionRate: number;
  computedAt: Date;
  createdAt: Date;
}