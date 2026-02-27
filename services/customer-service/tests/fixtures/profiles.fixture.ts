import { CustomerProfile } from '@prisma/client';
import { FIXED_DATE, FIXED_IDS, dateAgo } from './common.fixture';

export const profileFixtures = {
  complete: {
    id: 'prf-00000000-0000-0000-0000-000000000001',
    customerId: FIXED_IDS.customer1,
    dateOfBirth: new Date('1990-05-20'),
    gender: 'female',
    bio: 'Interior design enthusiast. Love transforming spaces.',
    preferredLanguage: 'en',
    preferredCurrency: 'GBP',
    marketingOptIn: true,
    smsOptIn: false,
    pushOptIn: true,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  } satisfies CustomerProfile,

  minimal: {
    id: 'prf-00000000-0000-0000-0000-000000000002',
    customerId: FIXED_IDS.customer2,
    dateOfBirth: null,
    gender: null,
    bio: null,
    preferredLanguage: 'en',
    preferredCurrency: 'GBP',
    marketingOptIn: false,
    smsOptIn: false,
    pushOptIn: false,
    createdAt: dateAgo(30),
    updatedAt: dateAgo(30),
  } satisfies CustomerProfile,
};

export const updateProfileDto = {
  dateOfBirth: '1990-05-20',
  gender: 'female',
  bio: 'Updated bio text.',
  preferredLanguage: 'en',
  preferredCurrency: 'GBP',
  marketingOptIn: true,
  smsOptIn: false,
  pushOptIn: true,
};