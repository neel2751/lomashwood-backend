import { CustomerAddress } from '@prisma/client';
import { FIXED_DATE, FIXED_IDS, dateAgo } from './common.fixture';

export const addressFixtures = {
  default: {
    id: FIXED_IDS.address1,
    customerId: FIXED_IDS.customer1,
    label: 'Home',
    line1: '14 Acacia Avenue',
    line2: 'Flat 3',
    city: 'London',
    county: 'Greater London',
    postcode: 'SW1A 1AA',
    country: 'GB',
    isDefault: true,
    deletedAt: null,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  } satisfies CustomerAddress,

  secondary: {
    id: FIXED_IDS.address2,
    customerId: FIXED_IDS.customer1,
    label: 'Office',
    line1: '100 Business Park',
    line2: null,
    city: 'Manchester',
    county: 'Greater Manchester',
    postcode: 'M1 1AE',
    country: 'GB',
    isDefault: false,
    deletedAt: null,
    createdAt: dateAgo(10),
    updatedAt: dateAgo(10),
  } satisfies CustomerAddress,

  deleted: {
    id: 'adr-00000000-0000-0000-0000-000000000099',
    customerId: FIXED_IDS.customer1,
    label: 'Old Address',
    line1: '99 Old Road',
    line2: null,
    city: 'Bristol',
    county: null,
    postcode: 'BS1 1AB',
    country: 'GB',
    isDefault: false,
    deletedAt: dateAgo(30),
    createdAt: dateAgo(60),
    updatedAt: dateAgo(30),
  } satisfies CustomerAddress,
};

export const createAddressDto = {
  label: 'Home',
  line1: '42 New Street',
  line2: null,
  city: 'Edinburgh',
  county: 'Midlothian',
  postcode: 'EH1 1AA',
  country: 'GB',
  isDefault: false,
};

export const updateAddressDto = {
  label: 'Updated Home',
  line1: '42 New Street',
  city: 'Edinburgh',
  postcode: 'EH1 1BB',
};