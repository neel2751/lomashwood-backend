import { generateId, fixedDate, mockAuditFields, mockCreatedByFields, mockSlugify } from './common.fixture';

export type MockCategoryStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export interface MockCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  status: MockCategoryStatus;
  metaTitle: string | null;
  metaDescription: string | null;
  createdById: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const mockCategoryIds = {
  kitchen: generateId(),
  bedroom: generateId(),
  kitchenInspiration: generateId(),
  bedroomInspiration: generateId(),
  tips: generateId(),
  trends: generateId(),
};

export const mockCategoryKitchen: MockCategory = {
  id: mockCategoryIds.kitchen,
  name: 'Kitchen',
  slug: 'kitchen',
  description: 'Kitchen design ideas, inspiration, and guides',
  parentId: null,
  sortOrder: 1,
  status: 'PUBLISHED',
  metaTitle: 'Kitchen Design Ideas & Inspiration | Lomash Wood',
  metaDescription: 'Explore our collection of kitchen design ideas, styles, and inspiration.',
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockCategoryBedroom: MockCategory = {
  id: mockCategoryIds.bedroom,
  name: 'Bedroom',
  slug: 'bedroom',
  description: 'Bedroom design ideas, inspiration, and guides',
  parentId: null,
  sortOrder: 2,
  status: 'PUBLISHED',
  metaTitle: 'Bedroom Design Ideas & Inspiration | Lomash Wood',
  metaDescription: 'Discover beautiful bedroom designs and furniture styles.',
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockCategoryKitchenInspiration: MockCategory = {
  id: mockCategoryIds.kitchenInspiration,
  name: 'Kitchen Inspiration',
  slug: 'kitchen-inspiration',
  description: 'Inspiring kitchen design articles and case studies',
  parentId: mockCategoryIds.kitchen,
  sortOrder: 1,
  status: 'PUBLISHED',
  metaTitle: 'Kitchen Inspiration | Lomash Wood Blog',
  metaDescription: 'Get inspired with our kitchen design articles and case studies.',
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockCategoryBedroomInspiration: MockCategory = {
  id: mockCategoryIds.bedroomInspiration,
  name: 'Bedroom Inspiration',
  slug: 'bedroom-inspiration',
  description: 'Inspiring bedroom design articles and transformations',
  parentId: mockCategoryIds.bedroom,
  sortOrder: 1,
  status: 'PUBLISHED',
  metaTitle: 'Bedroom Inspiration | Lomash Wood Blog',
  metaDescription: 'Explore our bedroom design inspiration and transformation stories.',
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockCategoryTips: MockCategory = {
  id: mockCategoryIds.tips,
  name: 'Tips & Advice',
  slug: 'tips-advice',
  description: 'Expert tips and advice for home improvement',
  parentId: null,
  sortOrder: 3,
  status: 'PUBLISHED',
  metaTitle: 'Home Design Tips & Advice | Lomash Wood',
  metaDescription: 'Expert tips and practical advice for designing your perfect kitchen or bedroom.',
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockCategoryTrends: MockCategory = {
  id: mockCategoryIds.trends,
  name: 'Design Trends',
  slug: 'design-trends',
  description: 'Latest trends in kitchen and bedroom design',
  parentId: null,
  sortOrder: 4,
  status: 'DRAFT',
  metaTitle: 'Latest Design Trends 2025 | Lomash Wood',
  metaDescription: 'Stay ahead with the latest kitchen and bedroom design trends for 2025.',
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const allMockCategories: MockCategory[] = [
  mockCategoryKitchen,
  mockCategoryBedroom,
  mockCategoryKitchenInspiration,
  mockCategoryBedroomInspiration,
  mockCategoryTips,
  mockCategoryTrends,
];

export const mockCreateCategoryDto = {
  name: 'New Category',
  slug: mockSlugify('New Category'),
  description: 'A newly created test category',
  parentId: null,
  sortOrder: 10,
  status: 'DRAFT' as MockCategoryStatus,
  metaTitle: 'New Category | Lomash Wood',
  metaDescription: 'Test category description for SEO.',
};

export const mockUpdateCategoryDto = {
  name: 'Updated Category',
  description: 'Updated category description',
  status: 'PUBLISHED' as MockCategoryStatus,
};

export const buildMockCategory = (overrides: Partial<MockCategory> = {}): MockCategory => ({
  id: generateId(),
  name: 'Test Category',
  slug: 'test-category',
  description: 'A test category',
  parentId: null,
  sortOrder: 99,
  status: 'DRAFT',
  metaTitle: null,
  metaDescription: null,
  ...mockAuditFields,
  ...mockCreatedByFields,
  ...overrides,
});