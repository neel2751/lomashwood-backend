import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockReminderRepository, mockEmailClient, mockSmsClient, mockEventProducer } from '../../src/tests-helpers/mocks';
import {
  reminder24hEmailFixture,
  reminderSentFixture,
  reminderFailedFixture,
  pendingRemindersListFixture,
  bookingRemindersListFixture,
  createReminderPayload,
} from '../fixtures/reminders.fixture';
import { FIXED_IDS } from '../fixtures/common.fixture';
import { ReminderNotFoundError, ReminderAlreadySentError } from '../../src/shared/errors';
import { REMINDER_STATUS, REMINDER_CHANNEL } from '../../src/shared/constants';

setupTestEnvironment();

const mockDeps = {
  reminderRepository: mockReminderRepository,
  emailClient: mockEmailClient,
  smsClient: mockSmsClient,
  eventProducer: mockEventProducer,
};

let ReminderService: any;

beforeEach(async () => {
  jest.resetModules();
  ({ ReminderService } = await import('../../src/app/reminder/reminder.service'));
});

describe('ReminderService.scheduleReminder', () => {
  it('creates a pending reminder record', async () => {
    mockReminderRepository.create.mockResolvedValue(reminder24hEmailFixture);

    const service = new ReminderService(mockDeps);
    const result = await service.scheduleReminder(createReminderPayload);

    expect(result.status).toBe(REMINDER_STATUS.PENDING);
    expect(result.retryCount).toBe(0);
    expect(mockReminderRepository.create).toHaveBeenCalledTimes(1);
  });
});

describe('ReminderService.sendReminder', () => {
  it('dispatches email and marks reminder as sent', async () => {
    mockReminderRepository.findById.mockResolvedValue(reminder24hEmailFixture);
    mockEmailClient.sendReminder.mockResolvedValue(undefined);
    mockReminderRepository.markSent.mockResolvedValue({ ...reminder24hEmailFixture, status: REMINDER_STATUS.SENT });
    mockEventProducer.publish.mockResolvedValue(undefined);

    const service = new ReminderService(mockDeps);
    const result = await service.sendReminder(FIXED_IDS.reminderId);

    expect(mockEmailClient.sendReminder).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(REMINDER_STATUS.SENT);
    expect(mockEventProducer.publish).toHaveBeenCalled();
  });

  it('dispatches SMS for SMS channel reminders', async () => {
    const smsReminder = { ...reminder24hEmailFixture, channel: REMINDER_CHANNEL.SMS };
    mockReminderRepository.findById.mockResolvedValue(smsReminder);
    mockSmsClient.sendReminder.mockResolvedValue(undefined);
    mockReminderRepository.markSent.mockResolvedValue({ ...smsReminder, status: REMINDER_STATUS.SENT });
    mockEventProducer.publish.mockResolvedValue(undefined);

    const service = new ReminderService(mockDeps);
    await service.sendReminder(FIXED_IDS.reminderId);

    expect(mockSmsClient.sendReminder).toHaveBeenCalledTimes(1);
    expect(mockEmailClient.sendReminder).not.toHaveBeenCalled();
  });

  it('throws ReminderAlreadySentError when reminder is already sent', async () => {
    mockReminderRepository.findById.mockResolvedValue(reminderSentFixture);

    const service = new ReminderService(mockDeps);
    await expect(service.sendReminder(reminderSentFixture.id)).rejects.toThrow(ReminderAlreadySentError);
  });

  it('throws ReminderNotFoundError when reminder does not exist', async () => {
    mockReminderRepository.findById.mockResolvedValue(null);

    const service = new ReminderService(mockDeps);
    await expect(service.sendReminder('nonexistent')).rejects.toThrow(ReminderNotFoundError);
  });

  it('marks reminder as failed when dispatch throws', async () => {
    mockReminderRepository.findById.mockResolvedValue(reminder24hEmailFixture);
    mockEmailClient.sendReminder.mockRejectedValue(new Error('SMTP error'));
    mockReminderRepository.markFailed.mockResolvedValue(undefined);

    const service = new ReminderService(mockDeps);
    await expect(service.sendReminder(FIXED_IDS.reminderId)).rejects.toThrow();
    expect(mockReminderRepository.markFailed).toHaveBeenCalledWith(
      FIXED_IDS.reminderId,
      expect.any(String),
    );
  });
});

describe('ReminderService.getRemindersByBooking', () => {
  it('returns all reminders for a booking', async () => {
    mockReminderRepository.findByBookingId.mockResolvedValue(bookingRemindersListFixture);

    const service = new ReminderService(mockDeps);
    const result = await service.getRemindersByBooking(FIXED_IDS.bookingId);

    expect(result).toHaveLength(bookingRemindersListFixture.length);
  });
});