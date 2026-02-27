import { Review, ReviewStatus } from '@prisma/client';
import { FIXED_DATE, FIXED_IDS, dateAgo } from './common.fixture';

export const reviewFixtures = {
  pending: {
    id: FIXED_IDS.review1,
    customerId: FIXED_IDS.customer1,
    productId: FIXED_IDS.product1,
    orderId: FIXED_IDS.order1,
    rating: 5,
    title: 'Absolutely stunning kitchen',
    body: 'The quality of the cabinets exceeded all expectations. The installation team were professional and the finish is flawless.',
    images: ['https://cdn.example.com/reviews/img1.jpg'],
    status: ReviewStatus.PENDING,
    deletedAt: null,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  } satisfies Review,

  approved: {
    id: FIXED_IDS.review2,
    customerId: FIXED_IDS.customer1,
    productId: FIXED_IDS.product2,
    orderId: null,
    rating: 4,
    title: 'Great wardrobe, minor delivery delay',
    body: 'Really happy with the product itself. Delivery took longer than expected but the end result is worth it.',
    images: [],
    status: ReviewStatus.APPROVED,
    deletedAt: null,
    createdAt: dateAgo(20),
    updatedAt: dateAgo(18),
  } satisfies Review,

  rejected: {
    id: 'rev-00000000-0000-0000-0000-000000000003',
    customerId: FIXED_IDS.customer2,
    productId: FIXED_IDS.product1,
    orderId: null,
    rating: 1,
    title: 'Spam review',
    body: 'Visit this website to get cheap furniture...',
    images: [],
    status: ReviewStatus.REJECTED,
    deletedAt: null,
    createdAt: dateAgo(10),
    updatedAt: dateAgo(9),
  } satisfies Review,
};

export const createReviewDto = {
  productId: FIXED_IDS.product1,
  orderId: FIXED_IDS.order1,
  rating: 5,
  title: 'Excellent product',
  body: 'Very happy with this purchase. Would recommend to anyone looking for quality kitchen furniture.',
  images: [],
};

export const updateReviewDto = {
  rating: 4,
  title: 'Updated: Good product',
  body: 'Updated review after a few months of use. Still very happy overall.',
};