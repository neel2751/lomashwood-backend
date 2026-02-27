import { env, logger, REDIS_KEYS, REDIS_TTL } from '../config';

export type CalendarProvider = 'GOOGLE' | 'OUTLOOK' | 'APPLE';
export type SyncDirection  = 'IMPORT' | 'EXPORT' | 'BIDIRECTIONAL';

export interface CalendarIntegration {
  id: string;
  consultantId: string;
  provider: CalendarProvider;
  direction: SyncDirection;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt: Date;
  calendarId: string;
  lastSyncedAt?: Date;
  isActive: boolean;
  syncIntervalMinutes: number;
}

export const calendarSyncPolicy = {
  defaultSyncIntervalMinutes: 15,
  tokenRefreshBufferMinutes: 5,
  maxEventsPerSync: 500,
  lookAheadDays: 90,
  lookBehindDays: 1,
} as const;


export const syncCalendarIntegrationsJobConfig = {
  name: 'sync-calendar-integrations',
  cronExpression: '*/15 * * * *',  
  timeZone: 'Europe/London',
  runOnStart: false,
  maxConcurrent: 1,
  timeout: 5 * 60 * 1000,
  enabled: true,
} as const;