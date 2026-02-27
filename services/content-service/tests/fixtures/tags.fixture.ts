import { generateId, fixedDate, mockAuditFields, mockCreatedByFields, mockSlugify } from './common.fixture';

export interface MockTag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  usageCount: number;
  createdById: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const mockTagIds = {
  modernKitchen: generateId(),
  handleless: generateId(),
  white: generateId(),
  grey: generateId(),
  luxury: generateId(),
  smallSpace: generateId(),
  storage: generateId(),
  wardrobe: generateId(),
  minimalist: generateId(),
  traditional: generateId(),
};

export const mockTagModernKitchen: MockTag = {
  id: mockTagIds.modernKitchen,
  name: 'Modern Kitchen',
  slug: 'modern-kitchen',
  description: 'Contemporary and sleek kitchen designs',
  usageCount: 42,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockTagHandleless: MockTag = {
  id: mockTagIds.handleless,
  name: 'Handleless',
  slug: 'handleless',
  description: 'Handleless kitchen door designs',
  usageCount: 35,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockTagWhite: MockTag = {
  id: mockTagIds.white,
  name: 'White',
  slug: 'white',
  description: 'White finish kitchen and bedroom designs',
  usageCount: 67,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockTagGrey: MockTag = {
  id: mockTagIds.grey,
  name: 'Grey',
  slug: 'grey',
  description: 'Grey finish kitchen and bedroom designs',
  usageCount: 54,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockTagLuxury: MockTag = {
  id: mockTagIds.luxury,
  name: 'Luxury',
  slug: 'luxury',
  description: 'Premium and luxury design concepts',
  usageCount: 29,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockTagSmallSpace: MockTag = {
  id: mockTagIds.smallSpace,
  name: 'Small Space',
  slug: 'small-space',
  description: 'Design solutions for smaller rooms',
  usageCount: 18,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockTagStorage: MockTag = {
  id: mockTagIds.storage,
  name: 'Storage Solutions',
  slug: 'storage-solutions',
  description: 'Clever storage ideas and solutions',
  usageCount: 31,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockTagWardrobe: MockTag = {
  id: mockTagIds.wardrobe,
  name: 'Wardrobe',
  slug: 'wardrobe',
  description: 'Built-in and freestanding wardrobe ideas',
  usageCount: 22,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockTagMinimalist: MockTag = {
  id: mockTagIds.minimalist,
  name: 'Minimalist',
  slug: 'minimalist',
  description: 'Clean, minimal aesthetic designs',
  usageCount: 45,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockTagTraditional: MockTag = {
  id: mockTagIds.traditional,
  name: 'Traditional',
  slug: 'traditional',
  description: 'Classic and traditional style designs',
  usageCount: 27,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const allMockTags: MockTag[] = [
  mockTagModernKitchen,
  mockTagHandleless,
  mockTagWhite,
  mockTagGrey,
  mockTagLuxury,
  mockTagSmallSpace,
  mockTagStorage,
  mockTagWardrobe,
  mockTagMinimalist,
  mockTagTraditional,
];

export const mockCreateTagDto = {
  name: 'New Tag',
  slug: mockSlugify('New Tag'),
  description: 'A newly created test tag',
};

export const mockUpdateTagDto = {
  name: 'Updated Tag',
  description: 'Updated tag description',
};

export const buildMockTag = (overrides: Partial<MockTag> = {}): MockTag => ({
  id: generateId(),
  name: 'Test Tag',
  slug: 'test-tag',
  description: null,
  usageCount: 0,
  ...mockAuditFields,
  ...mockCreatedByFields,
  ...overrides,
});