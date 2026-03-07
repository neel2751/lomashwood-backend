import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeoMeta } from './entities/seo-meta.entity';
import { UpdateSeoDto } from './dto/update-seo.dto';

@Injectable()
export class SeoService {
  constructor(
    @InjectRepository(SeoMeta)
    private readonly seoMetaRepository: Repository<SeoMeta>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    entityType?: string;
    entityId?: string;
    search?: string;
  }): Promise<{ seoMeta: SeoMeta[]; total: number; page: number; limit: number }> {
    const { page, limit, entityType, entityId, search } = params;
    const skip = (page - 1) * limit;

    const query = this.seoMetaRepository.createQueryBuilder('seoMeta');

    if (entityType) {
      query.andWhere('seoMeta.entityType = :entityType', { entityType });
    }

    if (entityId) {
      query.andWhere('seoMeta.entityId = :entityId', { entityId });
    }

    if (search) {
      query.andWhere('(seoMeta.title ILIKE :search OR seoMeta.description ILIKE :search OR seoMeta.keywords ILIKE :search)', 
        { search: `%${search}%` });
    }

    const [seoMeta, total] = await query
      .orderBy('seoMeta.updatedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      seoMeta,
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<SeoMeta | null> {
    return this.seoMetaRepository.findOne({ where: { id } });
  }

  async findByEntity(entityType: string, entityId: string): Promise<SeoMeta | null> {
    return this.seoMetaRepository.findOne({ 
      where: { entityType, entityId } 
    });
  }

  async create(updateSeoDto: UpdateSeoDto): Promise<SeoMeta> {
    const seoMeta = this.seoMetaRepository.create(updateSeoDto);
    return this.seoMetaRepository.save(seoMeta);
  }

  async update(id: string, updateSeoDto: UpdateSeoDto): Promise<SeoMeta | null> {
    const seoMeta = await this.findById(id);
    if (!seoMeta) {
      return null;
    }

    await this.seoMetaRepository.update(id, {
      ...updateSeoDto,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async updateByEntity(entityType: string, entityId: string, updateSeoDto: UpdateSeoDto): Promise<SeoMeta | null> {
    const seoMeta = await this.findByEntity(entityType, entityId);
    if (!seoMeta) {
      // Create new SEO metadata if it doesn't exist
      return this.create({
        ...updateSeoDto,
        entityType,
        entityId,
      });
    }

    await this.seoMetaRepository.update(seoMeta.id, {
      ...updateSeoDto,
      updatedAt: new Date(),
    });

    return this.findByEntity(entityType, entityId);
  }

  async remove(id: string): Promise<SeoMeta | null> {
    const seoMeta = await this.findById(id);
    if (!seoMeta) {
      return null;
    }

    await this.seoMetaRepository.delete(id);
    return seoMeta;
  }

  async generateSitemap(domain?: string, includeImages?: boolean): Promise<string> {
    const seoMeta = await this.seoMetaRepository.find({
      where: { status: 'ACTIVE' },
      order: { priority: 'DESC', updatedAt: 'DESC' },
    });

    const baseUrl = domain || 'https://lomashwood.com';
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const meta of seoMeta) {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${baseUrl}/${meta.entityType}/${meta.entityId}</loc>\n`;
      sitemap += `    <lastmod>${meta.updatedAt.toISOString()}</lastmod>\n`;
      sitemap += `    <changefreq>${meta.changeFrequency || 'weekly'}</changefreq>\n`;
      sitemap += `    <priority>${meta.priority || 0.5}</priority>\n`;

      if (includeImages && meta.images && meta.images.length > 0) {
        for (const image of meta.images) {
          sitemap += '    <image:image>\n';
          sitemap += `      <image:loc>${image.url}</image:loc>\n`;
          if (image.title) {
            sitemap += `      <image:title>${image.title}</image:title>\n`;
          }
          if (image.caption) {
            sitemap += `      <image:caption>${image.caption}</image:caption>\n`;
          }
          sitemap += '    </image:image>\n';
        }
      }

      sitemap += '  </url>\n';
    }

    sitemap += '</urlset>';
    return sitemap;
  }

  async generateRobots(domain?: string, allowAll?: boolean): Promise<string> {
    const baseUrl = domain || 'https://lomashwood.com';
    
    let robots = 'User-agent: *\n';
    
    if (allowAll) {
      robots += 'Allow: /\n';
    } else {
      robots += 'Disallow: /admin/\n';
      robots += 'Disallow: /api/\n';
      robots += 'Disallow: /private/\n';
      robots += 'Allow: /\n';
    }
    
    robots += `\nSitemap: ${baseUrl}/sitemap.xml\n`;
    robots += `Crawl-delay: 1\n`;
    
    return robots;
  }

  async generateSchema(type: string, data: any): Promise<any> {
    const schemas: Record<string, any> = {
      'WebPage': {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: data.title,
        description: data.description,
        url: data.url,
        image: data.images?.map((img: any) => img.url),
        datePublished: data.publishedAt,
        dateModified: data.updatedAt,
        author: {
          '@type': 'Organization',
          name: 'Lomash Wood',
          url: 'https://lomashwood.com'
        }
      },
      'Product': {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: data.title,
        description: data.description,
        image: data.images?.map((img: any) => img.url),
        brand: {
          '@type': 'Brand',
          name: 'Lomash Wood'
        },
        offers: {
          '@type': 'Offer',
          price: data.price,
          priceCurrency: data.currency || 'USD',
          availability: data.availability || 'https://schema.org/InStock'
        }
      },
      'Article': {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.title,
        description: data.description,
        image: data.images?.map((img: any) => img.url),
        datePublished: data.publishedAt,
        dateModified: data.updatedAt,
        author: {
          '@type': 'Person',
          name: data.author
        },
        publisher: {
          '@type': 'Organization',
          name: 'Lomash Wood'
        }
      },
      'LocalBusiness': {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: data.name,
        description: data.description,
        address: data.address,
        telephone: data.phone,
        email: data.email,
        website: data.website,
        openingHours: data.openingHours,
        geo: data.geo
      }
    };

    return schemas[type] || null;
  }

  async analyze(url?: string, entityType?: string, entityId?: string): Promise<any> {
    let seoMeta: SeoMeta | null = null;

    if (entityType && entityId) {
      seoMeta = await this.findByEntity(entityType, entityId);
    }

    const analysis = {
      title: {
        length: seoMeta?.title?.length || 0,
        optimal: seoMeta?.title?.length >= 30 && seoMeta?.title?.length <= 60,
        suggestions: this.getTitleSuggestions(seoMeta?.title)
      },
      description: {
        length: seoMeta?.description?.length || 0,
        optimal: seoMeta?.description?.length >= 120 && seoMeta?.description?.length <= 160,
        suggestions: this.getDescriptionSuggestions(seoMeta?.description)
      },
      keywords: {
        count: seoMeta?.keywords?.length || 0,
        density: this.calculateKeywordDensity(seoMeta?.keywords, seoMeta?.description),
        suggestions: this.getKeywordSuggestions(seoMeta?.keywords)
      },
      images: {
        count: seoMeta?.images?.length || 0,
        withAlt: seoMeta?.images?.filter((img: any) => img.alt).length || 0,
        suggestions: this.getImageSuggestions(seoMeta?.images)
      },
      meta: {
        hasCanonical: !!seoMeta?.canonicalUrl,
        hasOpenGraph: !!seoMeta?.openGraph,
        hasTwitterCard: !!seoMeta?.twitterCard,
        hasSchema: !!seoMeta?.schemaMarkup,
        score: this.calculateSeoScore(seoMeta)
      }
    };

    return analysis;
  }

  async getKeywordSuggestions(query: string, limit: number = 10): Promise<string[]> {
    // This would typically integrate with an external keyword research API
    // For now, returning mock suggestions based on the query
    const suggestions = [
      `${query} furniture`,
      `${query} wooden`,
      `${query} custom`,
      `${query} design`,
      `${query} modern`,
      `${query} luxury`,
      `${query} handcrafted`,
      `${query} sustainable`,
      `${query} eco-friendly`
    ];

    return suggestions.slice(0, limit);
  }

  async getAnalytics(
    startDate?: Date,
    endDate?: Date,
    entityType?: string
  ): Promise<{
    totalSeoMeta: number;
    activeSeoMeta: number;
    averageScore: number;
    typeBreakdown: Record<string, number>;
    topPerforming: SeoMeta[];
    recentUpdates: SeoMeta[];
  }> {
    const query = this.seoMetaRepository.createQueryBuilder('seoMeta');

    if (startDate) {
      query.andWhere('seoMeta.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('seoMeta.createdAt <= :endDate', { endDate });
    }

    if (entityType) {
      query.andWhere('seoMeta.entityType = :entityType', { entityType });
    }

    const seoMetaList = await query.getMany();

    const totalSeoMeta = seoMetaList.length;
    const activeSeoMeta = seoMetaList.filter(s => s.status === 'ACTIVE').length;

    const scores = seoMetaList.map(s => this.calculateSeoScore(s));
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const typeBreakdown = seoMetaList.reduce((acc, item) => {
      acc[item.entityType] = (acc[item.entityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPerforming = seoMetaList
      .sort((a, b) => this.calculateSeoScore(b) - this.calculateSeoScore(a))
      .slice(0, 5);

    const recentUpdates = seoMetaList
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);

    return {
      totalSeoMeta,
      activeSeoMeta,
      averageScore,
      typeBreakdown,
      topPerforming,
      recentUpdates,
    };
  }

  async bulkUpdate(ids: string[], updateData: UpdateSeoDto): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    for (const id of ids) {
      const seoMeta = await this.findById(id);
      if (seoMeta) {
        await this.seoMetaRepository.update(id, {
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

  async validate(seoData: UpdateSeoDto): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    score: number;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!seoData.title || seoData.title.trim().length === 0) {
      errors.push('Title is required');
    } else if (seoData.title.length < 30) {
      warnings.push('Title is too short (recommended: 30-60 characters)');
    } else if (seoData.title.length > 60) {
      warnings.push('Title is too long (recommended: 30-60 characters)');
    }

    if (!seoData.description || seoData.description.trim().length === 0) {
      errors.push('Description is required');
    } else if (seoData.description.length < 120) {
      warnings.push('Description is too short (recommended: 120-160 characters)');
    } else if (seoData.description.length > 160) {
      warnings.push('Description is too long (recommended: 120-160 characters)');
    }

    if (seoData.keywords && seoData.keywords.length > 10) {
      warnings.push('Too many keywords (recommended: 5-10 keywords)');
    }

    const score = this.calculateSeoScore(seoData as SeoMeta);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
    };
  }

  async exportToCsv(
    entityType?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const query = this.seoMetaRepository.createQueryBuilder('seoMeta');

    if (entityType) {
      query.andWhere('seoMeta.entityType = :entityType', { entityType });
    }

    if (startDate) {
      query.andWhere('seoMeta.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('seoMeta.createdAt <= :endDate', { endDate });
    }

    const seoMetaList = await query.getMany();

    const headers = [
      'ID', 'Entity Type', 'Entity ID', 'Title', 'Description', 'Keywords',
      'Canonical URL', 'Status', 'Priority', 'Change Frequency',
      'Created At', 'Updated At'
    ];

    const csvRows = [headers.join(',')];

    for (const meta of seoMetaList) {
      const row = [
        meta.id,
        meta.entityType,
        meta.entityId,
        `"${this.escapeCsv(meta.title)}"`,
        `"${this.escapeCsv(meta.description)}"`,
        `"${meta.keywords?.join(';') || ''}"`,
        meta.canonicalUrl || '',
        meta.status,
        meta.priority || 0.5,
        meta.changeFrequency || 'weekly',
        meta.createdAt.toISOString(),
        meta.updatedAt.toISOString()
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  private getTitleSuggestions(title?: string): string[] {
    const suggestions: string[] = [];
    if (!title) {
      suggestions.push('Add a descriptive title');
      return suggestions;
    }

    if (title.length < 30) {
      suggestions.push('Make title more descriptive');
    }
    if (title.length > 60) {
      suggestions.push('Shorten title to under 60 characters');
    }
    if (!title.includes('Lomash Wood')) {
      suggestions.push('Consider including brand name');
    }

    return suggestions;
  }

  private getDescriptionSuggestions(description?: string): string[] {
    const suggestions: string[] = [];
    if (!description) {
      suggestions.push('Add a compelling description');
      return suggestions;
    }

    if (description.length < 120) {
      suggestions.push('Make description more detailed');
    }
    if (description.length > 160) {
      suggestions.push('Shorten description to under 160 characters');
    }

    return suggestions;
  }

  private getKeywordSuggestions(keywords?: string[]): string[] {
    const suggestions: string[] = [];
    if (!keywords || keywords.length === 0) {
      suggestions.push('Add relevant keywords');
      return suggestions;
    }

    if (keywords.length < 3) {
      suggestions.push('Add more relevant keywords');
    }
    if (keywords.length > 10) {
      suggestions.push('Reduce number of keywords');
    }

    return suggestions;
  }

  private getImageSuggestions(images?: any[]): string[] {
    const suggestions: string[] = [];
    if (!images || images.length === 0) {
      suggestions.push('Add relevant images');
      return suggestions;
    }

    const withoutAlt = images.filter(img => !img.alt);
    if (withoutAlt.length > 0) {
      suggestions.push('Add alt text to all images');
    }

    return suggestions;
  }

  private calculateKeywordDensity(keywords?: string[], description?: string): number {
    if (!keywords || !description) return 0;

    const words = description.toLowerCase().split(/\s+/);
    const keywordCount = keywords.reduce((count, keyword) => {
      const regex = new RegExp(keyword.toLowerCase(), 'gi');
      const matches = description.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);

    return words.length > 0 ? (keywordCount / words.length) * 100 : 0;
  }

  private calculateSeoScore(seoMeta?: SeoMeta | null): number {
    if (!seoMeta) return 0;

    let score = 0;

    // Title score (30%)
    if (seoMeta.title) {
      if (seoMeta.title.length >= 30 && seoMeta.title.length <= 60) {
        score += 30;
      } else if (seoMeta.title.length > 0) {
        score += 15;
      }
    }

    // Description score (25%)
    if (seoMeta.description) {
      if (seoMeta.description.length >= 120 && seoMeta.description.length <= 160) {
        score += 25;
      } else if (seoMeta.description.length > 0) {
        score += 12;
      }
    }

    // Keywords score (15%)
    if (seoMeta.keywords && seoMeta.keywords.length > 0) {
      if (seoMeta.keywords.length >= 3 && seoMeta.keywords.length <= 10) {
        score += 15;
      } else {
        score += 7;
      }
    }

    // Meta tags score (20%)
    if (seoMeta.canonicalUrl) score += 5;
    if (seoMeta.openGraph) score += 5;
    if (seoMeta.twitterCard) score += 5;
    if (seoMeta.schemaMarkup) score += 5;

    // Images score (10%)
    if (seoMeta.images && seoMeta.images.length > 0) {
      const withAlt = seoMeta.images.filter(img => img.alt).length;
      const imageScore = (withAlt / seoMeta.images.length) * 10;
      score += imageScore;
    }

    return Math.min(100, score);
  }

  private escapeCsv(value: string): string {
    return value.replace(/"/g, '""');
  }
}
