import { FIXED_IDS } from './common.fixture';

export interface RatingStats {
  productId: string;
  averageRating: number;
  totalReviews: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export const ratingStatsFixtures: Record<string, RatingStats> = {
  highRated: {
    productId: FIXED_IDS.product1,
    averageRating: 4.7,
    totalReviews: 48,
    distribution: { 1: 1, 2: 0, 3: 2, 4: 8, 5: 37 },
  },

  mixed: {
    productId: FIXED_IDS.product2,
    averageRating: 3.2,
    totalReviews: 15,
    distribution: { 1: 2, 2: 3, 3: 5, 4: 3, 5: 2 },
  },

  noReviews: {
    productId: 'prd-00000000-0000-0000-0000-000000000003',
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  },
};

export const ratingBreakdownFixture = [
  { rating: 5, count: 37, percentage: 77.08 },
  { rating: 4, count: 8, percentage: 16.67 },
  { rating: 3, count: 2, percentage: 4.17 },
  { rating: 2, count: 0, percentage: 0 },
  { rating: 1, count: 1, percentage: 2.08 },
];