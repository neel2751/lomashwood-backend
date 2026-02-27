import { EventType, DeviceType } from './tracking.schemas';

export interface TrackEventInput {
  sessionId: string;
  visitorId: string;
  userId?: string;
  eventType: EventType;
  eventName: string;
  page?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  deviceType?: DeviceType;
  browser?: string;
  os?: string;
  country?: string;
  region?: string;
  city?: string;
  ipHash?: string;
  properties?: Record<string, unknown>;
  duration?: number;
}

export interface TrackBatchInput {
  events: TrackEventInput[];
}

export interface StartSessionInput {
  visitorId: string;
  userId?: string;
  deviceType?: DeviceType;
  browser?: string;
  os?: string;
  country?: string;
  region?: string;
  city?: string;
  ipHash?: string;
  referrer?: string;
  landingPage?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  properties?: Record<string, unknown>;
}

export interface EndSessionInput {
  sessionId: string;
  exitPage?: string;
  duration?: number;
  pageViews?: number;
  bounced?: boolean;
  converted?: boolean;
}

export interface TrackPageViewInput {
  sessionId: string;
  visitorId: string;
  userId?: string;
  page: string;
  title?: string;
  referrer?: string;
  deviceType?: DeviceType;
  timeOnPage?: number;
  scrollDepth?: number;
  country?: string;
}

export interface CreateTrackingConfigInput {
  key: string;
  name: string;
  description?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
}

export interface UpdateTrackingConfigInput {
  name?: string;
  description?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
}

export interface TrackingEventResponse {
  id: string;
  sessionId: string;
  visitorId: string;
  eventType: EventType;
  eventName: string;
  createdAt: Date;
}

export interface SessionResponse {
  id: string;
  visitorId: string;
  userId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  deviceType: DeviceType;
  country: string | null;
}

export interface PageViewResponse {
  id: string;
  sessionId: string;
  visitorId: string;
  page: string;
  createdAt: Date;
}

export interface TrackingConfigResponse {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackBatchResponse {
  processed: number;
  failed: number;
  eventIds: string[];
}

export interface AnalyticsEventEntity {
  id: string;
  sessionId: string;
  visitorId: string;
  userId?: string | null;
  eventType: EventType;
  eventName: string;
  page?: string | null;
  properties?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface AnalyticsSessionEntity {
  id: string;
  visitorId: string;
  userId?: string | null;
  deviceType?: DeviceType | null;
  startedAt: Date;
  endedAt?: Date | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
}

export interface PageViewEntity {
  id: string;
  sessionId: string;
  visitorId: string;
  page: string;
  title?: string | null;
  createdAt: Date;
}

export interface TrackingConfigEntity {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}