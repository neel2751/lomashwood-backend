import { randomUUID } from 'crypto';

export const FIXED_DATE = new Date('2025-01-15T10:00:00.000Z');
export const FIXED_DATE_PAST = new Date('2024-06-01T08:00:00.000Z');
export const FIXED_DATE_FUTURE = new Date('2026-01-15T10:00:00.000Z');

export const FIXED_IDS = {
  customer1: 'cus-00000000-0000-0000-0000-000000000001',
  customer2: 'cus-00000000-0000-0000-0000-000000000002',
  customer3: 'cus-00000000-0000-0000-0000-000000000003',
  deletedCustomer: 'cus-00000000-0000-0000-0000-000000000099',
  userId1: 'usr-00000000-0000-0000-0000-000000000001',
  userId2: 'usr-00000000-0000-0000-0000-000000000002',
  adminUserId: 'usr-00000000-0000-0000-0000-000000000010',
  agentUserId: 'usr-00000000-0000-0000-0000-000000000011',
  address1: 'adr-00000000-0000-0000-0000-000000000001',
  address2: 'adr-00000000-0000-0000-0000-000000000002',
  wishlist1: 'wsl-00000000-0000-0000-0000-000000000001',
  wishlistItem1: 'wsi-00000000-0000-0000-0000-000000000001',
  review1: 'rev-00000000-0000-0000-0000-000000000001',
  review2: 'rev-00000000-0000-0000-0000-000000000002',
  ticket1: 'tkt-00000000-0000-0000-0000-000000000001',
  ticket2: 'tkt-00000000-0000-0000-0000-000000000002',
  message1: 'msg-00000000-0000-0000-0000-000000000001',
  loyaltyAccount1: 'lac-00000000-0000-0000-0000-000000000001',
  loyaltyTransaction1: 'ltr-00000000-0000-0000-0000-000000000001',
  referral1: 'ref-00000000-0000-0000-0000-000000000001',
  product1: 'prd-00000000-0000-0000-0000-000000000001',
  product2: 'prd-00000000-0000-0000-0000-000000000002',
  order1: 'ord-00000000-0000-0000-0000-000000000001',
} as const;

export function id(): string {
  return randomUUID();
}

export function dateAgo(days: number): Date {
  const d = new Date(FIXED_DATE);
  d.setDate(d.getDate() - days);
  return d;
}

export function dateFromNow(days: number): Date {
  const d = new Date(FIXED_DATE);
  d.setDate(d.getDate() + days);
  return d;
}

export function paginatedResponse<T>(
  data: T[],
  overrides: Partial<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> = {},
) {
  const total = overrides.total ?? data.length;
  const page = overrides.page ?? 1;
  const limit = overrides.limit ?? 20;
  const totalPages = overrides.totalPages ?? Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: overrides.hasNextPage ?? page < totalPages,
      hasPreviousPage: overrides.hasPreviousPage ?? page > 1,
    },
  };
}