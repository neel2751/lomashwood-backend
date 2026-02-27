import { env, logger, REDIS_KEYS, REDIS_TTL } from '../config';

export interface AutoCancelJobContext {
  findExpiredLockedSlots: () => Promise<ExpiredSlot[]>;
  findExpiredHeldSlots: () => Promise<HeldSlot[]>;
  releaseSlotLock: (slotId: string) => Promise<void>;
  releaseSlotHold: (slotId: string, bookingId: string) => Promise<void>;
  cancelBooking: (bookingId: string, reason: string) => Promise<void>;
  markSlotAvailable: (slotId: string, consultantId: string, scheduledAt: Date) => Promise<void>;
  invalidateCacheKeys: (keys: string[]) => Promise<void>;
  deleteCacheKeys: (keys: string[]) => Promise<void>;
  publishEvent: (topic: string, payload: unknown) => Promise<void>;
}

export const slotExpiryPolicy = {
  lockTtlSeconds: REDIS_TTL.lock,   
  holdTtlMinutes: 10,               
  gracePeriodSeconds: 30,
  batchSize: 50,
} as const;


export const autoCancelExpiredSlotsJobConfig = {
  name: 'auto-cancel-expired-slots',
  cronExpression: '* * * * *',     
  timeZone: 'Europe/London',
  runOnStart: true,
  maxConcurrent: 1,
  timeout: 2 * 60 * 1000,
  enabled: true,
} as const;