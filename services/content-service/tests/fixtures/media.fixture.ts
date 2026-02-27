import { generateId, mockAuditFields, mockCreatedByFields, mockS3BaseUrl } from './common.fixture';

export type MockMediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
export type MockMediaStatus = 'ACTIVE' | 'ARCHIVED' | 'PROCESSING';

export interface MockMedia {
  id: string;
  type: MockMediaType;
  status: MockMediaStatus;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  caption: string | null;
  folder: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdById: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const mockMediaIds = {
  heroImage1: generateId(),
  heroImage2: generateId(),
  kitchenImage1: generateId(),
  kitchenImage2: generateId(),
  bedroomImage1: generateId(),
  bedroomImage2: generateId(),
  mediaWallVideo1: generateId(),
  mediaWallImage1: generateId(),
  blogImage1: generateId(),
  blogImage2: generateId(),
  showroomImage1: generateId(),
};

export const mockMediaHeroImage1: MockMedia = {
  id: mockMediaIds.heroImage1,
  type: 'IMAGE',
  status: 'ACTIVE',
  originalName: 'hero-kitchen-modern.jpg',
  filename: 'hero-kitchen-modern-1705312800.jpg',
  mimeType: 'image/jpeg',
  size: 1245678,
  width: 1920,
  height: 1080,
  duration: null,
  url: `${mockS3BaseUrl}/images/hero-kitchen-modern-1705312800.jpg`,
  thumbnailUrl: `${mockS3BaseUrl}/thumbnails/hero-kitchen-modern-1705312800.jpg`,
  altText: 'Modern white handleless kitchen with island',
  caption: 'Stunning modern kitchen design featuring clean lines and a central island',
  folder: 'hero',
  tags: ['hero', 'kitchen', 'modern'],
  metadata: { exif: { camera: 'Canon EOS R5', iso: 100 } },
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockMediaHeroImage2: MockMedia = {
  id: mockMediaIds.heroImage2,
  type: 'IMAGE',
  status: 'ACTIVE',
  originalName: 'hero-bedroom-luxury.jpg',
  filename: 'hero-bedroom-luxury-1705312900.jpg',
  mimeType: 'image/jpeg',
  size: 987654,
  width: 1920,
  height: 1080,
  duration: null,
  url: `${mockS3BaseUrl}/images/hero-bedroom-luxury-1705312900.jpg`,
  thumbnailUrl: `${mockS3BaseUrl}/thumbnails/hero-bedroom-luxury-1705312900.jpg`,
  altText: 'Luxury fitted bedroom with floor-to-ceiling wardrobes',
  caption: 'Bespoke luxury bedroom with custom-fitted storage solutions',
  folder: 'hero',
  tags: ['hero', 'bedroom', 'luxury'],
  metadata: {},
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockMediaKitchenImage1: MockMedia = {
  id: mockMediaIds.kitchenImage1,
  type: 'IMAGE',
  status: 'ACTIVE',
  originalName: 'luna-kitchen-white.jpg',
  filename: 'luna-kitchen-white-1705313000.jpg',
  mimeType: 'image/jpeg',
  size: 876543,
  width: 1200,
  height: 800,
  duration: null,
  url: `${mockS3BaseUrl}/images/luna-kitchen-white-1705313000.jpg`,
  thumbnailUrl: `${mockS3BaseUrl}/thumbnails/luna-kitchen-white-1705313000.jpg`,
  altText: 'Luna kitchen in white gloss finish',
  caption: null,
  folder: 'products/kitchen',
  tags: ['kitchen', 'luna', 'white'],
  metadata: {},
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockMediaKitchenImage2: MockMedia = {
  id: mockMediaIds.kitchenImage2,
  type: 'IMAGE',
  status: 'ACTIVE',
  originalName: 'luna-kitchen-white-detail.jpg',
  filename: 'luna-kitchen-white-detail-1705313100.jpg',
  mimeType: 'image/jpeg',
  size: 654321,
  width: 1200,
  height: 800,
  duration: null,
  url: `${mockS3BaseUrl}/images/luna-kitchen-white-detail-1705313100.jpg`,
  thumbnailUrl: `${mockS3BaseUrl}/thumbnails/luna-kitchen-white-detail-1705313100.jpg`,
  altText: 'Luna kitchen white gloss door detail close-up',
  caption: null,
  folder: 'products/kitchen',
  tags: ['kitchen', 'luna', 'white', 'detail'],
  metadata: {},
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockMediaBedroomImage1: MockMedia = {
  id: mockMediaIds.bedroomImage1,
  type: 'IMAGE',
  status: 'ACTIVE',
  originalName: 'fitted-wardrobe-grey.jpg',
  filename: 'fitted-wardrobe-grey-1705313200.jpg',
  mimeType: 'image/jpeg',
  size: 765432,
  width: 1200,
  height: 900,
  duration: null,
  url: `${mockS3BaseUrl}/images/fitted-wardrobe-grey-1705313200.jpg`,
  thumbnailUrl: `${mockS3BaseUrl}/thumbnails/fitted-wardrobe-grey-1705313200.jpg`,
  altText: 'Fitted grey bedroom wardrobe with sliding doors',
  caption: null,
  folder: 'products/bedroom',
  tags: ['bedroom', 'wardrobe', 'grey'],
  metadata: {},
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockMediaBedroomImage2: MockMedia = {
  id: mockMediaIds.bedroomImage2,
  type: 'IMAGE',
  status: 'ACTIVE',
  originalName: 'bedroom-storage-oak.jpg',
  filename: 'bedroom-storage-oak-1705313300.jpg',
  mimeType: 'image/jpeg',
  size: 823456,
  width: 1200,
  height: 900,
  duration: null,
  url: `${mockS3BaseUrl}/images/bedroom-storage-oak-1705313300.jpg`,
  thumbnailUrl: `${mockS3BaseUrl}/thumbnails/bedroom-storage-oak-1705313300.jpg`,
  altText: 'Oak bedroom storage with open shelving and drawers',
  caption: null,
  folder: 'products/bedroom',
  tags: ['bedroom', 'storage', 'oak'],
  metadata: {},
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockMediaWallVideo1: MockMedia = {
  id: mockMediaIds.mediaWallVideo1,
  type: 'VIDEO',
  status: 'ACTIVE',
  originalName: 'lomash-showroom-tour.mp4',
  filename: 'lomash-showroom-tour-1705313400.mp4',
  mimeType: 'video/mp4',
  size: 52428800,
  width: 1920,
  height: 1080,
  duration: 120,
  url: `${mockS3BaseUrl}/videos/lomash-showroom-tour-1705313400.mp4`,
  thumbnailUrl: `${mockS3BaseUrl}/thumbnails/lomash-showroom-tour-1705313400.jpg`,
  altText: 'Lomash Wood showroom virtual tour',
  caption: 'Take a virtual tour of our flagship showroom',
  folder: 'media-wall',
  tags: ['showroom', 'tour', 'media-wall'],
  metadata: { codec: 'h264', bitrate: '8000kbps', fps: 30 },
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockMediaWallImage1: MockMedia = {
  id: mockMediaIds.mediaWallImage1,
  type: 'IMAGE',
  status: 'ACTIVE',
  originalName: 'media-wall-fireplace.jpg',
  filename: 'media-wall-fireplace-1705313500.jpg',
  mimeType: 'image/jpeg',
  size: 934567,
  width: 1920,
  height: 1280,
  duration: null,
  url: `${mockS3BaseUrl}/images/media-wall-fireplace-1705313500.jpg`,
  thumbnailUrl: `${mockS3BaseUrl}/thumbnails/media-wall-fireplace-1705313500.jpg`,
  altText: 'Bespoke media wall with integrated fireplace and TV unit',
  caption: 'Custom media wall featuring a built-in fireplace and hidden cable management',
  folder: 'media-wall',
  tags: ['media-wall', 'fireplace', 'tv-unit'],
  metadata: {},
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockMediaBlogImage1: MockMedia = {
  id: mockMediaIds.blogImage1,
  type: 'IMAGE',
  status: 'ACTIVE',
  originalName: 'blog-kitchen-trends-2025.jpg',
  filename: 'blog-kitchen-trends-2025-1705313600.jpg',
  mimeType: 'image/jpeg',
  size: 543210,
  width: 1200,
  height: 630,
  duration: null,
  url: `${mockS3BaseUrl}/images/blog-kitchen-trends-2025-1705313600.jpg`,
  thumbnailUrl: `${mockS3BaseUrl}/thumbnails/blog-kitchen-trends-2025-1705313600.jpg`,
  altText: 'Kitchen design trends for 2025',
  caption: 'Discover the top kitchen trends shaping 2025',
  folder: 'blog',
  tags: ['blog', 'kitchen', 'trends', '2025'],
  metadata: {},
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockMediaBlogImage2: MockMedia = {
  id: mockMediaIds.blogImage2,
  type: 'IMAGE',
  status: 'ACTIVE',
  originalName: 'blog-bedroom-makeover.jpg',
  filename: 'blog-bedroom-makeover-1705313700.jpg',
  mimeType: 'image/jpeg',
  size: 621098,
  width: 1200,
  height: 630,
  duration: null,
  url: `${mockS3BaseUrl}/images/blog-bedroom-makeover-1705313700.jpg`,
  thumbnailUrl: `${mockS3BaseUrl}/thumbnails/blog-bedroom-makeover-1705313700.jpg`,
  altText: 'Before and after bedroom makeover transformation',
  caption: 'Amazing bedroom transformation - before and after',
  folder: 'blog',
  tags: ['blog', 'bedroom', 'makeover'],
  metadata: {},
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockMediaShowroomImage1: MockMedia = {
  id: mockMediaIds.showroomImage1,
  type: 'IMAGE',
  status: 'ACTIVE',
  originalName: 'showroom-clapham-exterior.jpg',
  filename: 'showroom-clapham-exterior-1705313800.jpg',
  mimeType: 'image/jpeg',
  size: 789012,
  width: 1200,
  height: 800,
  duration: null,
  url: `${mockS3BaseUrl}/images/showroom-clapham-exterior-1705313800.jpg`,
  thumbnailUrl: `${mockS3BaseUrl}/thumbnails/showroom-clapham-exterior-1705313800.jpg`,
  altText: 'Lomash Wood Clapham showroom exterior',
  caption: null,
  folder: 'showrooms',
  tags: ['showroom', 'clapham'],
  metadata: {},
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const allMockMedia: MockMedia[] = [
  mockMediaHeroImage1,
  mockMediaHeroImage2,
  mockMediaKitchenImage1,
  mockMediaKitchenImage2,
  mockMediaBedroomImage1,
  mockMediaBedroomImage2,
  mockMediaWallVideo1,
  mockMediaWallImage1,
  mockMediaBlogImage1,
  mockMediaBlogImage2,
  mockMediaShowroomImage1,
];

export const mockUploadImageDto = {
  altText: 'Test image alt text',
  caption: 'Test image caption',
  folder: 'test',
  tags: ['test'],
};

export const mockUpdateMediaDto = {
  altText: 'Updated alt text',
  caption: 'Updated caption',
  tags: ['updated', 'test'],
};

export const buildMockMedia = (overrides: Partial<MockMedia> = {}): MockMedia => ({
  id: generateId(),
  type: 'IMAGE',
  status: 'ACTIVE',
  originalName: 'test-image.jpg',
  filename: 'test-image-1705310000.jpg',
  mimeType: 'image/jpeg',
  size: 500000,
  width: 800,
  height: 600,
  duration: null,
  url: `${mockS3BaseUrl}/images/test-image-1705310000.jpg`,
  thumbnailUrl: `${mockS3BaseUrl}/thumbnails/test-image-1705310000.jpg`,
  altText: null,
  caption: null,
  folder: 'test',
  tags: [],
  metadata: {},
  ...mockAuditFields,
  ...mockCreatedByFields,
  ...overrides,
});