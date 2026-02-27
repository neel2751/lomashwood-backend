import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockPrismaClient } from '../../src/tests-helpers/mocks';
import {
  reminder24hEmailFixture,
  pendingRemindersListFixture,
  bookingRemindersListFixture,
  createReminderPayload,
} from '../fixtures/reminders.fixture';
import { FIXED_IDS, FIXED_DATE_NOW } from '../fixtures/common.fixture';
import { REMINDER_STATUS } from '../../src/shared/constants';

setupTestEnvironment();

let ReminderRepository: any;

beforeEach(async () => {
  jest.resetModules();
  ({ ReminderRepository } = await import('../../src/app/reminder/reminder.repository'));
});

describe('ReminderRepository.create', () => {
  it('creates and returns a new reminder', async () => {
    mockPrismaClient.reminder.create.mockResolvedValue(reminder24hEmailFixture);

    const repo = new ReminderRepository(mockPrismaClient);
    const result = await repo.create(createReminderPayload);

    expect(mockPrismaClient.reminder.create).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(REMINDER_STATUS.PENDING);
  });
});

describe('ReminderRepository.findById', () => {
  it('returns reminder when found', async () => {
    mockPrismaClient.reminder.findUnique.mockResolvedValue(reminder24hEmailFixture);

    const repo = new ReminderRepository(mockPrismaClient);
    expect(await repo.findById(FIXED_IDS.reminderId)).not.toBeNull();
  });

  it('returns null when not found', async () => {
    mockPrismaClient.reminder.findUnique.mockResolvedValue(null);

    const repo = new ReminderRepository(mockPrismaClient);
    expect(await repo.findById('missing')).toBeNull();
  });
});

describe('ReminderRepository.findByBookingId', () => {
  it('returns all reminders for a booking', async () => {
    mockPrismaClient.reminder.findMany.mockResolvedValue(bookingRemindersListFixture);

    const repo = new ReminderRepository(mockPrismaClient);
    const result = await repo.findByBookingId(FIXED_IDS.bookingId);

    expect(result).toHaveLength(bookingRemindersListFixture.length);
    expect(mockPrismaClient.reminder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ bookingId: FIXED_IDS.bookingId }),
      }),
    );
  });
});

describe('ReminderRepository.findPending', () => {
  it('returns pending reminders scheduled up to now', async () => {
    mockPrismaClient.reminder.findMany.mockResolvedValue(pendingRemindersListFixture);

    const repo = new ReminderRepository(mockPrismaClient);
    const result = await repo.findPending();

    expect(result).toHaveLength(pendingRemindersListFixture.length);
    expect(mockPrismaClient.reminder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: REMINDER_STATUS.PENDING }),
      }),
    );
  });
});

describe('ReminderRepository.markSent', () => {
  it('updates status to SENT and sets sentAt', async () => {
    const sent = { ...reminder24hEmailFixture, status: REMINDER_STATUS.SENT, sentAt: FIXED_DATE_NOW };
    mockPrismaClient.reminder.update.mockResolvedValue(sent);

    const repo = new ReminderRepository(mockPrismaClient);
    const result = await repo.markSent(FIXED_IDS.reminderId);

    expect(mockPrismaClient.reminder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FIXED_IDS.reminderId },
        data: expect.objectContaining({ status: REMINDER_STATUS.SENT }),
      }),
    );
    expect(result.status).toBe(REMINDER_STATUS.SENT);
  });
});

describe('ReminderRepository.markDelivered', () => {
  it('updates status to DELIVERED and sets deliveredAt', async () => {
    const delivered = { ...reminder24hEmailFixture, status: REMINDER_STATUS.DELIVERED, deliveredAt: FIXED_DATE_NOW };
    mockPrismaClient.reminder.update.mockResolvedValue(delivered);

    const repo = new ReminderRepository(mockPrismaClient);
    const result = await repo.markDelivered(FIXED_IDS.reminderId);

    expect(result.status).toBe(REMINDER_STATUS.DELIVERED);
  });
});

describe('ReminderRepository.markFailed', () => {
  it('updates status to FAILED, sets failedAt and increments retryCount', async () => {
    const failed = {
      ...reminder24hEmailFixture,
      status: REMINDER_STATUS.FAILED,
      failedAt: FIXED_DATE_NOW,
      retryCount: 1,
      failureReason: 'SMTP timeout',
    };
    mockPrismaClient.reminder.update.mockResolvedValue(failed);

    const repo = new ReminderRepository(mockPrismaClient);
    const result = await repo.markFailed(FIXED_IDS.reminderId, 'SMTP timeout');

    expect(result.status).toBe(REMINDER_STATUS.FAILED);
    expect(result.failureReason).toBe('SMTP timeout');
    expect(result.retryCount).toBe(1);
  });
});