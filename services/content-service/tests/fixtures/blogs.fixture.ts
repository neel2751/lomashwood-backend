import { generateId, mockAuditFields, mockCreatedByFields, mockAdminUser } from './common.fixture';
import { mockCategoryIds } from './categories.fixture';
import { mockTagIds } from './tags.fixture';
import { mockMediaIds } from './media.fixture';

export type MockBlogStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';

export interface MockBlogAuthor {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
}

export interface MockBlog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: MockBlogStatus;
  featuredImageId: string | null;
  authorId: string;
  author: MockBlogAuthor;
  categoryIds: string[];
  tagIds: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageId: string | null;
  readingTimeMinutes: number;
  viewCount: number;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  isFeatured: boolean;
  allowComments: boolean;
  createdById: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const mockBlogIds = {
  kitchenTrends2025: generateId(),
  bedroomMakeover: generateId(),
  choosingKitchenColour: generateId(),
  smallBedroomStorage: generateId(),
  handlelessKitchens: generateId(),
  draftPost: generateId(),
  scheduledPost: generateId(),
};

export const mockBlogAuthor: MockBlogAuthor = {
  id: mockAdminUser.id,
  name: 'Lomash Wood Editorial Team',
  bio: 'Expert tips and inspiration from the Lomash Wood design team.',
  avatarUrl: 'https://cdn.lomashwood.com/authors/editorial-team.jpg',
};

