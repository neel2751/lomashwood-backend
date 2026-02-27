export const SMS_QUEUE_NAME = 'lomash:sms' as const;

export const SMS_JOB_NAMES = {
  SEND:       'sms:send',
  SEND_BULK:  'sms:send-bulk',
  RETRY:      'sms:retry',
} as const;

export const SMS_PROVIDER_NAMES = {
  TWILIO: 'twilio-sms',
  MSG91:  'msg91-sms',
} as const;

export const SMS_LIMITS = {
  BODY_MAX_LENGTH:       1600,
  SINGLE_SEGMENT_LENGTH: 160,
  UNICODE_SEGMENT_LENGTH: 70,
  BULK_MAX_PER_BATCH:    500,
  TO_NUMBER_MAX_LENGTH:   20,
} as const;

export const SMS_RETRY = {
  MAX_ATTEMPTS:     3,
  INITIAL_DELAY_MS: 3_000,
  MAX_DELAY_MS:     120_000,
  MULTIPLIER:       2,
} as const;

export const SMS_DEFAULTS = {
  FROM: '+441234567890',
} as const;

export const SMS_STATUS_MESSAGES = {
  QUEUED:    'SMS job queued successfully.',
  SENT:      'SMS dispatched successfully.',
  FAILED:    'SMS dispatch failed.',
  CANCELLED: 'SMS job cancelled.',
} as const;