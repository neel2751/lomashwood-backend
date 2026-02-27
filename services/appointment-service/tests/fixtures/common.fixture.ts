import { v4 as uuidv4 } from 'uuid';

export const FIXED_DATE_NOW = new Date('2026-02-17T10:00:00.000Z');
export const FIXED_DATE_FUTURE = new Date('2026-02-24T10:00:00.000Z');
export const FIXED_DATE_PAST = new Date('2026-02-10T10:00:00.000Z');

export const FIXED_IDS = {
  customerId: '11111111-1111-4111-a111-111111111111',
  consultantId: '22222222-2222-4222-a222-222222222222',
  showroomId: '33333333-3333-4333-a333-333333333333',
  bookingId: '44444444-4444-4444-a444-444444444444',
  slotId: '55555555-5555-4555-a555-555555555555',
  availabilityId: '66666666-6666-4666-a666-666666666666',
  reminderId: '77777777-7777-4777-a777-777777777777',
  adminId: '88888888-8888-4888-a888-888888888888',
  secondConsultantId: '99999999-9999-4999-a999-999999999999',
  secondShowroomId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
  secondBookingId: 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb',
  secondSlotId: 'cccccccc-cccc-4ccc-accc-cccccccccccc',
  appointmentId: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
  rescheduleSlotId: 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee',
} as const;

export const CUSTOMER_DETAILS = {
  customerId: FIXED_IDS.customerId,
  customerName: 'James Clarke',
  customerEmail: 'james.clarke@example.com',
  customerPhone: '07798765432',
  customerPostcode: 'SW4 7UR',
  customerAddress: '45 Elm Road, London, SW4 7UR',
} as const;

export function generateId(): string {
  return uuidv4();
}

export function futureDate(daysFromNow: number): Date {
  const d = new Date(FIXED_DATE_NOW);
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

export function pastDate(daysAgo: number): Date {
  const d = new Date(FIXED_DATE_NOW);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

export function futureDateWithTime(daysFromNow: number, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const d = futureDate(daysFromNow);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export const BASE_PAGINATION_META = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
} as const;