export const mockBlogKitchenTrends: MockBlog = {
  id: mockBlogIds.kitchenTrends2025,
  title: 'Top 10 Kitchen Design Trends for 2025',
  slug: 'top-10-kitchen-design-trends-2025',
  excerpt: 'Discover the hottest kitchen design trends dominating 2025, from handleless cabinets to bold colour palettes and sustainable materials.',
  content: '<h2>Introduction</h2><p>As we move through 2025, kitchen design continues to evolve with exciting new trends that blend functionality with aesthetics.</p><h2>1. Handleless Cabinet Doors</h2><p>The handleless kitchen trend continues to dominate in 2025. Clean, uninterrupted lines create a sleek, contemporary look.</p><h2>2. Two-Tone Colour Schemes</h2><p>Combining two complementary colours adds visual interest and depth to kitchen spaces.</p><h2>Conclusion</h2><p>2025 is shaping up to be an exciting year for kitchen design.</p>',
  status: 'PUBLISHED',
  featuredImageId: mockMediaIds.blogImage1,
  authorId: mockAdminUser.id,
  author: mockBlogAuthor,
  categoryIds: [mockCategoryIds.kitchen, mockCategoryIds.kitchenInspiration],
  tagIds: [mockTagIds.modernKitchen, mockTagIds.handleless, mockTagIds.white],
  metaTitle: 'Top 10 Kitchen Design Trends for 2025 | Lomash Wood Blog',
  metaDescription: 'Explore the top kitchen design trends for 2025 including handleless cabinets, two-tone colour schemes, and sustainable materials.',
  ogImageId: mockMediaIds.blogImage1,
  readingTimeMinutes: 7,
  viewCount: 1842,
  publishedAt: new Date('2025-01-10T09:00:00.000Z'),
  scheduledAt: null,
  isFeatured: true,
  allowComments: true,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockBlogBedroomMakeover: MockBlog = {
  id: mockBlogIds.bedroomMakeover,
  title: 'Before & After: A Stunning Bedroom Transformation in Clapham',
  slug: 'before-after-bedroom-transformation-clapham',
  excerpt: 'See how we transformed a dated bedroom into a luxurious retreat with bespoke fitted wardrobes and clever lighting solutions.',
  content: '<h2>The Brief</h2><p>Our clients in Clapham came to us with a bedroom that had seen better days.</p><h2>Our Approach</h2><p>We started by conducting a thorough measurement of the room and discussing the clients needs.</p><h2>The Transformation</h2><p>The centrepiece of the new design is a full wall of bespoke fitted wardrobes in a sophisticated stone grey finish.</p><h2>The Result</h2><p>The finished bedroom is unrecognisable from where we started.</p>',
  status: 'PUBLISHED',
  featuredImageId: mockMediaIds.blogImage2,
  authorId: mockAdminUser.id,
  author: mockBlogAuthor,
  categoryIds: [mockCategoryIds.bedroom, mockCategoryIds.bedroomInspiration],
  tagIds: [mockTagIds.wardrobe, mockTagIds.grey, mockTagIds.luxury],
  metaTitle: 'Bedroom Transformation Case Study - Clapham | Lomash Wood',
  metaDescription: 'Read how Lomash Wood transformed a dated Clapham bedroom into a luxurious fitted bedroom retreat. View before and after photos.',
  ogImageId: mockMediaIds.blogImage2,
  readingTimeMinutes: 5,
  viewCount: 967,
  publishedAt: new Date('2025-01-08T10:00:00.000Z'),
  scheduledAt: null,
  isFeatured: false,
  allowComments: true,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockBlogChoosingKitchenColour: MockBlog = {
  id: mockBlogIds.choosingKitchenColour,
  title: 'How to Choose the Perfect Colour for Your Kitchen',
  slug: 'how-to-choose-perfect-colour-for-your-kitchen',
  excerpt: 'Choosing a kitchen colour can be overwhelming. Our design experts share their top tips for selecting a shade you will love for years to come.',
  content: '<h2>Why Kitchen Colour Matters</h2><p>The colour of your kitchen cabinets sets the entire tone for the space.</p><h2>Start with Your Lifestyle</h2><p>Before falling for a colour on Instagram, consider your lifestyle.</p><h2>Test Before You Commit</h2><p>Always order samples. Colours look dramatically different under different lighting conditions.</p>',
  status: 'PUBLISHED',
  featuredImageId: mockMediaIds.kitchenImage1,
  authorId: mockAdminUser.id,
  author: mockBlogAuthor,
  categoryIds: [mockCategoryIds.kitchen, mockCategoryIds.tips],
  tagIds: [mockTagIds.white, mockTagIds.grey, mockTagIds.modernKitchen],
  metaTitle: 'How to Choose the Perfect Kitchen Colour | Lomash Wood',
  metaDescription: 'Expert advice on choosing the right colour for your kitchen cabinets. Tips from Lomash Wood design specialists.',
  ogImageId: mockMediaIds.kitchenImage1,
  readingTimeMinutes: 4,
  viewCount: 2134,
  publishedAt: new Date('2025-01-05T09:00:00.000Z'),
  scheduledAt: null,
  isFeatured: true,
  allowComments: true,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockBlogSmallBedroomStorage: MockBlog = {
  id: mockBlogIds.smallBedroomStorage,
  title: '8 Clever Storage Solutions for Small Bedrooms',
  slug: '8-clever-storage-solutions-small-bedrooms',
  excerpt: 'Limited bedroom space? Discover eight brilliant storage solutions that will help you maximise every square foot without compromising on style.',
  content: '<h2>The Challenge of Small Bedrooms</h2><p>Small bedrooms present a real design challenge.</p><h2>1. Floor-to-Ceiling Fitted Wardrobes</h2><p>Utilising the full height of your walls creates enormous storage capacity.</p><h2>2. Under-Bed Storage</h2><p>The space under your bed is prime real estate for seasonal items and extra bedding.</p>',
  status: 'PUBLISHED',
  featuredImageId: mockMediaIds.bedroomImage1,
  authorId: mockAdminUser.id,
  author: mockBlogAuthor,
  categoryIds: [mockCategoryIds.bedroom, mockCategoryIds.tips],
  tagIds: [mockTagIds.smallSpace, mockTagIds.storage, mockTagIds.wardrobe],
  metaTitle: '8 Clever Storage Solutions for Small Bedrooms | Lomash Wood',
  metaDescription: 'Discover 8 smart storage ideas for small bedrooms. Make the most of limited space with fitted wardrobes, under-bed storage, and more.',
  ogImageId: mockMediaIds.bedroomImage1,
  readingTimeMinutes: 6,
  viewCount: 3267,
  publishedAt: new Date('2025-01-02T09:00:00.000Z'),
  scheduledAt: null,
  isFeatured: false,
  allowComments: true,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockBlogHandlelessKitchens: MockBlog = {
  id: mockBlogIds.handlelessKitchens,
  title: 'The Complete Guide to Handleless Kitchens',
  slug: 'complete-guide-handleless-kitchens',
  excerpt: 'Handleless kitchens offer a sleek, contemporary look that is both practical and stylish. Find out everything you need to know before choosing one.',
  content: '<h2>What is a Handleless Kitchen?</h2><p>A handleless kitchen uses a recessed edge or channel instead of traditional door handles to open cabinets and drawers.</p><h2>Advantages of Handleless Kitchens</h2><p>The primary advantage is aesthetics — handleless kitchens create clean, uninterrupted lines that give a sophisticated, contemporary look.</p>',
  status: 'PUBLISHED',
  featuredImageId: mockMediaIds.kitchenImage2,
  authorId: mockAdminUser.id,
  author: mockBlogAuthor,
  categoryIds: [mockCategoryIds.kitchen, mockCategoryIds.kitchenInspiration],
  tagIds: [mockTagIds.handleless, mockTagIds.modernKitchen, mockTagIds.minimalist],
  metaTitle: 'The Complete Guide to Handleless Kitchens | Lomash Wood',
  metaDescription: 'Everything you need to know about handleless kitchens — how they work, their advantages, and how to choose the right one for your home.',
  ogImageId: mockMediaIds.kitchenImage2,
  readingTimeMinutes: 8,
  viewCount: 1456,
  publishedAt: new Date('2024-12-28T09:00:00.000Z'),
  scheduledAt: null,
  isFeatured: false,
  allowComments: true,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockBlogDraftPost: MockBlog = {
  id: mockBlogIds.draftPost,
  title: 'Draft: The Rise of Biophilic Design in Home Interiors',
  slug: 'rise-biophilic-design-home-interiors',
  excerpt: 'How bringing nature indoors is transforming kitchen and bedroom design.',
  content: '<p>Content coming soon...</p>',
  status: 'DRAFT',
  featuredImageId: null,
  authorId: mockAdminUser.id,
  author: mockBlogAuthor,
  categoryIds: [mockCategoryIds.kitchen],
  tagIds: [mockTagIds.minimalist],
  metaTitle: null,
  metaDescription: null,
  ogImageId: null,
  readingTimeMinutes: 0,
  viewCount: 0,
  publishedAt: null,
  scheduledAt: null,
  isFeatured: false,
  allowComments: false,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockBlogScheduledPost: MockBlog = {
  id: mockBlogIds.scheduledPost,
  title: 'Upcoming: Spring Kitchen Refresh Ideas',
  slug: 'spring-kitchen-refresh-ideas-2025',
  excerpt: 'Simple ways to refresh your kitchen for spring without a full renovation.',
  content: '<p>Full article content goes here with spring refresh tips.</p>',
  status: 'SCHEDULED',
  featuredImageId: mockMediaIds.blogImage1,
  authorId: mockAdminUser.id,
  author: mockBlogAuthor,
  categoryIds: [mockCategoryIds.kitchen, mockCategoryIds.tips],
  tagIds: [mockTagIds.modernKitchen],
  metaTitle: 'Spring Kitchen Refresh Ideas 2025 | Lomash Wood',
  metaDescription: 'Simple ways to refresh your kitchen this spring without breaking the budget.',
  ogImageId: mockMediaIds.blogImage1,
  readingTimeMinutes: 5,
  viewCount: 0,
  publishedAt: null,
  scheduledAt: new Date('2025-03-01T09:00:00.000Z'),
  isFeatured: false,
  allowComments: true,
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const allMockBlogs: MockBlog[] = [
  mockBlogKitchenTrends,
  mockBlogBedroomMakeover,
  mockBlogChoosingKitchenColour,
  mockBlogSmallBedroomStorage,
  mockBlogHandlelessKitchens,
  mockBlogDraftPost,
  mockBlogScheduledPost,
];

export const publishedMockBlogs: MockBlog[] = allMockBlogs.filter(
  (b) => b.status === 'PUBLISHED',
);

export const mockCreateBlogDto = {
  title: 'New Test Blog Post',
  slug: 'new-test-blog-post',
  excerpt: 'This is the excerpt for a new test blog post.',
  content: '<p>This is the full content for the new test blog post.</p>',
  status: 'DRAFT' as MockBlogStatus,
  categoryIds: [mockCategoryIds.kitchen],
  tagIds: [mockTagIds.modernKitchen],
  metaTitle: 'New Test Blog Post | Lomash Wood',
  metaDescription: 'Test meta description for the new blog post.',
  isFeatured: false,
  allowComments: true,
};

export const mockUpdateBlogDto = {
  title: 'Updated Blog Post Title',
  excerpt: 'Updated excerpt for the blog post.',
  status: 'PUBLISHED' as MockBlogStatus,
};

export const mockPublishBlogDto = {
  status: 'PUBLISHED' as MockBlogStatus,
  publishedAt: new Date('2025-01-15T09:00:00.000Z'),
};

export const buildMockBlog = (overrides: Partial<MockBlog> = {}): MockBlog => ({
  id: generateId(),
  title: 'Test Blog Post',
  slug: 'test-blog-post',
  excerpt: 'Test blog post excerpt.',
  content: '<p>Test blog post content.</p>',
  status: 'DRAFT',
  featuredImageId: null,
  authorId: mockAdminUser.id,
  author: mockBlogAuthor,
  categoryIds: [],
  tagIds: [],
  metaTitle: null,
  metaDescription: null,
  ogImageId: null,
  readingTimeMinutes: 1,
  viewCount: 0,
  publishedAt: null,
  scheduledAt: null,
  isFeatured: false,
  allowComments: true,
  ...mockAuditFields,
  ...mockCreatedByFields,
  ...overrides,
});