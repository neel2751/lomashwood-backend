export enum BlogStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  status: BlogStatus;
  publishedAt: Date | null;
  authorId: string;
  categoryId: string | null;
  isFeatured: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category?: BlogCategory | null;
  tags?: BlogTag[];
}

export interface BlogSummaryDto {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  status: BlogStatus;
  publishedAt: string | null;
  isFeatured: boolean;
  category: Pick<BlogCategory, 'id' | 'name' | 'slug'> | null;
  tags: Pick<BlogTag, 'id' | 'name' | 'slug'>[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogDetailDto extends BlogSummaryDto {
  content: string;
  authorId: string;
}

export interface BlogCategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
}

export interface CreateBlogPayload {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  status?: BlogStatus;
  categoryId?: string;
  tagIds?: string[];
  isFeatured?: boolean;
  authorId: string;
}

export interface UpdateBlogPayload {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  status?: BlogStatus;
  categoryId?: string | null;
  tagIds?: string[];
  isFeatured?: boolean;
}

export interface BlogListQuery {
  page: number;
  limit: number;
  status?: BlogStatus;
  categoryId?: string;
  tagId?: string;
  isFeatured?: boolean;
  search?: string;
  sortBy?: 'publishedAt' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedBlogResult {
  data: BlogSummaryDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface BlogRepository {
  findAll(query: BlogListQuery): Promise<PaginatedBlogResult>;
  findById(id: string): Promise<Blog | null>;
  findBySlug(slug: string): Promise<Blog | null>;
  findFeatured(limit?: number): Promise<Blog[]>;
  create(payload: CreateBlogPayload): Promise<Blog>;
  update(id: string, payload: UpdateBlogPayload): Promise<Blog>;
  softDelete(id: string): Promise<void>;
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
}

export interface BlogService {
  listBlogs(query: BlogListQuery): Promise<PaginatedBlogResult>;
  getBlogBySlug(slug: string): Promise<BlogDetailDto>;
  getBlogById(id: string): Promise<BlogDetailDto>;
  getFeaturedBlogs(limit?: number): Promise<BlogSummaryDto[]>;
  createBlog(payload: CreateBlogPayload): Promise<BlogDetailDto>;
  updateBlog(id: string, payload: UpdateBlogPayload): Promise<BlogDetailDto>;
  deleteBlog(id: string): Promise<void>;
}