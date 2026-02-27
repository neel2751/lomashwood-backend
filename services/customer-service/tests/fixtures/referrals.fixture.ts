import { Referral } from '@prisma/client';
import { FIXED_DATE, FIXED_IDS, dateAgo } from './common.fixture';

export const referralFixtures = {
  pending: {
    id: FIXED_IDS.referral1,
    referrerId: FIXED_IDS.customer1,
    referredId: null,
    referralCode: 'ALICE2025',
    status: 'PENDING',
    rewardIssuedAt: null,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  } satisfies Referral,

  completed: {
    id: 'ref-00000000-0000-0000-0000-000000000002',
    referrerId: FIXED_IDS.customer1,
    referredId: FIXED_IDS.customer2,
    referralCode: 'ALICE100',
    status: 'COMPLETED',
    rewardIssuedAt: dateAgo(5),
    createdAt: dateAgo(10),
    updatedAt: dateAgo(5),
  } satisfies Referral,

  expired: {
    id: 'ref-00000000-0000-0000-0000-000000000003',
    referrerId: FIXED_IDS.customer2,
    referredId: null,
    referralCode: 'BOBEXP1',
    status: 'EXPIRED',
    rewardIssuedAt: null,
    createdAt: dateAgo(120),
    updatedAt: dateAgo(90),
  } satisfies Referral,
};

export const createReferralDto = {
  referralCode: 'NEWREF01',
};

export const referralResponseDto = {
  id: FIXED_IDS.referral1,
  referrerId: FIXED_IDS.customer1,
  referralCode: 'ALICE2025',
  status: 'PENDING',
  rewardIssuedAt: null,
  createdAt: FIXED_DATE.toISOString(),
};