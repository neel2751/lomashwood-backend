import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from './entities/blog.entity';
import { BlogCategory } from './entities/blog-category.entity';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
    @InjectRepository(BlogCategory)
    private readonly blogCategoryRepository: Repository<BlogCategory>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
    category?: string;
    author?: string;
    featured?: boolean;
    search?: string;
  }): Promise<{ blogs: Blog[]; total: number; page: number; limit: number }> {
    const { page, limit, status, category, author, featured, search } = params;
    const skip = (page - 1) * limit;

    const query = this.blogRepository.createQueryBuilder('blog')
      .leftJoinAndSelect('blog.category', 'category')
      .leftJoinAndSelect('blog.author', 'author');

    if (status) {
      query.andWhere('blog.status = :status', { status });
    }

    if (category) {
      query.andWhere('blog.categoryId = :category', { category });
    }

    if (author) {
      query.andWhere('blog.authorId = :author', { author });
    }

    if (featured !== undefined) {
      query.andWhere('blog.featured = :featured', { featured });
    }

    if (search) {
      query.andWhere('(blog.title ILIKE :search OR blog.content ILIKE :search OR blog.excerpt ILIKE :search)', 
        { search: `%${search}%` });
    }

    const [blogs, total] = await query
      .orderBy('blog.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      blogs,
      total,
      page,
      limit,
    };
  }

  async findPublished(params: {
    page: number;
    limit: number;
    category?: string;
    author?: string;
    featured?: boolean;
    search?: string;
  }): Promise<{ blogs: Blog[]; total: number; page: number; limit: number }> {
    const { page, limit, category, author, featured, search } = params;
    const skip = (page - 1) * limit;

    const query = this.blogRepository.createQueryBuilder('blog')
      .leftJoinAndSelect('blog.category', 'category')
      .leftJoinAndSelect('blog.author', 'author')
      .where('blog.status = :status', { status: 'PUBLISHED' });

    if (category) {
      query.andWhere('blog.categoryId = :category', { category });
    }

    if (author) {
      query.andWhere('blog.authorId = :author', { author });
    }

    if (featured !== undefined) {
      query.andWhere('blog.featured = :featured', { featured });
    }

    if (search) {
      query.andWhere('(blog.title ILIKE :search OR blog.content ILIKE :search OR blog.excerpt ILIKE :search)', 
        { search: `%${search}%` });
    }

    const [blogs, total] = await query
      .orderBy('blog.publishedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      blogs,
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<Blog | null> {
    return this.blogRepository.findOne({
      where: { id },
      relations: ['category', 'author'],
    });
  }

  async findBySlug(slug: string): Promise<Blog | null> {
    return this.blogRepository.findOne({
      where: { slug },
      relations: ['category', 'author'],
    });
  }

  async create(blogData: Partial<Blog>): Promise<Blog> {
    const blog = this.blogRepository.create(blogData);
    return this.blogRepository.save(blog);
  }

  async update(id: string, updateData: Partial<Blog>): Promise<void> {
    await this.blogRepository.update(id, updateData);
  }

  async remove(id: string): Promise<void> {
    await this.blogRepository.delete(id);
  }

  async incrementView(id: string): Promise<void> {
    await this.blogRepository.increment({ id }, 'viewCount', 1);
  }

  async getCategories(): Promise<BlogCategory[]> {
    return this.blogCategoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getTags(): Promise<string[]> {
    const blogs = await this.blogRepository
      .createQueryBuilder('blog')
      .select('blog.tags')
      .where('blog.status = :status', { status: 'PUBLISHED' })
      .getMany();

    const allTags = blogs.flatMap(blog => blog.tags || []);
    return [...new Set(allTags)].sort();
  }

  async getPopular(limit: number = 10, category?: string): Promise<Blog[]> {
    const query = this.blogRepository.createQueryBuilder('blog')
      .leftJoinAndSelect('blog.category', 'category')
      .leftJoinAndSelect('blog.author', 'author')
      .where('blog.status = :status', { status: 'PUBLISHED' })
      .orderBy('blog.viewCount', 'DESC')
      .take(limit);

    if (category) {
      query.andWhere('blog.categoryId = :category', { category });
    }

    return query.getMany();
  }

  async getRecent(limit: number = 10, category?: string): Promise<Blog[]> {
    const query = this.blogRepository.createQueryBuilder('blog')
      .leftJoinAndSelect('blog.category', 'category')
      .leftJoinAndSelect('blog.author', 'author')
      .where('blog.status = :status', { status: 'PUBLISHED' })
      .orderBy('blog.publishedAt', 'DESC')
      .take(limit);

    if (category) {
      query.andWhere('blog.categoryId = :category', { category });
    }

    return query.getMany();
  }

  async getRelated(blog: Blog, limit: number = 5): Promise<Blog[]> {
    return this.blogRepository.createQueryBuilder('blog')
      .leftJoinAndSelect('blog.category', 'category')
      .leftJoinAndSelect('blog.author', 'author')
      .where('blog.status = :status', { status: 'PUBLISHED' })
      .andWhere('blog.id != :id', { id: blog.id })
      .andWhere('(blog.categoryId = :categoryId OR blog.tags && :tags)', {
        categoryId: blog.categoryId,
        tags: blog.tags || [],
      })
      .orderBy('blog.viewCount', 'DESC')
      .take(limit)
      .getMany();
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
    mostPopular: Blog[];
  }> {
    const query = this.blogRepository.createQueryBuilder('blog')
      .leftJoinAndSelect('blog.category', 'category')
      .leftJoinAndSelect('blog.author', 'author');

    if (startDate) {
      query.andWhere('blog.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('blog.createdAt <= :endDate', { endDate });
    }

    if (author) {
      query.andWhere('blog.authorId = :author', { author });
    }

    const blogs = await query.getMany();

    const totalBlogs = blogs.length;
    const publishedBlogs = blogs.filter(b => b.status === 'PUBLISHED').length;
    const draftBlogs = blogs.filter(b => b.status === 'DRAFT').length;

    const totalViews = blogs.reduce((sum, blog) => sum + (blog.viewCount || 0), 0);
    const averageViews = totalBlogs > 0 ? totalViews / totalBlogs : 0;

    const categoryBreakdown = blogs.reduce((acc, blog) => {
      const categoryName = blog.category?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const authorBreakdown = blogs.reduce((acc, blog) => {
      const authorName = blog.author?.name || 'Unknown';
      acc[authorName] = (acc[authorName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostPopular = blogs
      .filter(b => b.status === 'PUBLISHED')
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 5);

    return {
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalViews,
      averageViews,
      categoryBreakdown,
      authorBreakdown,
      mostPopular,
    };
  }

  async findByAuthor(authorId: string, limit: number = 10): Promise<Blog[]> {
    return this.blogRepository.find({
      where: { authorId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByCategory(categoryId: string, limit: number = 10): Promise<Blog[]> {
    return this.blogRepository.find({
      where: { categoryId, status: 'PUBLISHED' },
      relations: ['author'],
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }

  async searchByTags(tags: string[], limit: number = 10): Promise<Blog[]> {
    return this.blogRepository.createQueryBuilder('blog')
      .leftJoinAndSelect('blog.category', 'category')
      .leftJoinAndSelect('blog.author', 'author')
      .where('blog.status = :status', { status: 'PUBLISHED' })
      .andWhere('blog.tags && :tags', { tags })
      .orderBy('blog.publishedAt', 'DESC')
      .take(limit)
      .getMany();
  }
}
