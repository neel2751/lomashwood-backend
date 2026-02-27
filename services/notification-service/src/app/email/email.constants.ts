export const EMAIL_QUEUE_NAME = 'lomash:email' as const;

export const EMAIL_JOB_NAMES = {
  SEND:            'email:send',
  SEND_BULK:       'email:send-bulk',
  SEND_TEMPLATED:  'email:send-templated',
  RETRY:           'email:retry',
} as const;

export const EMAIL_PROVIDER_NAMES = {
  NODEMAILER: 'nodemailer-smtp',
  SES:        'aws-ses',
} as const;

export const EMAIL_LIMITS = {
  SUBJECT_MAX_LENGTH:    998,
  FROM_NAME_MAX_LENGTH:  100,
  RECIPIENT_MAX_PER_JOB: 1,
  ATTACHMENT_MAX_SIZE_MB: 10,
  ATTACHMENT_MAX_COUNT:   5,
  BULK_MAX_PER_BATCH:    500,
} as const;

export const EMAIL_RETRY = {
  MAX_ATTEMPTS:     4,
  INITIAL_DELAY_MS: 5_000,
  MAX_DELAY_MS:     300_000,
  MULTIPLIER:       2,
} as const;

export const EMAIL_DEFAULTS = {
  FROM_NAME:    'Lomash Wood',
  FROM_ADDRESS: 'noreply@lomashwood.co.uk',
  REPLY_TO:     'hello@lomashwood.co.uk',
  ENGINE:       'handlebars',
} as const;

export const EMAIL_STATUS_MESSAGES = {
  QUEUED:    'Email job queued successfully.',
  SENT:      'Email dispatched successfully.',
  FAILED:    'Email dispatch failed.',
  CANCELLED: 'Email job cancelled.',
} as const;