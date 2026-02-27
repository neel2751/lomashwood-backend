import { LoyaltyAccount, LoyaltyTransaction, LoyaltyTransactionType } from '@prisma/client';
import { FIXED_DATE, FIXED_IDS, dateAgo, dateFromNow } from './common.fixture';

export const loyaltyAccountFixtures = {
  bronze: {
    id: FIXED_IDS.loyaltyAccount1,
    customerId: FIXED_IDS.customer1,
    pointsBalance: 250,
    pointsEarned: 250,
    pointsRedeemed: 0,
    tier: 'BRONZE',
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  } satisfies LoyaltyAccount,

  silver: {
    id: 'lac-00000000-0000-0000-0000-000000000002',
    customerId: FIXED_IDS.customer2,
    pointsBalance: 620,
    pointsEarned: 720,
    pointsRedeemed: 100,
    tier: 'SILVER',
    createdAt: dateAgo(180),
    updatedAt: dateAgo(5),
  } satisfies LoyaltyAccount,

  gold: {
    id: 'lac-00000000-0000-0000-0000-000000000003',
    customerId: FIXED_IDS.customer3,
    pointsBalance: 2100,
    pointsEarned: 2300,
    pointsRedeemed: 200,
    tier: 'GOLD',
    createdAt: dateAgo(365),
    updatedAt: dateAgo(2),
  } satisfies LoyaltyAccount,

  empty: {
    id: 'lac-00000000-0000-0000-0000-000000000004',
    customerId: 'cus-00000000-0000-0000-0000-000000000004',
    pointsBalance: 0,
    pointsEarned: 0,
    pointsRedeemed: 0,
    tier: 'BRONZE',
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  } satisfies LoyaltyAccount,
};

export const loyaltyTransactionFixtures = {
  orderEarn: {
    id: FIXED_IDS.loyaltyTransaction1,
    accountId: FIXED_IDS.loyaltyAccount1,
    type: LoyaltyTransactionType.EARN,
    points: 125,
    description: 'Points earned for order ORD-12345',
    reference: FIXED_IDS.order1,
    expiresAt: dateFromNow(365),
    createdAt: FIXED_DATE,
  } satisfies LoyaltyTransaction,

  reviewEarn: {
    id: 'ltr-00000000-0000-0000-0000-000000000002',
    accountId: FIXED_IDS.loyaltyAccount1,
    type: LoyaltyTransactionType.EARN,
    points: 25,
    description: 'Points awarded for submitting a review',
    reference: FIXED_IDS.review1,
    expiresAt: dateFromNow(365),
    createdAt: dateAgo(10),
  } satisfies LoyaltyTransaction,

  redeem: {
    id: 'ltr-00000000-0000-0000-0000-000000000003',
    accountId: FIXED_IDS.loyaltyAccount1,
    type: LoyaltyTransactionType.REDEEM,
    points: -100,
    description: 'Points redeemed against order ORD-99999',
    reference: 'ord-99999',
    expiresAt: null,
    createdAt: dateAgo(5),
  } satisfies LoyaltyTransaction,

  expired: {
    id: 'ltr-00000000-0000-0000-0000-000000000004',
    accountId: FIXED_IDS.loyaltyAccount1,
    type: LoyaltyTransactionType.EXPIRE,
    points: -50,
    description: '50 points expired',
    reference: null,
    expiresAt: null,
    createdAt: dateAgo(1),
  } satisfies LoyaltyTransaction,

  adjust: {
    id: 'ltr-00000000-0000-0000-0000-000000000005',
    accountId: FIXED_IDS.loyaltyAccount1,
    type: LoyaltyTransactionType.ADJUST,
    points: 200,
    description: 'Manual points adjustment by admin',
    reference: 'ADMIN-ADJUST-001',
    expiresAt: null,
    createdAt: dateAgo(20),
  } satisfies LoyaltyTransaction,
};

export const earnPointsDto = {
  customerId: FIXED_IDS.customer1,
  points: 100,
  description: 'Points earned for order ORD-99999',
  reference: 'ORD-99999',
};

export const redeemPointsDto = {
  points: 100,
  description: 'Points redeemed at checkout',
  reference: 'ORD-00002',
};

export const adjustPointsDto = {
  customerId: FIXED_IDS.customer1,
  points: 50,
  description: 'Goodwill points gesture',
  reference: 'SUPPORT-TKT-001',
};