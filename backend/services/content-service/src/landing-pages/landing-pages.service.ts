import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LandingPage } from './entities/landing-page.entity';
import { CreateLandingPageDto } from './dto/create-landing-page.dto';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';

@Injectable()
export class LandingPagesService {
  constructor(
    @InjectRepository(LandingPage)
    private readonly landingPageRepository: Repository<LandingPage>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
    campaign?: string;
    search?: string;
  }): Promise<{ landingPages: LandingPage[]; total: number; page: number; limit: number }> {
    const { page, limit, status, campaign, search } = params;
    const skip = (page - 1) * limit;

    const query = this.landingPageRepository.createQueryBuilder('landingPage');

    if (status) {
      query.andWhere('landingPage.status = :status', { status });
    }

    if (campaign) {
      query.andWhere('landingPage.campaign = :campaign', { campaign });
    }

    if (search) {
      query.andWhere('(landingPage.title ILIKE :search OR landingPage.content ILIKE :search OR landingPage.description ILIKE :search)', 
        { search: `%${search}%` });
    }

    const [landingPages, total] = await query
      .orderBy('landingPage.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      landingPages,
      total,
      page,
      limit,
    };
  }

  async findPublished(params: {
    page: number;
    limit: number;
    campaign?: string;
    search?: string;
  }): Promise<{ landingPages: LandingPage[]; total: number; page: number; limit: number }> {
    const { page, limit, campaign, search } = params;
    const skip = (page - 1) * limit;

    const query = this.landingPageRepository.createQueryBuilder('landingPage')
      .where('landingPage.status = :status', { status: 'PUBLISHED' });

    if (campaign) {
      query.andWhere('landingPage.campaign = :campaign', { campaign });
    }

    if (search) {
      query.andWhere('(landingPage.title ILIKE :search OR landingPage.content ILIKE :search OR landingPage.description ILIKE :search)', 
        { search: `%${search}%` });
    }

    const [landingPages, total] = await query
      .orderBy('landingPage.publishedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      landingPages,
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<LandingPage | null> {
    return this.landingPageRepository.findOne({ where: { id } });
  }

  async findBySlug(slug: string): Promise<LandingPage | null> {
    return this.landingPageRepository.findOne({ where: { slug } });
  }

  async create(createLandingPageDto: CreateLandingPageDto): Promise<LandingPage> {
    const landingPage = this.landingPageRepository.create({
      ...createLandingPageDto,
      slug: this.generateSlug(createLandingPageDto.title),
      status: 'DRAFT',
    });
    return this.landingPageRepository.save(landingPage);
  }

  async update(id: string, updateLandingPageDto: UpdateLandingPageDto): Promise<LandingPage | null> {
    const landingPage = await this.findById(id);
    if (!landingPage) {
      return null;
    }

    // Update slug if title changed
    if (updateLandingPageDto.title && updateLandingPageDto.title !== landingPage.title) {
      updateLandingPageDto.slug = this.generateSlug(updateLandingPageDto.title);
    }

    await this.landingPageRepository.update(id, {
      ...updateLandingPageDto,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async remove(id: string): Promise<LandingPage | null> {
    const landingPage = await this.findById(id);
    if (!landingPage) {
      return null;
    }

    await this.landingPageRepository.delete(id);
    return landingPage;
  }

  async publish(id: string, userId?: string): Promise<LandingPage | null> {
    const landingPage = await this.findById(id);
    if (!landingPage) {
      return null;
    }

    await this.landingPageRepository.update(id, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      publishedBy: userId,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async unpublish(id: string, userId?: string): Promise<LandingPage | null> {
    const landingPage = await this.findById(id);
    if (!landingPage) {
      return null;
    }

    await this.landingPageRepository.update(id, {
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
  }): Promise<LandingPage | null> {
    const originalLandingPage = await this.findById(id);
    if (!originalLandingPage) {
      return null;
    }

    const newLandingPage = this.landingPageRepository.create({
      title: duplicateData.title || `Copy of ${originalLandingPage.title}`,
      slug: duplicateData.slug || this.generateSlug(duplicateData.title || `Copy of ${originalLandingPage.title}`),
      description: originalLandingPage.description,
      content: originalLandingPage.content,
      template: originalLandingPage.template,
      campaign: originalLandingPage.campaign,
      metadata: originalLandingPage.metadata,
      seoTitle: originalLandingPage.seoTitle,
      seoDescription: originalLandingPage.seoDescription,
      seoKeywords: originalLandingPage.seoKeywords,
      canonicalUrl: originalLandingPage.canonicalUrl,
      openGraph: originalLandingPage.openGraph,
      twitterCard: originalLandingPage.twitterCard,
      schemaMarkup: originalLandingPage.schemaMarkup,
      language: originalLandingPage.language,
      region: originalLandingPage.region,
      status: 'DRAFT',
      duplicatedFrom: id,
      duplicatedBy: duplicateData.duplicatedBy,
      duplicatedAt: new Date(),
    });

    return this.landingPageRepository.save(newLandingPage);
  }

  async getCampaigns(): Promise<string[]> {
    const campaigns = await this.landingPageRepository
      .createQueryBuilder('landingPage')
      .select('DISTINCT landingPage.campaign')
      .where('landingPage.campaign IS NOT NULL')
      .getRawMany();

    return campaigns.map(c => c.campaign).filter(Boolean);
  }

  async getTemplates(): Promise<any[]> {
    // This would typically fetch from a predefined list or database
    return [
      {
        id: 'product-launch',
        name: 'Product Launch',
        description: 'Landing page for new product launches',
        preview: '/templates/product-launch-preview.jpg',
      },
      {
        id: 'lead-generation',
        name: 'Lead Generation',
        description: 'Landing page optimized for lead generation',
        preview: '/templates/lead-generation-preview.jpg',
      },
      {
        id: 'event-registration',
        name: 'Event Registration',
        description: 'Landing page for event registrations',
        preview: '/templates/event-registration-preview.jpg',
      },
      {
        id: 'webinar',
        name: 'Webinar',
        description: 'Landing page for webinar registrations',
        preview: '/templates/webinar-preview.jpg',
      },
      {
        id: 'newsletter',
        name: 'Newsletter Signup',
        description: 'Landing page for newsletter signups',
        preview: '/templates/newsletter-preview.jpg',
      },
      {
        id: 'ebook-download',
        name: 'Ebook Download',
        description: 'Landing page for ebook downloads',
        preview: '/templates/ebook-download-preview.jpg',
      },
      {
        id: 'contest',
        name: 'Contest/Giveaway',
        description: 'Landing page for contests and giveaways',
        preview: '/templates/contest-preview.jpg',
      },
    ];
  }

  async getAnalytics(
    id: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    views: number;
    uniqueViews: number;
    conversions: number;
    conversionRate: number;
    avgTimeOnPage: number;
    bounceRate: number;
    trafficSources: Record<string, number>;
    devices: Record<string, number>;
    locations: Record<string, number>;
    dailyStats: Array<{ date: string; views: number; conversions: number }>;
  }> {
    const landingPage = await this.findById(id);
    if (!landingPage) {
      throw new Error('Landing page not found');
    }

    // This would typically integrate with analytics service
    // For now, returning mock analytics data
    return {
      views: landingPage.viewCount || 0,
      uniqueViews: Math.floor((landingPage.viewCount || 0) * 0.7),
      conversions: landingPage.conversionCount || 0,
      conversionRate: landingPage.viewCount > 0 ? ((landingPage.conversionCount || 0) / landingPage.viewCount) * 100 : 0,
      avgTimeOnPage: 180, // 3 minutes average
      bounceRate: 45, // 45% bounce rate
      trafficSources: {
        direct: 40,
        organic: 30,
        social: 20,
        referral: 10,
      },
      devices: {
        desktop: 60,
        mobile: 35,
        tablet: 5,
      },
      locations: {
        'United States': 50,
        'United Kingdom': 15,
        'Canada': 10,
        'Australia': 8,
        'Other': 17,
      },
      dailyStats: this.generateMockDailyStats(startDate, endDate),
    };
  }

  async incrementView(id: string): Promise<LandingPage | null> {
    const landingPage = await this.findById(id);
    if (!landingPage) {
      return null;
    }

    await this.landingPageRepository.increment({ id }, 'viewCount', 1);
    return this.findById(id);
  }

  async trackConversion(id: string, conversionData: {
    type: string;
    value?: number;
    metadata?: any;
  }): Promise<LandingPage | null> {
    const landingPage = await this.findById(id);
    if (!landingPage) {
      return null;
    }

    // Increment conversion count
    await this.landingPageRepository.increment({ id }, 'conversionCount', 1);

    // Update conversion value if provided
    if (conversionData.value) {
      await this.landingPageRepository.increment({ id }, 'conversionValue', conversionData.value);
    }

    // Log conversion (this would typically go to a separate analytics table)
    console.log('Conversion tracked:', {
      landingPageId: id,
      type: conversionData.type,
      value: conversionData.value,
      metadata: conversionData.metadata,
      timestamp: new Date(),
    });

    return this.findById(id);
  }

  async getStats(
    startDate?: Date,
    endDate?: Date,
    campaign?: string
  ): Promise<{
    totalLandingPages: number;
    publishedLandingPages: number;
    draftLandingPages: number;
    totalViews: number;
    totalConversions: number;
    averageConversionRate: number;
    totalConversionValue: number;
    campaignBreakdown: Record<string, number>;
    topPerforming: LandingPage[];
    recentConversions: Array<{
      landingPageId: string;
      landingPageTitle: string;
      type: string;
      value: number;
      timestamp: Date;
    }>;
  }> {
    const query = this.landingPageRepository.createQueryBuilder('landingPage');

    if (startDate) {
      query.andWhere('landingPage.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('landingPage.createdAt <= :endDate', { endDate });
    }

    if (campaign) {
      query.andWhere('landingPage.campaign = :campaign', { campaign });
    }

    const landingPages = await query.getMany();

    const totalLandingPages = landingPages.length;
    const publishedLandingPages = landingPages.filter(p => p.status === 'PUBLISHED').length;
    const draftLandingPages = landingPages.filter(p => p.status === 'DRAFT').length;

    const totalViews = landingPages.reduce((sum, page) => sum + (page.viewCount || 0), 0);
    const totalConversions = landingPages.reduce((sum, page) => sum + (page.conversionCount || 0), 0);
    const totalConversionValue = landingPages.reduce((sum, page) => sum + (page.conversionValue || 0), 0);
    const averageConversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;

    const campaignBreakdown = landingPages.reduce((acc, page) => {
      const campaignName = page.campaign || 'Uncategorized';
      acc[campaignName] = (acc[campaignName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPerforming = landingPages
      .filter(p => p.status === 'PUBLISHED')
      .sort((a, b) => (b.conversionCount || 0) - (a.conversionCount || 0))
      .slice(0, 5);

    const recentConversions = [
      {
        landingPageId: '1',
        landingPageTitle: 'Sample Landing Page',
        type: 'form_submission',
        value: 100,
        timestamp: new Date(),
      },
      // More mock conversion data would come from analytics service
    ];

    return {
      totalLandingPages,
      publishedLandingPages,
      draftLandingPages,
      totalViews,
      totalConversions,
      averageConversionRate,
      totalConversionValue,
      campaignBreakdown,
      topPerforming,
      recentConversions,
    };
  }

  async bulkUpdate(pageIds: string[], updateData: UpdateLandingPageDto): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    for (const pageId of pageIds) {
      const landingPage = await this.findById(pageId);
      if (landingPage) {
        await this.landingPageRepository.update(pageId, {
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
      const landingPage = await this.publish(pageId, userId);
      if (landingPage) {
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
      const landingPage = await this.unpublish(pageId, userId);
      if (landingPage) {
        unpublished++;
      } else {
        failed++;
      }
    }

    return { unpublished, failed };
  }

  async findByCampaign(campaign: string, limit: number = 10): Promise<LandingPage[]> {
    return this.landingPageRepository.find({
      where: { campaign, status: 'PUBLISHED' },
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }

  async findByTemplate(template: string, limit: number = 10): Promise<LandingPage[]> {
    return this.landingPageRepository.find({
      where: { template, status: 'PUBLISHED' },
      order: { publishedAt: 'DESC' },
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

  private generateMockDailyStats(startDate?: Date, endDate?: Date): Array<{ date: string; views: number; conversions: number }> {
    const stats = [];
    const now = new Date();
    const start = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const end = endDate || now;

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      stats.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 100) + 20,
        conversions: Math.floor(Math.random() * 10) + 1,
      });
    }

    return stats;
  }
}
