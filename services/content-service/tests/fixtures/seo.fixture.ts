import { generateId, mockAuditFields, mockCreatedByFields } from './common.fixture';
import { mockMediaIds } from './media.fixture';
import { mockPageIds } from './pages.fixture';

export type MockSeoEntityType = 'PAGE' | 'BLOG' | 'PRODUCT' | 'CATEGORY' | 'SHOWROOM';

export interface MockSeoOpenGraph {
  title: string | null;
  description: string | null;
  imageId: string | null;
  type: string;
  siteName: string;
}

export interface MockSeoTwitterCard {
  card: 'summary' | 'summary_large_image';
  title: string | null;
  description: string | null;
  imageId: string | null;
}

export interface MockSeoRecord {
  id: string;
  entityType: MockSeoEntityType;
  entityId: string;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  noFollow: boolean;
  structuredData: Record<string, unknown> | null;
  openGraph: MockSeoOpenGraph;
  twitterCard: MockSeoTwitterCard;
  keywords: string[];
  focusKeyword: string | null;
  breadcrumbs: Array<{ label: string; url: string }>;
  createdById: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const mockSeoIds = {
  homePage: generateId(),
  aboutPage: generateId(),
  financePage: generateId(),
  kitchenTrendsBlog: generateId(),
  globalSettings: generateId(),
};

const defaultOpenGraph = (title: string | null, description: string | null, imageId: string | null): MockSeoOpenGraph => ({
  title,
  description,
  imageId,
  type: 'website',
  siteName: 'Lomash Wood',
});

const defaultTwitterCard = (title: string | null, description: string | null, imageId: string | null): MockSeoTwitterCard => ({
  card: 'summary_large_image',
  title,
  description,
  imageId,
});

export const mockSeoHomePage: MockSeoRecord = {
  id: mockSeoIds.homePage,
  entityType: 'PAGE',
  entityId: mockPageIds.home,
  metaTitle: 'Lomash Wood | Bespoke Kitchens & Bedrooms Across the UK',
  metaDescription:
    'Discover Lomash Wood\'s range of bespoke fitted kitchens and bedrooms. Book a free design consultation with our experts. Showrooms nationwide.',
  canonicalUrl: 'https://www.lomashwood.com',
  noIndex: false,
  noFollow: false,
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: 'Lomash Wood',
    description: 'Bespoke kitchen and bedroom design specialists',
    url: 'https://www.lomashwood.com',
    telephone: '0800 123 4567',
    priceRange: '££',
  },
  openGraph: defaultOpenGraph(
    'Lomash Wood | Bespoke Kitchens & Bedrooms',
    'Transform your home with a bespoke Lomash Wood kitchen or bedroom. Book your free consultation today.',
    mockMediaIds.heroImage1,
  ),
  twitterCard: defaultTwitterCard(
    'Lomash Wood | Bespoke Kitchens & Bedrooms',
    'Transform your home with a bespoke Lomash Wood kitchen or bedroom.',
    mockMediaIds.heroImage1,
  ),
  keywords: ['bespoke kitchens', 'fitted bedrooms', 'kitchen design', 'bedroom design', 'lomash wood'],
  focusKeyword: 'bespoke kitchens',
  breadcrumbs: [{ label: 'Home', url: '/' }],
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockSeoAboutPage: MockSeoRecord = {
  id: mockSeoIds.aboutPage,
  entityType: 'PAGE',
  entityId: mockPageIds.aboutUs,
  metaTitle: 'About Lomash Wood | Expert Kitchen & Bedroom Designers',
  metaDescription:
    'Meet the team at Lomash Wood. Over 20 years of experience creating beautiful bespoke kitchens and bedrooms for homeowners across the UK.',
  canonicalUrl: 'https://www.lomashwood.com/about-us',
  noIndex: false,
  noFollow: false,
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Lomash Wood',
    description: 'Learn about Lomash Wood\'s story and values',
    url: 'https://www.lomashwood.com/about-us',
  },
  openGraph: defaultOpenGraph(
    'About Lomash Wood | Our Story',
    'Over 20 years of crafting beautiful kitchens and bedrooms. Learn more about our story.',
    mockMediaIds.heroImage1,
  ),
  twitterCard: defaultTwitterCard(
    'About Lomash Wood',
    'Over 20 years of crafting beautiful kitchens and bedrooms.',
    mockMediaIds.heroImage1,
  ),
  keywords: ['about lomash wood', 'kitchen designers uk', 'bedroom designers', 'bespoke furniture company'],
  focusKeyword: 'kitchen designers uk',
  breadcrumbs: [
    { label: 'Home', url: '/' },
    { label: 'About Us', url: '/about-us' },
  ],
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockSeoFinancePage: MockSeoRecord = {
  id: mockSeoIds.financePage,
  entityType: 'PAGE',
  entityId: mockPageIds.finance,
  metaTitle: 'Kitchen & Bedroom Finance Options | 0% APR Available | Lomash Wood',
  metaDescription:
    'Flexible finance options for your new kitchen or bedroom. 0% APR for 12 months available. Subject to status. Find out more about our finance plans.',
  canonicalUrl: 'https://www.lomashwood.com/finance',
  noIndex: false,
  noFollow: false,
  structuredData: null,
  openGraph: defaultOpenGraph(
    'Kitchen & Bedroom Finance | Lomash Wood',
    'Flexible finance options available. Spread the cost of your dream kitchen or bedroom.',
    null,
  ),
  twitterCard: defaultTwitterCard(
    'Kitchen & Bedroom Finance | Lomash Wood',
    '0% APR available on kitchen and bedroom orders. Subject to status.',
    null,
  ),
  keywords: ['kitchen finance', 'bedroom finance', '0% apr kitchen', 'buy now pay later kitchen'],
  focusKeyword: 'kitchen finance',
  breadcrumbs: [
    { label: 'Home', url: '/' },
    { label: 'Finance', url: '/finance' },
  ],
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockGlobalSeoSettings = {
  id: mockSeoIds.globalSettings,
  siteName: 'Lomash Wood',
  siteUrl: 'https://www.lomashwood.com',
  defaultMetaTitle: 'Lomash Wood | Bespoke Kitchens & Bedrooms',
  defaultMetaDescription: 'Bespoke kitchen and bedroom design specialists serving the UK.',
  defaultOgImageId: mockMediaIds.heroImage1,
  twitterHandle: '@lomashwood',
  googleSiteVerification: 'abc123def456',
  googleTagManagerId: 'GTM-XXXXXXX',
  robotsTxtContent: `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: https://www.lomashwood.com/sitemap.xml`,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const allMockSeoRecords: MockSeoRecord[] = [
  mockSeoHomePage,
  mockSeoAboutPage,
  mockSeoFinancePage,
];

export const mockCreateSeoDto = {
  entityType: 'PAGE' as MockSeoEntityType,
  entityId: generateId(),
  metaTitle: 'Test Page SEO Title',
  metaDescription: 'Test page meta description for SEO purposes.',
  canonicalUrl: null,
  noIndex: false,
  noFollow: false,
  keywords: ['test', 'seo'],
  focusKeyword: 'test',
};

export const mockUpdateSeoDto = {
  metaTitle: 'Updated SEO Title',
  metaDescription: 'Updated meta description.',
  focusKeyword: 'updated keyword',
};

export const buildMockSeoRecord = (overrides: Partial<MockSeoRecord> = {}): MockSeoRecord => ({
  id: generateId(),
  entityType: 'PAGE',
  entityId: generateId(),
  metaTitle: null,
  metaDescription: null,
  canonicalUrl: null,
  noIndex: false,
  noFollow: false,
  structuredData: null,
  openGraph: defaultOpenGraph(null, null, null),
  twitterCard: defaultTwitterCard(null, null, null),
  keywords: [],
  focusKeyword: null,
  breadcrumbs: [],
  ...mockAuditFields,
  ...mockCreatedByFields,
  ...overrides,
});