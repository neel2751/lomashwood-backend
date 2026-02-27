import { env, logger, REDIS_KEYS } from '../config';

export interface CleanupJobContext {
  findStalePendingBookings: (olderThanHours: number) => Promise<StaleBooking[]>;
  findExpiredNoShowBookings: (pastDueHours: number) => Promise<StaleBooking[]>;
  findUnconfirmedBookings: (olderThanHours: number) => Promise<StaleBooking[]>;
  cancelBooking: (bookingId: string, reason: string) => Promise<void>;
  markAsNoShow: (bookingId: string) => Promise<void>;
  deleteExpiredBookings: (olderThanDays: number) => Promise<number>;
  invalidateCacheKeys: (keys: string[]) => Promise<void>;
  publishEvent: (topic: string, payload: unknown) => Promise<void>;
}

export const cleanupPolicy = {
  stalePendingHours: 48,
  noShowPastDueHours: 2,
  unconfirmedAfterHours: 24,
  hardDeleteAfterDays: 90,
  cachePurgeAfterDays: 7,
} as const;


export const cleanupBookingsJobConfig = {
  name: 'cleanup-bookings',
  cronExpression: '0 2 * * *',  
  timeZone: 'Europe/London',
  maxConcurrent: 1,
  timeout: 10 * 60 * 1000,
  enabled: true,
} as const;