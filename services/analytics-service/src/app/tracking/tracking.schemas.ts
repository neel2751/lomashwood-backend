import { z } from 'zod';

export enum EventType {
  PAGE_VIEW = 'PAGE_VIEW',
  CLICK = 'CLICK',
  FORM_SUBMIT = 'FORM_SUBMIT',
  CUSTOM = 'CUSTOM',
  SESSION_START = 'SESSION_START',
  SESSION_END = 'SESSION_END',
}

export enum DeviceType {
  DESKTOP = 'DESKTOP',
  MOBILE = 'MOBILE',
  TABLET = 'TABLET',
  UNKNOWN = 'UNKNOWN',
}

export const TrackEventSchema = z.object({
  sessionId: z.string().uuid(),
  visitorId: z.string().min(1).max(128),
  userId: z.string().uuid().optional(),
  eventType: z.nativeEnum(EventType),
  eventName: z.string().min(1).max(128),
  page: z.string().max(2048).optional(),
  referrer: z.string().max(2048).optional(),
  utmSource: z.string().max(255).optional(),
  utmMedium: z.string().max(255).optional(),
  utmCampaign: z.string().max(255).optional(),
  utmContent: z.string().max(255).optional(),
  utmTerm: z.string().max(255).optional(),
  deviceType: z.nativeEnum(DeviceType).optional(),
  browser: z.string().max(128).optional(),
  os: z.string().max(128).optional(),
  country: z.string().max(2).optional(),
  region: z.string().max(128).optional(),
  city: z.string().max(128).optional(),
  ipHash: z.string().max(64).optional(),
  properties: z.record(z.unknown()).optional(),
  duration: z.number().int().nonnegative().optional(),
});

export const TrackBatchSchema = z.object({
  events: z
    .array(TrackEventSchema)
    .min(1)
    .max(100, 'Batch exceeds maximum of 100 events'),
});

export const StartSessionSchema = z.object({
  visitorId: z.string().min(1).max(128),
  userId: z.string().uuid().optional(),
  deviceType: z.nativeEnum(DeviceType).optional(),
  browser: z.string().max(128).optional(),
  os: z.string().max(128).optional(),
  country: z.string().max(2).optional(),
  region: z.string().max(128).optional(),
  city: z.string().max(128).optional(),
  ipHash: z.string().max(64).optional(),
  referrer: z.string().max(2048).optional(),
  landingPage: z.string().max(2048).optional(),
  utmSource: z.string().max(255).optional(),
  utmMedium: z.string().max(255).optional(),
  utmCampaign: z.string().max(255).optional(),
  properties: z.record(z.unknown()).optional(),
});

export const EndSessionSchema = z.object({
  sessionId: z.string().uuid(),
  exitPage: z.string().max(2048).optional(),
  duration: z.number().int().nonnegative().optional(),
  pageViews: z.number().int().nonnegative().optional(),
  bounced: z.boolean().optional(),
  converted: z.boolean().optional(),
});

export const TrackPageViewSchema = z.object({
  sessionId: z.string().uuid(),
  visitorId: z.string().min(1).max(128),
  userId: z.string().uuid().optional(),
  page: z.string().min(1).max(2048),
  title: z.string().max(512).optional(),
  referrer: z.string().max(2048).optional(),
  deviceType: z.nativeEnum(DeviceType).optional(),
  timeOnPage: z.number().int().nonnegative().optional(),
  scrollDepth: z.number().int().min(0).max(100).optional(),
  country: z.string().max(2).optional(),
});

export const CreateTrackingConfigSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[a-z0-9_]+$/, 'Key must be lowercase alphanumeric with underscores'),
  name: z.string().min(1).max(255),
  description: z.string().max(1024).optional(),
  enabled: z.boolean().optional().default(true),
  config: z.record(z.unknown()).optional().default({}),
});

export const UpdateTrackingConfigSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1024).optional(),
  enabled: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});

export type TrackEventDto = z.infer<typeof TrackEventSchema>;
export type TrackBatchDto = z.infer<typeof TrackBatchSchema>;
export type StartSessionDto = z.infer<typeof StartSessionSchema>;
export type EndSessionDto = z.infer<typeof EndSessionSchema>;
export type TrackPageViewDto = z.infer<typeof TrackPageViewSchema>;
export type CreateTrackingConfigDto = z.infer<typeof CreateTrackingConfigSchema>;
export type UpdateTrackingConfigDto = z.infer<typeof UpdateTrackingConfigSchema>;