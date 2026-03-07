import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, PaginatedResponse } from '../../../../../packages/api-client/src/types/api.types';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  author: string;
  authorId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt?: string;
  caption?: string;
  category?: string;
  tags: string[];
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface CmsPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  template: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Showroom {
  id: string;
  name: string;
  slug: string;
  address: any;
  image?: string;
  email?: string;
  phone?: string;
  openingHours: any;
  mapUrl?: string;
  coordinates?: any;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  template: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  heroSection?: any;
  sections?: any[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface GetBlogsParams {
  page: number;
  limit: number;
  filters: {
    category?: string;
    status?: string;
    featured?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

interface GetMediaItemsParams {
  page: number;
  limit: number;
  filters: {
    type?: string;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

interface GetCmsPagesParams {
  page: number;
  limit: number;
  filters: {
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

interface GetLandingPagesParams {
  page: number;
  limit: number;
  filters: {
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

export class ContentService {
  private blogs: Blog[] = [];
  private mediaItems: MediaItem[] = [];
  private cmsPages: CmsPage[] = [];
  private showrooms: Showroom[] = [];
  private landingPages: LandingPage[] = [];

  constructor() {
    this.initializeMockData();
  }

  async getBlogs(params: GetBlogsParams): Promise<PaginatedResponse<Blog[]>> {
    try {
      let filteredBlogs = [...this.blogs];

      // Apply filters
      if (params.filters.category) {
        filteredBlogs = filteredBlogs.filter(b => b.category === params.filters.category);
      }

      if (params.filters.status) {
        filteredBlogs = filteredBlogs.filter(b => b.status === params.filters.status);
      }

      if (params.filters.featured) {
        filteredBlogs = filteredBlogs.filter(b => b.featured);
      }

      if (params.filters.search) {
        const searchTerm = params.filters.search.toLowerCase();
        filteredBlogs = filteredBlogs.filter(b =>
          b.title.toLowerCase().includes(searchTerm) ||
          b.excerpt.toLowerCase().includes(searchTerm) ||
          b.content.toLowerCase().includes(searchTerm) ||
          b.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Sort blogs
      const sortBy = params.filters.sortBy || 'createdAt';
      const sortOrder = params.filters.sortOrder || 'desc';
      
      filteredBlogs.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Blog];
        let bValue: any = b[sortBy as keyof Blog];
        
        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // Pagination
      const total = filteredBlogs.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedBlogs,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get blogs error:', error);
      return {
        success: false,
        message: 'Failed to fetch blogs',
        error: 'GET_BLOGS_FAILED',
      };
    }
  }

  async getBlog(id: string): Promise<ApiResponse<Blog>> {
    try {
      const blog = this.blogs.find(b => b.id === id);
      
      if (!blog) {
        return {
          success: false,
          message: 'Blog not found',
          error: 'BLOG_NOT_FOUND',
        };
      }

      return {
        success: true,
        data: blog,
      };
    } catch (error) {
      console.error('Get blog error:', error);
      return {
        success: false,
        message: 'Failed to fetch blog',
        error: 'GET_BLOG_FAILED',
      };
    }
  }

  async createBlog(blogData: Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Blog>> {
    try {
      // Check if slug already exists
      const existingBlog = this.blogs.find(b => b.slug === blogData.slug);
      if (existingBlog) {
        return {
          success: false,
          message: 'Blog with this slug already exists',
          error: 'BLOG_SLUG_EXISTS',
        };
      }

      const blog: Blog = {
        id: uuidv4(),
        ...blogData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.blogs.push(blog);

      return {
        success: true,
        data: blog,
      };
    } catch (error) {
      console.error('Create blog error:', error);
      return {
        success: false,
        message: 'Failed to create blog',
        error: 'CREATE_BLOG_FAILED',
      };
    }
  }

  async updateBlog(id: string, blogData: Partial<Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Blog>> {
    try {
      const blogIndex = this.blogs.findIndex(b => b.id === id);
      
      if (blogIndex === -1) {
        return {
          success: false,
          message: 'Blog not found',
          error: 'BLOG_NOT_FOUND',
        };
      }

      const updatedBlog: Blog = {
        ...this.blogs[blogIndex],
        ...blogData,
        updatedAt: new Date(),
      };

      this.blogs[blogIndex] = updatedBlog;

      return {
        success: true,
        data: updatedBlog,
      };
    } catch (error) {
      console.error('Update blog error:', error);
      return {
        success: false,
        message: 'Failed to update blog',
        error: 'UPDATE_BLOG_FAILED',
      };
    }
  }

  async deleteBlog(id: string): Promise<ApiResponse<void>> {
    try {
      const blogIndex = this.blogs.findIndex(b => b.id === id);
      
      if (blogIndex === -1) {
        return {
          success: false,
          message: 'Blog not found',
          error: 'BLOG_NOT_FOUND',
        };
      }

      this.blogs.splice(blogIndex, 1);

      return {
        success: true,
        message: 'Blog deleted successfully',
      };
    } catch (error) {
      console.error('Delete blog error:', error);
      return {
        success: false,
        message: 'Failed to delete blog',
        error: 'DELETE_BLOG_FAILED',
      };
    }
  }

  async getMediaItems(params: GetMediaItemsParams): Promise<PaginatedResponse<MediaItem[]>> {
    try {
      let filteredMedia = [...this.mediaItems];

      // Apply filters
      if (params.filters.type) {
        filteredMedia = filteredMedia.filter(m => m.mimeType.startsWith(params.filters.type!));
      }

      if (params.filters.category) {
        filteredMedia = filteredMedia.filter(m => m.category === params.filters.category);
      }

      if (params.filters.search) {
        const searchTerm = params.filters.search.toLowerCase();
        filteredMedia = filteredMedia.filter(m =>
          m.filename.toLowerCase().includes(searchTerm) ||
          m.originalName.toLowerCase().includes(searchTerm) ||
          m.alt?.toLowerCase().includes(searchTerm) ||
          m.caption?.toLowerCase().includes(searchTerm)
        );
      }

      // Sort media items
      const sortBy = params.filters.sortBy || 'createdAt';
      const sortOrder = params.filters.sortOrder || 'desc';
      
      filteredMedia.sort((a, b) => {
        let aValue: any = a[sortBy as keyof MediaItem];
        let bValue: any = b[sortBy as keyof MediaItem];
        
        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // Pagination
      const total = filteredMedia.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedMedia = filteredMedia.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedMedia,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get media items error:', error);
      return {
        success: false,
        message: 'Failed to fetch media items',
        error: 'GET_MEDIA_ITEMS_FAILED',
      };
    }
  }

  async uploadMedia(file: Express.Multer.File): Promise<ApiResponse<MediaItem>> {
    try {
      const mediaItem: MediaItem = {
        id: uuidv4(),
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
        category: this.getCategoryFromMimeType(file.mimetype),
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.mediaItems.push(mediaItem);

      return {
        success: true,
        data: mediaItem,
      };
    } catch (error) {
      console.error('Upload media error:', error);
      return {
        success: false,
        message: 'Failed to upload media',
        error: 'UPLOAD_MEDIA_FAILED',
      };
    }
  }

  async getCmsPages(params: GetCmsPagesParams): Promise<PaginatedResponse<CmsPage[]>> {
    try {
      let filteredPages = [...this.cmsPages];

      // Apply filters
      if (params.filters.status) {
        filteredPages = filteredPages.filter(p => p.status === params.filters.status);
      }

      if (params.filters.search) {
        const searchTerm = params.filters.search.toLowerCase();
        filteredPages = filteredPages.filter(p =>
          p.title.toLowerCase().includes(searchTerm) ||
          p.slug.toLowerCase().includes(searchTerm) ||
          p.content.toLowerCase().includes(searchTerm)
        );
      }

      // Sort pages
      const sortBy = params.filters.sortBy || 'createdAt';
      const sortOrder = params.filters.sortOrder || 'desc';
      
      filteredPages.sort((a, b) => {
        let aValue: any = a[sortBy as keyof CmsPage];
        let bValue: any = b[sortBy as keyof CmsPage];
        
        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // Pagination
      const total = filteredPages.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedPages = filteredPages.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedPages,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get CMS pages error:', error);
      return {
        success: false,
        message: 'Failed to fetch CMS pages',
        error: 'GET_CMS_PAGES_FAILED',
      };
    }
  }

  async getCmsPage(id: string): Promise<ApiResponse<CmsPage>> {
    try {
      const page = this.cmsPages.find(p => p.id === id);
      
      if (!page) {
        return {
          success: false,
          message: 'CMS page not found',
          error: 'CMS_PAGE_NOT_FOUND',
        };
      }

      return {
        success: true,
        data: page,
      };
    } catch (error) {
      console.error('Get CMS page error:', error);
      return {
        success: false,
        message: 'Failed to fetch CMS page',
        error: 'GET_CMS_PAGE_FAILED',
      };
    }
  }

  async createCmsPage(pageData: Omit<CmsPage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<CmsPage>> {
    try {
      // Check if slug already exists
      const existingPage = this.cmsPages.find(p => p.slug === pageData.slug);
      if (existingPage) {
        return {
          success: false,
          message: 'CMS page with this slug already exists',
          error: 'CMS_PAGE_SLUG_EXISTS',
        };
      }

      const page: CmsPage = {
        id: uuidv4(),
        ...pageData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.cmsPages.push(page);

      return {
        success: true,
        data: page,
      };
    } catch (error) {
      console.error('Create CMS page error:', error);
      return {
        success: false,
        message: 'Failed to create CMS page',
        error: 'CREATE_CMS_PAGE_FAILED',
      };
    }
  }

  async updateCmsPage(id: string, pageData: Partial<Omit<CmsPage, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<CmsPage>> {
    try {
      const pageIndex = this.cmsPages.findIndex(p => p.id === id);
      
      if (pageIndex === -1) {
        return {
          success: false,
          message: 'CMS page not found',
          error: 'CMS_PAGE_NOT_FOUND',
        };
      }

      const updatedPage: CmsPage = {
        ...this.cmsPages[pageIndex],
        ...pageData,
        updatedAt: new Date(),
      };

      this.cmsPages[pageIndex] = updatedPage;

      return {
        success: true,
        data: updatedPage,
      };
    } catch (error) {
      console.error('Update CMS page error:', error);
      return {
        success: false,
        message: 'Failed to update CMS page',
        error: 'UPDATE_CMS_PAGE_FAILED',
      };
    }
  }

  async getShowrooms(active: boolean = true): Promise<ApiResponse<Showroom[]>> {
    try {
      const filteredShowrooms = this.showrooms.filter(s => s.isActive === active);
      
      return {
        success: true,
        data: filteredShowrooms,
      };
    } catch (error) {
      console.error('Get showrooms error:', error);
      return {
        success: false,
        message: 'Failed to fetch showrooms',
        error: 'GET_SHOWROOMS_FAILED',
      };
    }
  }

  async getLandingPages(params: GetLandingPagesParams): Promise<PaginatedResponse<LandingPage[]>> {
    try {
      let filteredPages = [...this.landingPages];

      // Apply filters
      if (params.filters.status) {
        filteredPages = filteredPages.filter(p => p.status === params.filters.status);
      }

      if (params.filters.search) {
        const searchTerm = params.filters.search.toLowerCase();
        filteredPages = filteredPages.filter(p =>
          p.title.toLowerCase().includes(searchTerm) ||
          p.slug.toLowerCase().includes(searchTerm) ||
          p.content.toLowerCase().includes(searchTerm)
        );
      }

      // Sort pages
      const sortBy = params.filters.sortBy || 'createdAt';
      const sortOrder = params.filters.sortOrder || 'desc';
      
      filteredPages.sort((a, b) => {
        let aValue: any = a[sortBy as keyof LandingPage];
        let bValue: any = b[sortBy as keyof LandingPage];
        
        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // Pagination
      const total = filteredPages.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedPages = filteredPages.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedPages,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get landing pages error:', error);
      return {
        success: false,
        message: 'Failed to fetch landing pages',
        error: 'GET_LANDING_PAGES_FAILED',
      };
    }
  }

  private getCategoryFromMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'document';
    return 'other';
  }

  private initializeMockData(): void {
    // Initialize mock blogs
    this.blogs = [
      {
        id: uuidv4(),
        title: 'Modern Kitchen Design Trends 2024',
        slug: 'modern-kitchen-design-trends-2024',
        excerpt: 'Discover the latest trends in modern kitchen design for 2024.',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
        featuredImage: '/images/blogs/kitchen-trends.jpg',
        category: 'Design',
        tags: ['kitchen', 'design', 'trends', '2024'],
        author: 'John Smith',
        authorId: 'author-1',
        status: 'PUBLISHED',
        featured: true,
        seoTitle: 'Modern Kitchen Design Trends 2024 | Lomash Wood',
        seoDescription: 'Discover the latest trends in modern kitchen design for 2024.',
        seoKeywords: 'kitchen design, modern kitchen, 2024 trends',
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Initialize mock showrooms
    this.showrooms = [
      {
        id: uuidv4(),
        name: 'London Showroom',
        slug: 'london-showroom',
        address: {
          street: '123 High Street',
          city: 'London',
          postalCode: 'SW1A 1AA',
          country: 'UK',
        },
        image: '/images/showrooms/london.jpg',
        email: 'london@lomashwood.com',
        phone: '+44 20 7123 4569',
        openingHours: {
          monday: '9:00 - 18:00',
          tuesday: '9:00 - 18:00',
          wednesday: '9:00 - 18:00',
          thursday: '9:00 - 18:00',
          friday: '9:00 - 18:00',
          saturday: '10:00 - 17:00',
          sunday: 'Closed',
        },
        mapUrl: 'https://maps.google.com/?q=lomashwood+london',
        coordinates: { lat: 51.5074, lng: -0.1278 },
        features: ['Parking', 'Wheelchair Access', 'Coffee Bar'],
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Initialize mock CMS pages
    this.cmsPages = [
      {
        id: uuidv4(),
        title: 'About Us',
        slug: 'about-us',
        content: 'We are Lomash Wood, your trusted partner for quality furniture...',
        template: 'default',
        status: 'PUBLISHED',
        seoTitle: 'About Us | Lomash Wood',
        seoDescription: 'Learn more about Lomash Wood and our commitment to quality furniture.',
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}
