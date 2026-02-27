import { generateId, mockAuditFields, mockCreatedByFields } from './common.fixture';
import { mockMediaIds } from './media.fixture';

export type MockTestimonialStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FEATURED';
export type MockTestimonialSource = 'WEBSITE' | 'GOOGLE' | 'TRUSTPILOT' | 'FACEBOOK' | 'INTERNAL';
export type MockTestimonialCategory = 'KITCHEN' | 'BEDROOM' | 'BOTH' | 'SERVICE' | 'GENERAL';

export interface MockTestimonialProject {
  type: MockTestimonialCategory;
  range: string | null;
  location: string | null;
}

export interface MockTestimonial {
  id: string;
  customerName: string;
  customerTitle: string | null;
  location: string | null;
  rating: number;
  title: string | null;
  body: string;
  status: MockTestimonialStatus;
  source: MockTestimonialSource;
  sourceUrl: string | null;
  sourceId: string | null;
  imageIds: string[];
  videoId: string | null;
  project: MockTestimonialProject | null;
  isFeatured: boolean;
  isVerifiedPurchase: boolean;
  sortOrder: number;
  helpfulCount: number;
  publishedAt: Date | null;
  createdById: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const mockTestimonialIds = {
  sarahLondon: generateId(),
  jamesBirmingham: generateId(),
  emilyManchester: generateId(),
  davidLeeds: generateId(),
  priyaBristol: generateId(),
  markCardiff: generateId(),
  pendingTestimonial: generateId(),
  rejectedTestimonial: generateId(),
};

export const mockTestimonialSarahLondon: MockTestimonial = {
  id: mockTestimonialIds.sarahLondon,
  customerName: 'Sarah Thompson',
  customerTitle: 'Homeowner',
  location: 'Clapham, London',
  rating: 5,
  title: 'Absolutely transformed our kitchen — worth every penny!',
  body: 'We had our old kitchen completely replaced with a Lomash Wood Luna design in white gloss. From the initial consultation right through to the final installation, the whole team was professional, knowledgeable, and a pleasure to work with. The kitchen itself is absolutely stunning — so much better than we imagined. Our neighbours keep asking who did it! The installation team were tidy, punctual, and worked to a high standard. We couldn\'t be happier and would recommend Lomash Wood to anyone.',
  status: 'FEATURED',
  source: 'WEBSITE',
  sourceUrl: null,
  sourceId: null,
  imageIds: [mockMediaIds.kitchenImage1, mockMediaIds.kitchenImage2],
  videoId: null,
  project: {
    type: 'KITCHEN',
    range: 'Luna',
    location: 'Clapham, London',
  },
  isFeatured: true,
  isVerifiedPurchase: true,
  sortOrder: 1,
  helpfulCount: 47,
  publishedAt: new Date('2025-01-12T10:00:00.000Z'),
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockTestimonialJamesBirmingham: MockTestimonial = {
  id: mockTestimonialIds.jamesBirmingham,
  customerName: 'James & Claire Patterson',
  customerTitle: null,
  location: 'Edgbaston, Birmingham',
  rating: 5,
  title: 'Our dream kitchen finally realised',
  body: 'After years of putting up with a dated kitchen, we finally took the plunge and went with Lomash Wood. Best decision we\'ve ever made. The designer we worked with was brilliant — she really listened to what we wanted and came up with a design that exceeded our expectations. The handleless grey units with quartz worktops look incredible. The installation was completed on time and on budget, which was a relief as we\'d had bad experiences with other tradespeople in the past.',
  status: 'APPROVED',
  source: 'GOOGLE',
  sourceUrl: 'https://maps.google.com/reviews/abc123',
  sourceId: 'google_review_abc123',
  imageIds: [mockMediaIds.kitchenImage2],
  videoId: null,
  project: {
    type: 'KITCHEN',
    range: 'Horizon',
    location: 'Birmingham',
  },
  isFeatured: true,
  isVerifiedPurchase: true,
  sortOrder: 2,
  helpfulCount: 32,
  publishedAt: new Date('2025-01-08T10:00:00.000Z'),
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockTestimonialEmilyManchester: MockTestimonial = {
  id: mockTestimonialIds.emilyManchester,
  customerName: 'Emily Rodriguez',
  customerTitle: 'Interior Design Enthusiast',
  location: 'Didsbury, Manchester',
  rating: 5,
  title: 'The fitted bedroom I\'ve always dreamed of',
  body: 'I had such a clear vision for my bedroom and I was worried that no company would be able to execute it properly. Lomash Wood proved me completely wrong. The fitted wardrobes in stone grey with soft-close drawers are absolutely perfect. The attention to detail is incredible — even the internal fittings and drawer organisation inserts are beautifully made. I\'ve recommended Lomash Wood to at least five people since my installation was completed.',
  status: 'FEATURED',
  source: 'TRUSTPILOT',
  sourceUrl: 'https://www.trustpilot.com/reviews/def456',
  sourceId: 'trustpilot_def456',
  imageIds: [mockMediaIds.bedroomImage1],
  videoId: null,
  project: {
    type: 'BEDROOM',
    range: 'Serene',
    location: 'Manchester',
  },
  isFeatured: true,
  isVerifiedPurchase: true,
  sortOrder: 3,
  helpfulCount: 28,
  publishedAt: new Date('2025-01-05T10:00:00.000Z'),
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockTestimonialDavidLeeds: MockTestimonial = {
  id: mockTestimonialIds.davidLeeds,
  customerName: 'David & Alison Hawkins',
  customerTitle: null,
  location: 'Headingley, Leeds',
  rating: 5,
  title: 'Complete kitchen and bedroom transformation — 10/10',
  body: 'We had both our kitchen and main bedroom done by Lomash Wood and I honestly cannot praise them enough. Having one company handle both projects meant everything was coordinated beautifully. The project manager kept us informed every step of the way and any minor issues that arose were dealt with immediately and professionally. Two years on, everything still looks and works perfectly. Exceptional quality.',
  status: 'APPROVED',
  source: 'WEBSITE',
  sourceUrl: null,
  sourceId: null,
  imageIds: [mockMediaIds.kitchenImage1, mockMediaIds.bedroomImage2],
  videoId: null,
  project: {
    type: 'BOTH',
    range: null,
    location: 'Leeds',
  },
  isFeatured: false,
  isVerifiedPurchase: true,
  sortOrder: 4,
  helpfulCount: 19,
  publishedAt: new Date('2024-12-20T10:00:00.000Z'),
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockTestimonialPriyaBristol: MockTestimonial = {
  id: mockTestimonialIds.priyaBristol,
  customerName: 'Priya Patel',
  customerTitle: 'Architect',
  location: 'Clifton, Bristol',
  rating: 4,
  title: 'High quality product, minor snag resolved quickly',
  body: 'As an architect, I have high standards and was impressed overall by the quality of the Lomash Wood product. The kitchen looks beautiful and the construction quality is excellent. There was a minor issue with one drawer after installation but it was resolved within 48 hours when I called the aftercare team. Would recommend, and I plan to use them again for a client project.',
  status: 'APPROVED',
  source: 'GOOGLE',
  sourceUrl: 'https://maps.google.com/reviews/ghi789',
  sourceId: 'google_review_ghi789',
  imageIds: [],
  videoId: null,
  project: {
    type: 'KITCHEN',
    range: 'Aurora',
    location: 'Bristol',
  },
  isFeatured: false,
  isVerifiedPurchase: true,
  sortOrder: 5,
  helpfulCount: 14,
  publishedAt: new Date('2024-12-15T10:00:00.000Z'),
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockTestimonialMarkCardiff: MockTestimonial = {
  id: mockTestimonialIds.markCardiff,
  customerName: 'Mark Williams',
  customerTitle: null,
  location: 'Roath, Cardiff',
  rating: 5,
  title: 'Incredible transformation — couldn\'t be happier',
  body: 'The whole experience from consultation to installation was seamless. The designer helped me choose a kitchen that perfectly suits my open-plan living space. The installation team were professional, efficient, and left everything spotless. The kitchen has completely transformed our home. Outstanding value for money.',
  status: 'APPROVED',
  source: 'WEBSITE',
  sourceUrl: null,
  sourceId: null,
  imageIds: [],
  videoId: null,
  project: {
    type: 'KITCHEN',
    range: 'Loft',
    location: 'Cardiff',
  },
  isFeatured: false,
  isVerifiedPurchase: true,
  sortOrder: 6,
  helpfulCount: 11,
  publishedAt: new Date('2024-12-10T10:00:00.000Z'),
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockTestimonialPending: MockTestimonial = {
  id: mockTestimonialIds.pendingTestimonial,
  customerName: 'John Smith',
  customerTitle: null,
  location: 'London',
  rating: 5,
  title: 'Great experience overall',
  body: 'Really happy with my new kitchen. The team were professional and the quality is excellent.',
  status: 'PENDING',
  source: 'WEBSITE',
  sourceUrl: null,
  sourceId: null,
  imageIds: [],
  videoId: null,
  project: null,
  isFeatured: false,
  isVerifiedPurchase: false,
  sortOrder: 99,
  helpfulCount: 0,
  publishedAt: null,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockTestimonialRejected: MockTestimonial = {
  id: mockTestimonialIds.rejectedTestimonial,
  customerName: 'Fake Reviewer',
  customerTitle: null,
  location: null,
  rating: 1,
  title: 'Not a real review',
  body: 'This review has been rejected as it does not appear to be from a genuine customer.',
  status: 'REJECTED',
  source: 'WEBSITE',
  sourceUrl: null,
  sourceId: null,
  imageIds: [],
  videoId: null,
  project: null,
  isFeatured: false,
  isVerifiedPurchase: false,
  sortOrder: 99,
  helpfulCount: 0,
  publishedAt: null,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const allMockTestimonials: MockTestimonial[] = [
  mockTestimonialSarahLondon,
  mockTestimonialJamesBirmingham,
  mockTestimonialEmilyManchester,
  mockTestimonialDavidLeeds,
  mockTestimonialPriyaBristol,
  mockTestimonialMarkCardiff,
  mockTestimonialPending,
  mockTestimonialRejected,
];

export const approvedMockTestimonials: MockTestimonial[] = allMockTestimonials.filter(
  (t) => t.status === 'APPROVED' || t.status === 'FEATURED',
);

export const featuredMockTestimonials: MockTestimonial[] = allMockTestimonials.filter(
  (t) => t.status === 'FEATURED',
);

export const averageRating = (): number => {
  const approved = approvedMockTestimonials;
  const total = approved.reduce((sum, t) => sum + t.rating, 0);
  return Math.round((total / approved.length) * 10) / 10;
};

export const mockCreateTestimonialDto = {
  customerName: 'Test Customer',
  customerTitle: null,
  location: 'Test City',
  rating: 5,
  title: 'Test testimonial title',
  body: 'This is a test testimonial body with enough content to be meaningful.',
  source: 'WEBSITE' as MockTestimonialSource,
  project: {
    type: 'KITCHEN' as MockTestimonialCategory,
    range: 'Luna',
    location: 'Test City',
  },
};

export const mockApproveTestimonialDto = {
  status: 'APPROVED' as MockTestimonialStatus,
  sortOrder: 10,
};

export const mockFeatureTestimonialDto = {
  status: 'FEATURED' as MockTestimonialStatus,
  isFeatured: true,
  sortOrder: 1,
};

export const mockUpdateTestimonialDto = {
  title: 'Updated testimonial title',
  body: 'Updated testimonial body content.',
  sortOrder: 5,
};

export const buildMockTestimonial = (overrides: Partial<MockTestimonial> = {}): MockTestimonial => ({
  id: generateId(),
  customerName: 'Test Customer',
  customerTitle: null,
  location: null,
  rating: 5,
  title: null,
  body: 'Test testimonial body.',
  status: 'PENDING',
  source: 'WEBSITE',
  sourceUrl: null,
  sourceId: null,
  imageIds: [],
  videoId: null,
  project: null,
  isFeatured: false,
  isVerifiedPurchase: false,
  sortOrder: 99,
  helpfulCount: 0,
  publishedAt: null,
  ...mockAuditFields,
  ...mockCreatedByFields,
  ...overrides,
});