import { LoyaltyTransactionType } from '@prisma/client';

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface LoyaltyAccountDto {
  id: string;
  customerId: string;
  pointsBalance: number;
  pointsEarned: number;
  pointsRedeemed: number;
  tier: LoyaltyTier;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyTransactionDto {
  id: string;
  accountId: string;
  type: LoyaltyTransactionType;
  points: number;
  description: string;
  reference: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface EarnPointsInput {
  customerId: string;
  points: number;
  description: string;
  reference?: string;
  expiresAt?: Date;
}

export interface RedeemPointsInput {
  customerId: string;
  points: number;
  description: string;
  reference?: string;
}

export interface AdjustPointsInput {
  customerId: string;
  points: number;
  description: string;
  reference?: string;
}

export interface LoyaltyTransactionQueryInput {
  page?: number;
  limit?: number;
  type?: LoyaltyTransactionType;
  from?: string;
  to?: string;
}

export interface PaginatedLoyaltyTransactions {
  data: LoyaltyTransactionDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}