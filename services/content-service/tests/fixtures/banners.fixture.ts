import { generateId, mockAuditFields, mockCreatedByFields } from './common.fixture';
import { mockMediaIds } from './media.fixture';

export type MockBannerType = 'HERO_SLIDER' | 'PROMOTIONAL' | 'ANNOUNCEMENT' | 'CTA' | 'SALE';
export type MockBannerStatus = 'ACTIVE' | 'INACTIVE' | 'SCHEDULED' | 'EXPIRED';
export type MockBannerPlacement =
  | 'HOME_HERO'
  | 'HOME_PROMO'
  | 'KITCHEN_PAGE'
  | 'BEDROOM_PAGE'
  | 'SALE_PAGE'
  | 'GLOBAL_ANNOUNCEMENT';

export interface MockBannerCta {
  text: string;
  url: string;
  style: 'PRIMARY' | 'SECONDARY' | 'OUTLINE';
}

export interface MockBanner {
  id: string;
  title: string;
  type: MockBannerType;
  status: MockBannerStatus;
  placement: MockBannerPlacement;
  imageId: string | null;
  mobileImageId: string | null;
  heading: string | null;
  subheading: string | null;
  description: string | null;
  cta: MockBannerCta | null;
  secondaryCta: MockBannerCta | null;
  backgroundColor: string | null;
  textColor: string | null;
  sortOrder: number;
  startsAt: Date | null;
  endsAt: Date | null;
  targetAudience: string[];
  clickCount: number;
  impressionCount: number;
  createdById: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const mockBannerIds = {
  homeHero1: generateId(),
  homeHero2: generateId(),
  januarySale: generateId(),
  freeconsultationCta: generateId(),
  kitchenHero: generateId(),
  bedroomHero: generateId(),
  announcement: generateId(),
};

export const mockBannerHomeHero1: MockBanner = {
  id: mockBannerIds.homeHero1,
  title: 'Home Hero - Modern Kitchen',
  type: 'HERO_SLIDER',
  status: 'ACTIVE',
  placement: 'HOME_HERO',
  imageId: mockMediaIds.heroImage1,
  mobileImageId: mockMediaIds.heroImage1,
  heading: 'Dream Kitchens, Crafted for You',
  subheading: 'Bespoke Design. Expert Installation. Outstanding Results.',
  description: 'Transform your kitchen into the heart of your home with our bespoke designs, crafted to your exact specifications.',
  cta: {
    text: 'Explore Kitchens',
    url: '/kitchens',
    style: 'PRIMARY',
  },
  secondaryCta: {
    text: 'Book Free Consultation',
    url: '/book-appointment',
    style: 'SECONDARY',
  },
  backgroundColor: null,
  textColor: '#FFFFFF',
  sortOrder: 1,
  startsAt: null,
  endsAt: null,
  targetAudience: [],
  clickCount: 3412,
  impressionCount: 45230,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockBannerHomeHero2: MockBanner = {
  id: mockBannerIds.homeHero2,
  title: 'Home Hero - Luxury Bedroom',
  type: 'HERO_SLIDER',
  status: 'ACTIVE',
  placement: 'HOME_HERO',
  imageId: mockMediaIds.heroImage2,
  mobileImageId: mockMediaIds.heroImage2,
  heading: 'Luxury Bedrooms, Beautifully Fitted',
  subheading: 'Custom Designs That Maximise Space and Style',
  description: 'From fitted wardrobes to complete bedroom transformations, we create spaces you\'ll love to come home to.',
  cta: {
    text: 'Explore Bedrooms',
    url: '/bedrooms',
    style: 'PRIMARY',
  },
  secondaryCta: {
    text: 'View Our Work',
    url: '/inspiration',
    style: 'OUTLINE',
  },
  backgroundColor: null,
  textColor: '#FFFFFF',
  sortOrder: 2,
  startsAt: null,
  endsAt: null,
  targetAudience: [],
  clickCount: 2876,
  impressionCount: 45230,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockBannerJanuarySale: MockBanner = {
  id: mockBannerIds.januarySale,
  title: 'January Sale 2025',
  type: 'SALE',
  status: 'EXPIRED',
  placement: 'HOME_PROMO',
  imageId: mockMediaIds.kitchenImage1,
  mobileImageId: null,
  heading: 'January Sale — Up to 50% Off',
  subheading: 'Limited Time Offer',
  description: 'Start the new year with a beautiful new kitchen or bedroom. Save up to 50% across selected ranges.',
  cta: {
    text: 'Shop the Sale',
    url: '/sale',
    style: 'PRIMARY',
  },
  secondaryCta: null,
  backgroundColor: '#C0392B',
  textColor: '#FFFFFF',
  sortOrder: 1,
  startsAt: new Date('2025-01-01T00:00:00.000Z'),
  endsAt: new Date('2025-01-31T23:59:59.000Z'),
  targetAudience: [],
  clickCount: 8934,
  impressionCount: 102450,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockBannerFreeConsultationCta: MockBanner = {
  id: mockBannerIds.freeconsultationCta,
  title: 'Free Consultation CTA',
  type: 'CTA',
  status: 'ACTIVE',
  placement: 'HOME_PROMO',
  imageId: mockMediaIds.heroImage1,
  mobileImageId: null,
  heading: 'Ready to Transform Your Home?',
  subheading: null,
  description: 'Book a free design consultation with one of our expert designers. No obligation, no pressure — just great design.',
  cta: {
    text: 'Book a Free Consultation',
    url: '/book-appointment',
    style: 'PRIMARY',
  },
  secondaryCta: {
    text: 'Find a Showroom',
    url: '/showrooms',
    style: 'SECONDARY',
  },
  backgroundColor: '#1A2B3C',
  textColor: '#FFFFFF',
  sortOrder: 2,
  startsAt: null,
  endsAt: null,
  targetAudience: [],
  clickCount: 5621,
  impressionCount: 67890,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockBannerKitchenHero: MockBanner = {
  id: mockBannerIds.kitchenHero,
  title: 'Kitchen Page Hero',
  type: 'HERO_SLIDER',
  status: 'ACTIVE',
  placement: 'KITCHEN_PAGE',
  imageId: mockMediaIds.kitchenImage1,
  mobileImageId: null,
  heading: 'Bespoke Kitchens',
  subheading: 'Designed Around Your Life',
  description: 'Explore our full range of beautifully designed kitchens. Filter by colour, style, and finish to find your perfect match.',
  cta: null,
  secondaryCta: null,
  backgroundColor: null,
  textColor: '#FFFFFF',
  sortOrder: 1,
  startsAt: null,
  endsAt: null,
  targetAudience: [],
  clickCount: 0,
  impressionCount: 23456,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockBannerBedroomHero: MockBanner = {
  id: mockBannerIds.bedroomHero,
  title: 'Bedroom Page Hero',
  type: 'HERO_SLIDER',
  status: 'ACTIVE',
  placement: 'BEDROOM_PAGE',
  imageId: mockMediaIds.heroImage2,
  mobileImageId: null,
  heading: 'Fitted Bedrooms',
  subheading: 'Your Space, Your Style',
  description: 'Discover our range of bespoke fitted bedroom furniture. Built to your exact measurements and specifications.',
  cta: null,
  secondaryCta: null,
  backgroundColor: null,
  textColor: '#FFFFFF',
  sortOrder: 1,
  startsAt: null,
  endsAt: null,
  targetAudience: [],
  clickCount: 0,
  impressionCount: 18932,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockBannerAnnouncement: MockBanner = {
  id: mockBannerIds.announcement,
  title: 'New Showroom Opening — Manchester',
  type: 'ANNOUNCEMENT',
  status: 'SCHEDULED',
  placement: 'GLOBAL_ANNOUNCEMENT',
  imageId: null,
  mobileImageId: null,
  heading: 'New Showroom Opening in Manchester — Spring 2025',
  subheading: null,
  description: 'We\'re excited to announce our newest showroom opening in Manchester city centre this spring.',
  cta: {
    text: 'Find Out More',
    url: '/showrooms/manchester',
    style: 'OUTLINE',
  },
  secondaryCta: null,
  backgroundColor: '#2ECC71',
  textColor: '#FFFFFF',
  sortOrder: 1,
  startsAt: new Date('2025-02-01T00:00:00.000Z'),
  endsAt: new Date('2025-04-30T23:59:59.000Z'),
  targetAudience: [],
  clickCount: 0,
  impressionCount: 0,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const allMockBanners: MockBanner[] = [
  mockBannerHomeHero1,
  mockBannerHomeHero2,
  mockBannerJanuarySale,
  mockBannerFreeConsultationCta,
  mockBannerKitchenHero,
  mockBannerBedroomHero,
  mockBannerAnnouncement,
];

export const activeMockBanners: MockBanner[] = allMockBanners.filter((b) => b.status === 'ACTIVE');

export const mockCreateBannerDto = {
  title: 'New Test Banner',
  type: 'PROMOTIONAL' as MockBannerType,
  status: 'INACTIVE' as MockBannerStatus,
  placement: 'HOME_PROMO' as MockBannerPlacement,
  heading: 'Test Banner Heading',
  subheading: 'Test Banner Subheading',
  description: 'This is a test banner description.',
  cta: {
    text: 'Click Here',
    url: '/test',
    style: 'PRIMARY' as const,
  },
  sortOrder: 99,
};

export const mockUpdateBannerDto = {
  title: 'Updated Banner Title',
  heading: 'Updated Heading',
  status: 'ACTIVE' as MockBannerStatus,
};

export const buildMockBanner = (overrides: Partial<MockBanner> = {}): MockBanner => ({
  id: generateId(),
  title: 'Test Banner',
  type: 'PROMOTIONAL',
  status: 'INACTIVE',
  placement: 'HOME_PROMO',
  imageId: null,
  mobileImageId: null,
  heading: 'Test Heading',
  subheading: null,
  description: null,
  cta: null,
  secondaryCta: null,
  backgroundColor: null,
  textColor: null,
  sortOrder: 99,
  startsAt: null,
  endsAt: null,
  targetAudience: [],
  clickCount: 0,
  impressionCount: 0,
  ...mockAuditFields,
  ...mockCreatedByFields,
  ...overrides,
});