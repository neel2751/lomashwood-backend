import { Injectable } from '@nestjs/common';
import { BlogsRepository } from './blogs.repository';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogsService {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
    category?: string;
    author?: string;
    featured?: boolean;
    search?: string;
  }): Promise<{ blogs: any[]; total: number; page: number; limit: number }> {
    return this.blogsRepository.findAll(params);
  }

  async findPublished(params: {
    page: number;
    limit: number;
    category?: string;
    author?: string;
    featured?: boolean;
    search?: string;
  }): Promise<{ blogs: any[]; total: number; page: number; limit: number }> {
    return this.blogsRepository.findPublished(params);
  }

  async findById(id: string): Promise<any | null> {
    return this.blogsRepository.findById(id);
  }

  async findBySlug(slug: string): Promise<any | null> {
    return this.blogsRepository.findBySlug(slug);
  }

  async create(createBlogDto: CreateBlogDto): Promise<any> {
    const blog = await this.blogsRepository.create({
      ...createBlogDto,
      slug: this.generateSlug(createBlogDto.title),
      status: 'DRAFT',
    });
    return this.findById(blog.id);
  }

  async update(id: string, updateBlogDto: UpdateBlogDto): Promise<any | null> {
    const blog = await this.findById(id);
    if (!blog) {
      return null;
    }

    // Update slug if title changed
    if (updateBlogDto.title && updateBlogDto.title !== blog.title) {
      updateBlogDto.slug = this.generateSlug(updateBlogDto.title);
    }

    await this.blogsRepository.update(id, {
      ...updateBlogDto,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async remove(id: string): Promise<any | null> {
    const blog = await this.findById(id);
    if (!blog) {
      return null;
    }

    await this.blogsRepository.remove(id);
    return blog;
  }

  async publish(id: string, userId?: string): Promise<any | null> {
    const blog = await this.findById(id);
    if (!blog) {
      return null;
    }

    await this.blogsRepository.update(id, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      publishedBy: userId,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async unpublish(id: string, userId?: string): Promise<any | null> {
    const blog = await this.findById(id);
    if (!blog) {
      return null;
    }

    await this.blogsRepository.update(id, {
      status: 'DRAFT',
      publishedAt: null,
      publishedBy: null,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async feature(id: string, featured: boolean): Promise<any | null> {
    const blog = await this.findById(id);
    if (!blog) {
      return null;
    }

    await this.blogsRepository.update(id, {
      featured,
      featuredAt: featured ? new Date() : null,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async getCategories(): Promise<any[]> {
    return this.blogsRepository.getCategories();
  }

  async getTags(): Promise<string[]> {
    return this.blogsRepository.getTags();
  }

  async getPopular(limit: number = 10, category?: string): Promise<any[]> {
    return this.blogsRepository.getPopular(limit, category);
  }

  async getRecent(limit: number = 10, category?: string): Promise<any[]> {
    return this.blogsRepository.getRecent(limit, category);
  }

  async getRelated(id: string, limit: number = 5): Promise<any[]> {
    const blog = await this.findById(id);
    if (!blog) {
      return [];
    }

    return this.blogsRepository.getRelated(blog, limit);
  }

  async incrementView(id: string): Promise<any | null> {
    const blog = await this.findById(id);
    if (!blog) {
      return null;
    }

    await this.blogsRepository.incrementView(id);
    return this.findById(id);
  }

  async getStats(
    startDate?: Date,
    endDate?: Date,
    author?: string
  ): Promise<{
    totalBlogs: number;
    publishedBlogs: number;
    draftBlogs: number;
    totalViews: number;
    averageViews: number;
    categoryBreakdown: Record<string, number>;
    authorBreakdown: Record<string, number>;
    mostPopular: any[];
  }> {
    return this.blogsRepository.getStats(startDate, endDate, author);
  }

  async bulkUpdate(blogIds: string[], updateData: UpdateBlogDto): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    for (const blogId of blogIds) {
      const blog = await this.findById(blogId);
      if (blog) {
        await this.blogsRepository.update(blogId, {
          ...updateData,
          updatedAt: new Date(),
        });
        updated++;
      } else {
        failed++;
      }
    }

    return { updated, failed };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
