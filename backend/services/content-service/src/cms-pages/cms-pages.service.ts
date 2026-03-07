import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CmsPage } from './entities/cms-page.entity';
import { CreateCmsPageDto } from './dto/create-cms-page.dto';
import { UpdateCmsPageDto } from './dto/update-cms-page.dto';

@Injectable()
export class CmsPagesService {
  constructor(
    @InjectRepository(CmsPage)
    private readonly cmsPageRepository: Repository<CmsPage>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
    type?: string;
    search?: string;
  }): Promise<{ pages: CmsPage[]; total: number; page: number; limit: number }> {
    const { page, limit, status, type, search } = params;
    const skip = (page - 1) * limit;

    const query = this.cmsPageRepository.createQueryBuilder('page');

    if (status) {
      query.andWhere('page.status = :status', { status });
    }

    if (type) {
      query.andWhere('page.type = :type', { type });
    }

    if (search) {
      query.andWhere('(page.title ILIKE :search OR page.content ILIKE :search OR page.description ILIKE :search)', 
        { search: `%${search}%` });
    }

    const [pages, total] = await query
      .orderBy('page.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      pages,
      total,
      page,
      limit,
    };
  }

  async findPublished(params: {
    page: number;
    limit: number;
    type?: string;
    search?: string;
  }): Promise<{ pages: CmsPage[]; total: number; page: number; limit: number }> {
    const { page, limit, type, search } = params;
    const skip = (page - 1) * limit;

    const query = this.cmsPageRepository.createQueryBuilder('page')
      .where('page.status = :status', { status: 'PUBLISHED' });

    if (type) {
      query.andWhere('page.type = :type', { type });
    }

    if (search) {
      query.andWhere('(page.title ILIKE :search OR page.content ILIKE :search OR page.description ILIKE :search)', 
        { search: `%${search}%` });
    }

    const [pages, total] = await query
      .orderBy('page.publishedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      pages,
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<CmsPage | null> {
    return this.cmsPageRepository.findOne({ where: { id } });
  }

  async findBySlug(slug: string): Promise<CmsPage | null> {
    return this.cmsPageRepository.findOne({ where: { slug } });
  }

  async create(createCmsPageDto: CreateCmsPageDto): Promise<CmsPage> {
    const page = this.cmsPageRepository.create({
      ...createCmsPageDto,
      slug: this.generateSlug(createCmsPageDto.title),
      status: 'DRAFT',
    });
    return this.cmsPageRepository.save(page);
  }

  async update(id: string, updateCmsPageDto: UpdateCmsPageDto): Promise<CmsPage | null> {
    const page = await this.findById(id);
    if (!page) {
      return null;
    }

    // Update slug if title changed
    if (updateCmsPageDto.title && updateCmsPageDto.title !== page.title) {
      updateCmsPageDto.slug = this.generateSlug(updateCmsPageDto.title);
    }

    await this.cmsPageRepository.update(id, {
      ...updateCmsPageDto,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async remove(id: string): Promise<CmsPage | null> {
    const page = await this.findById(id);
    if (!page) {
      return null;
    }

    await this.cmsPageRepository.delete(id);
    return page;
  }

  async publish(id: string, userId?: string): Promise<CmsPage | null> {
    const page = await this.findById(id);
    if (!page) {
      return null;
    }

    await this.cmsPageRepository.update(id, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      publishedBy: userId,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async unpublish(id: string, userId?: string): Promise<CmsPage | null> {
    const page = await this.findById(id);
    if (!page) {
      return null;
    }

    await this.cmsPageRepository.update(id, {
      status: 'DRAFT',
      publishedAt: null,
      publishedBy: null,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async duplicate(id: string, duplicateData: {
    title?: string;
    slug?: string;
    duplicatedBy: string;
  }): Promise<CmsPage | null> {
    const originalPage = await this.findById(id);
    if (!originalPage) {
      return null;
    }

    const newPage = this.cmsPageRepository.create({
      title: duplicateData.title || `Copy of ${originalPage.title}`,
      slug: duplicateData.slug || this.generateSlug(duplicateData.title || `Copy of ${originalPage.title}`),
      description: originalPage.description,
      content: originalPage.content,
      type: originalPage.type,
      template: originalPage.template,
      metadata: originalPage.metadata,
      seoTitle: originalPage.seoTitle,
      seoDescription: originalPage.seoDescription,
      seoKeywords: originalPage.seoKeywords,
      canonicalUrl: originalPage.canonicalUrl,
      openGraph: originalPage.openGraph,
      twitterCard: originalPage.twitterCard,
      schemaMarkup: originalPage.schemaMarkup,
      language: originalPage.language,
      region: originalPage.region,
      status: 'DRAFT',
      duplicatedFrom: id,
      duplicatedBy: duplicateData.duplicatedBy,
      duplicatedAt: new Date(),
    });

    return this.cmsPageRepository.save(newPage);
  }

  async getTypes(): Promise<string[]> {
    // This would typically fetch from a predefined list or database
    return [
      'HOME',
      'ABOUT',
      'CONTACT',
      'PRODUCTS',
      'SERVICES',
      'BLOG',
      'GALLERY',
      'FAQ',
      'TERMS',
      'PRIVACY',
      'CUSTOM',
    ];
  }

  async getTemplates(): Promise<any[]> {
    // This would typically fetch from a predefined list or database
    return [
      {
        id: 'default',
        name: 'Default',
        description: 'Default page template',
        preview: '/templates/default-preview.jpg',
      },
      {
        id: 'landing',
        name: 'Landing Page',
        description: 'Marketing landing page template',
        preview: '/templates/landing-preview.jpg',
      },
      {
        id: 'blog',
        name: 'Blog Post',
        description: 'Blog post template',
        preview: '/templates/blog-preview.jpg',
      },
      {
        id: 'contact',
        name: 'Contact Page',
        description: 'Contact page template',
        preview: '/templates/contact-preview.jpg',
      },
    ];
  }

  async getNavigation(): Promise<any[]> {
    const pages = await this.cmsPageRepository.find({
      where: { status: 'PUBLISHED' },
      order: { sortOrder: 'ASC', title: 'ASC' },
    });

    return pages.map(page => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      type: page.type,
      parentId: page.parentId,
      sortOrder: page.sortOrder,
      isExternal: false,
      url: `/${page.slug}`,
    }));
  }

  async getSitemap(): Promise<any[]> {
    const pages = await this.cmsPageRepository.find({
      where: { status: 'PUBLISHED' },
      select: ['id', 'title', 'slug', 'updatedAt', 'publishedAt'],
      order: { publishedAt: 'DESC' },
    });

    return pages.map(page => ({
      url: `/${page.slug}`,
      lastmod: page.updatedAt || page.publishedAt,
      changefreq: this.getChangeFrequency(page),
      priority: this.getPriority(page),
    }));
  }

  async incrementView(id: string): Promise<CmsPage | null> {
    const page = await this.findById(id);
    if (!page) {
      return null;
    }

    await this.cmsPageRepository.increment({ id }, 'viewCount', 1);
    return this.findById(id);
  }

  async getStats(
    startDate?: Date,
    endDate?: Date,
    type?: string
  ): Promise<{
    totalPages: number;
    publishedPages: number;
    draftPages: number;
    totalViews: number;
    averageViews: number;
    typeBreakdown: Record<string, number>;
    mostPopular: CmsPage[];
  }> {
    const query = this.cmsPageRepository.createQueryBuilder('page');

    if (startDate) {
      query.andWhere('page.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('page.createdAt <= :endDate', { endDate });
    }

    if (type) {
      query.andWhere('page.type = :type', { type });
    }

    const pages = await query.getMany();

    const totalPages = pages.length;
    const publishedPages = pages.filter(p => p.status === 'PUBLISHED').length;
    const draftPages = pages.filter(p => p.status === 'DRAFT').length;

    const totalViews = pages.reduce((sum, page) => sum + (page.viewCount || 0), 0);
    const averageViews = totalPages > 0 ? totalViews / totalPages : 0;

    const typeBreakdown = pages.reduce((acc, page) => {
      acc[page.type] = (acc[page.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostPopular = pages
      .filter(p => p.status === 'PUBLISHED')
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 5);

    return {
      totalPages,
      publishedPages,
      draftPages,
      totalViews,
      averageViews,
      typeBreakdown,
      mostPopular,
    };
  }

  async bulkUpdate(pageIds: string[], updateData: UpdateCmsPageDto): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    for (const pageId of pageIds) {
      const page = await this.findById(pageId);
      if (page) {
        await this.cmsPageRepository.update(pageId, {
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

  async bulkPublish(pageIds: string[], userId?: string): Promise<{ published: number; failed: number }> {
    let published = 0;
    let failed = 0;

    for (const pageId of pageIds) {
      const page = await this.publish(pageId, userId);
      if (page) {
        published++;
      } else {
        failed++;
      }
    }

    return { published, failed };
  }

  async bulkUnpublish(pageIds: string[], userId?: string): Promise<{ unpublished: number; failed: number }> {
    let unpublished = 0;
    let failed = 0;

    for (const pageId of pageIds) {
      const page = await this.unpublish(pageId, userId);
      if (page) {
        unpublished++;
      } else {
        failed++;
      }
    }

    return { unpublished, failed };
  }

  async findByType(type: string, limit: number = 10): Promise<CmsPage[]> {
    return this.cmsPageRepository.find({
      where: { type, status: 'PUBLISHED' },
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }

  async findByParent(parentId: string, limit: number = 10): Promise<CmsPage[]> {
    return this.cmsPageRepository.find({
      where: { parentId, status: 'PUBLISHED' },
      order: { sortOrder: 'ASC', title: 'ASC' },
      take: limit,
    });
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private getChangeFrequency(page: CmsPage): string {
    const daysSinceUpdate = Math.floor((Date.now() - page.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceUpdate < 7) return 'daily';
    if (daysSinceUpdate < 30) return 'weekly';
    if (daysSinceUpdate < 90) return 'monthly';
    return 'yearly';
  }

  private getPriority(page: CmsPage): number {
    switch (page.type) {
      case 'HOME': return 1.0;
      case 'ABOUT': return 0.9;
      case 'PRODUCTS': return 0.9;
      case 'SERVICES': return 0.9;
      case 'CONTACT': return 0.8;
      case 'BLOG': return 0.7;
      case 'FAQ': return 0.6;
      default: return 0.5;
    }
  }
}
