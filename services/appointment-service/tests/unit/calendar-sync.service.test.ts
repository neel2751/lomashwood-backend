import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockBookingRepository } from '../../src/tests-helpers/mocks';
import { bookingShowroomKitchenFixture, cancelledBookingFixture } from '../fixtures/bookings.fixture';
import { FIXED_IDS } from '../fixtures/common.fixture';
import { CalendarSyncFailedError } from '../../src/shared/errors';

setupTestEnvironment();

const mockCalendarProvider = {
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  getEvent: jest.fn(),
};

const mockDeps = {
  bookingRepository: mockBookingRepository,
  calendarProvider: mockCalendarProvider,
};

let CalendarSyncService: any;

beforeEach(async () => {
  jest.resetModules();
  ({ CalendarSyncService } = await import('../../src/app/calendar-sync/calendar-sync.service'));
});

describe('CalendarSyncService.syncBookingCreated', () => {
  it('creates a calendar event for a new booking', async () => {
    mockCalendarProvider.createEvent.mockResolvedValue({ eventId: 'gcal-event-001' });

    const service = new CalendarSyncService(mockDeps);
    await expect(service.syncBookingCreated(bookingShowroomKitchenFixture)).resolves.not.toThrow();

    expect(mockCalendarProvider.createEvent).toHaveBeenCalledTimes(1);
  });

  it('throws CalendarSyncFailedError when provider fails', async () => {
    mockCalendarProvider.createEvent.mockRejectedValue(new Error('API quota exceeded'));

    const service = new CalendarSyncService(mockDeps);
    await expect(service.syncBookingCreated(bookingShowroomKitchenFixture)).rejects.toThrow(CalendarSyncFailedError);
  });
});

describe('CalendarSyncService.syncBookingCancelled', () => {
  it('deletes the calendar event for a cancelled booking', async () => {
    mockCalendarProvider.deleteEvent.mockResolvedValue(undefined);

    const service = new CalendarSyncService(mockDeps);
    await expect(service.syncBookingCancelled(cancelledBookingFixture)).resolves.not.toThrow();

    expect(mockCalendarProvider.deleteEvent).toHaveBeenCalledTimes(1);
  });
});

describe('CalendarSyncService.syncBookingRescheduled', () => {
  it('updates the calendar event for a rescheduled booking', async () => {
    mockCalendarProvider.updateEvent.mockResolvedValue(undefined);

    const service = new CalendarSyncService(mockDeps);
    await expect(
      service.syncBookingRescheduled(bookingShowroomKitchenFixture),
    ).resolves.not.toThrow();

    expect(mockCalendarProvider.updateEvent).toHaveBeenCalledTimes(1);
  });
});