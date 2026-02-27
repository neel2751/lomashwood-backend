import { v4 as uuidv4 } from 'uuid';

export const FIXED_DATE = new Date('2025-01-15T10:00:00.000Z');
export const FIXED_DATE_STRING = '2025-01-15T10:00:00.000Z';
export const FIXED_FUTURE_DATE = new Date('2025-01-16T10:00:00.000Z');
export const FIXED_PAST_DATE = new Date('2025-01-14T10:00:00.000Z');

export const FIXED_UUIDS = {
  USER_1:          'clxuser1000000000000000001',
  USER_2:          'clxuser2000000000000000002',
  ADMIN_1:         'clxadmin1000000000000000001',
  NOTIFICATION_1:  'clxnotif1000000000000000001',
  NOTIFICATION_2:  'clxnotif2000000000000000002',
  NOTIFICATION_3:  'clxnotif3000000000000000003',
  TEMPLATE_1:      'clxtmpl10000000000000000001',
  TEMPLATE_2:      'clxtmpl20000000000000000002',
  TEMPLATE_3:      'clxtmpl30000000000000000003',
  PROVIDER_1:      'clxprov10000000000000000001',
  PROVIDER_2:      'clxprov20000000000000000002',
  CAMPAIGN_1:      'clxcamp10000000000000000001',
  SUBSCRIPTION_1:  'clxsubs10000000000000000001',
  SUBSCRIPTION_2:  'clxsubs20000000000000000002',
  PREFERENCE_1:    'clxpref10000000000000000001',
  DELIVERY_1:      'clxdeliv1000000000000000001',
  WEBHOOK_1:       'clxwebhk1000000000000000001',
} as const;

export const FIXED_EMAILS = {
  CUSTOMER_1:  'john.doe@example.com',
  CUSTOMER_2:  'jane.smith@example.com',
  ADMIN:       'admin@lomashwood.co.uk',
  INTERNAL:    'appointments@lomashwood.co.uk',
  NO_REPLY:    'noreply@lomashwood.co.uk',
} as const;

export const FIXED_PHONES = {
  UK_1: '+441234567890',
  UK_2: '+440987654321',
  UK_3: '+447911123456',
} as const;

export const FIXED_PUSH_TOKENS = {
  FCM_1:    'fcm_token_device_001_abcdefghijklmnop',
  FCM_2:    'fcm_token_device_002_qrstuvwxyz012345',
  VAPID_1:  'vapid_token_web_001_abcdefghijklmnop',
} as const;

export function makeId(): string {
  return uuidv4();
}

export function makeIdempotencyKey(prefix: string): string {
  return `${prefix}_${uuidv4()}`;
}

export function makeBatchId(): string {
  return `batch_${uuidv4()}`;
}