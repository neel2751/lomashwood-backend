import { randomUUID } from 'crypto';
import { Address } from '../../src/shared/types';

export const FIXED_DATE = new Date('2025-06-15T10:00:00.000Z');
export const FIXED_DATE_ISO = FIXED_DATE.toISOString();

export const FIXED_UUID_1 = '11111111-1111-1111-1111-111111111111';
export const FIXED_UUID_2 = '22222222-2222-2222-2222-222222222222';
export const FIXED_UUID_3 = '33333333-3333-3333-3333-333333333333';
export const FIXED_UUID_4 = '44444444-4444-4444-4444-444444444444';
export const FIXED_UUID_5 = '55555555-5555-5555-5555-555555555555';

export const CUSTOMER_ID_1 = 'cust-0001-0001-0001-000100010001';
export const CUSTOMER_ID_2 = 'cust-0002-0002-0002-000200020002';
export const CUSTOMER_ID_3 = 'cust-0003-0003-0003-000300030003';

export const PRODUCT_ID_KITCHEN_1 = 'prod-kitch-0001-0001-000100010001';
export const PRODUCT_ID_KITCHEN_2 = 'prod-kitch-0002-0002-000200020002';
export const PRODUCT_ID_BEDROOM_1 = 'prod-bedrm-0001-0001-000100010001';
export const PRODUCT_ID_BEDROOM_2 = 'prod-bedrm-0002-0002-000200020002';

export const COLOUR_ID_WHITE = 'col-white-0001-0001-000100010001';
export const COLOUR_ID_GREY = 'col-grey--0001-0001-000100010001';
export const COLOUR_ID_OAK = 'col-oak---0001-0001-000100010001';

export const SIZE_ID_1000MM = 'size-1000-0001-0001-000100010001';
export const SIZE_ID_1200MM = 'size-1200-0001-0001-000100010001';
export const SIZE_ID_2000MM = 'size-2000-0001-0001-000100010001';

export const ADMIN_USER_ID = 'admin-usr-0001-0001-000100010001';

export const CURRENCY_GBP = 'GBP';

export const UK_ADDRESS_LONDON: Address = {
  line1: '10 Downing Street',
  line2: null,
  city: 'London',
  county: 'Greater London',
  postcode: 'SW1A 2AA',
  country: 'GB',
};

export const UK_ADDRESS_MANCHESTER: Address = {
  line1: '1 Piccadilly Gardens',
  line2: 'Suite 4',
  city: 'Manchester',
  county: 'Greater Manchester',
  postcode: 'M1 1RG',
  country: 'GB',
};

export const UK_ADDRESS_BIRMINGHAM: Address = {
  line1: '50 Broad Street',
  line2: null,
  city: 'Birmingham',
  county: 'West Midlands',
  postcode: 'B1 2EA',
  country: 'GB',
};

export const CUSTOMER_SNAPSHOT_1 = {
  id: CUSTOMER_ID_1,
  email: 'james.smith@example.com',
  firstName: 'James',
  lastName: 'Smith',
  phone: '+447700900001',
};

export const CUSTOMER_SNAPSHOT_2 = {
  id: CUSTOMER_ID_2,
  email: 'emma.jones@example.com',
  firstName: 'Emma',
  lastName: 'Jones',
  phone: '+447700900002',
};

export const CUSTOMER_SNAPSHOT_3 = {
  id: CUSTOMER_ID_3,
  email: 'oliver.williams@example.com',
  firstName: 'Oliver',
  lastName: 'Williams',
  phone: null,
};

export function makeId(): string {
  return randomUUID();
}

export function makeDate(offsetDays = 0): Date {
  const d = new Date(FIXED_DATE);
  d.setDate(d.getDate() + offsetDays);
  return d;
}

export function makePastDate(offsetMinutes: number): Date {
  return new Date(FIXED_DATE.getTime() - offsetMinutes * 60 * 1000);
}

export function makeFutureDate(offsetMinutes: number): Date {
  return new Date(FIXED_DATE.getTime() + offsetMinutes * 60 * 1000);
}