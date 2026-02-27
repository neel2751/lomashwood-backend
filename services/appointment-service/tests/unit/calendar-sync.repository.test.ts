import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockPrismaClient } from '../../src/tests-helpers/mocks';
import { FIXED_IDS } from '../fixtures/common.fixture';

setupTestEnvironment();

let CalendarSyncRepository: any;

beforeEach(async () => {
  jest.resetModules();
  ({ CalendarSyncRepository } = await import('../../src/app/calendar-sync/calendar-sync.repository'));
});

describe('CalendarSyncRepository.saveEventId', () => {
  it('saves a provider event ID against a booking', async () => {
    mockPrismaClient.booking.update.mockResolvedValue({ id: FIXED_IDS.bookingId });

    const repo = new CalendarSyncRepository(mockPrismaClient);
    await expect(repo.saveEventId(FIXED_IDS.bookingId, 'gcal-event-001')).resolves.not.toThrow();

    expect(mockPrismaClient.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: FIXED_IDS.bookingId } }),
    );
  });
});

describe('CalendarSyncRepository.getEventId', () => {
  it('retrieves the provider event ID for a booking', async () => {
    mockPrismaClient.booking.findUnique.mockResolvedValue({
      id: FIXED_IDS.bookingId,
      calendarEventId: 'gcal-event-001',
    });

    const repo = new CalendarSyncRepository(mockPrismaClient);
    const result = await repo.getEventId(FIXED_IDS.bookingId);

    expect(result).toBe('gcal-event-001');
  });

  it('returns null when no event ID is stored', async () => {
    mockPrismaClient.booking.findUnique.mockResolvedValue({
      id: FIXED_IDS.bookingId,
      calendarEventId: null,
    });

    const repo = new CalendarSyncRepository(mockPrismaClient);
    expect(await repo.getEventId(FIXED_IDS.bookingId)).toBeNull();
  });
});