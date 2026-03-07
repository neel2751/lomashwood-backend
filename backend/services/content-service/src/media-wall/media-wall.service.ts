import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaItem } from './entities/media-item.entity';
import { CreateMediaItemDto } from './dto/create-media-item.dto';
import { UpdateMediaItemDto } from './dto/update-media-item.dto';

@Injectable()
export class MediaWallService {
  constructor(
    @InjectRepository(MediaItem)
    private readonly mediaItemRepository: Repository<MediaItem>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    type?: string;
    category?: string;
    tags?: string;
    featured?: boolean;
    search?: string;
  }): Promise<{ mediaItems: MediaItem[]; total: number; page: number; limit: number }> {
    const { page, limit, type, category, tags, featured, search } = params;
    const skip = (page - 1) * limit;

    const query = this.mediaItemRepository.createQueryBuilder('mediaItem');

    if (type) {
      query.andWhere('mediaItem.type = :type', { type });
    }

    if (category) {
      query.andWhere('mediaItem.category = :category', { category });
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.andWhere('mediaItem.tags && :tags', { tags: tagArray });
    }

    if (featured !== undefined) {
      query.andWhere('mediaItem.featured = :featured', { featured });
    }

    if (search) {
      query.andWhere('(mediaItem.title ILIKE :search OR mediaItem.description ILIKE :search OR mediaItem.caption ILIKE :search)', 
        { search: `%${search}%` });
    }

    const [mediaItems, total] = await query
      .orderBy('mediaItem.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      mediaItems,
      total,
      page,
      limit,
    };
  }

  async findPublished(params: {
    page: number;
    limit: number;
    type?: string;
    category?: string;
    tags?: string;
    featured?: boolean;
    search?: string;
  }): Promise<{ mediaItems: MediaItem[]; total: number; page: number; limit: number }> {
    const { page, limit, type, category, tags, featured, search } = params;
    const skip = (page - 1) * limit;

    const query = this.mediaItemRepository.createQueryBuilder('mediaItem')
      .where('mediaItem.status = :status', { status: 'PUBLISHED' });

    if (type) {
      query.andWhere('mediaItem.type = :type', { type });
    }

    if (category) {
      query.andWhere('mediaItem.category = :category', { category });
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.andWhere('mediaItem.tags && :tags', { tags: tagArray });
    }

    if (featured !== undefined) {
      query.andWhere('mediaItem.featured = :featured', { featured });
    }

    if (search) {
      query.andWhere('(mediaItem.title ILIKE :search OR mediaItem.description ILIKE :search OR mediaItem.caption ILIKE :search)', 
        { search: `%${search}%` });
    }

    const [mediaItems, total] = await query
      .orderBy('mediaItem.publishedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      mediaItems,
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<MediaItem | null> {
    return this.mediaItemRepository.findOne({ where: { id } });
  }

  async create(createMediaItemDto: CreateMediaItemDto): Promise<MediaItem> {
    const mediaItem = this.mediaItemRepository.create({
      ...createMediaItemDto,
      status: 'DRAFT',
    });
    return this.mediaItemRepository.save(mediaItem);
  }

  async update(id: string, updateMediaItemDto: UpdateMediaItemDto): Promise<MediaItem | null> {
    const mediaItem = await this.findById(id);
    if (!mediaItem) {
      return null;
    }

    await this.mediaItemRepository.update(id, {
      ...updateMediaItemDto,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async remove(id: string): Promise<MediaItem | null> {
    const mediaItem = await this.findById(id);
    if (!mediaItem) {
      return null;
    }

    await this.mediaItemRepository.delete(id);
    return mediaItem;
  }

  async publish(id: string, userId?: string): Promise<MediaItem | null> {
    const mediaItem = await this.findById(id);
    if (!mediaItem) {
      return null;
    }

    await this.mediaItemRepository.update(id, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      publishedBy: userId,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async unpublish(id: string, userId?: string): Promise<MediaItem | null> {
    const mediaItem = await this.findById(id);
    if (!mediaItem) {
      return null;
    }

    await this.mediaItemRepository.update(id, {
      status: 'DRAFT',
      publishedAt: null,
      publishedBy: null,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async feature(id: string, featured: boolean): Promise<MediaItem | null> {
    const mediaItem = await this.findById(id);
    if (!mediaItem) {
      return null;
    }

    await this.mediaItemRepository.update(id, {
      featured,
      featuredAt: featured ? new Date() : null,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async getCategories(): Promise<string[]> {
    // This would typically fetch from a predefined list or database
    return [
      'Products',
      'Projects',
      'Events',
      'Team',
      'Office',
      'Workshop',
      'Showroom',
      'Design Process',
      'Materials',
      'Inspiration',
    ];
  }

  async getTags(): Promise<string[]> {
    const mediaItems = await this.mediaItemRepository
      .createQueryBuilder('mediaItem')
      .select('mediaItem.tags')
      .where('mediaItem.status = :status', { status: 'PUBLISHED' })
      .getMany();

    const allTags = mediaItems.flatMap(item => item.tags || []);
    return [...new Set(allTags)].sort();
  }

  async getPopular(limit: number = 10, type?: string, category?: string): Promise<MediaItem[]> {
    const query = this.mediaItemRepository.createQueryBuilder('mediaItem')
      .where('mediaItem.status = :status', { status: 'PUBLISHED' })
      .orderBy('mediaItem.viewCount', 'DESC')
      .take(limit);

    if (type) {
      query.andWhere('mediaItem.type = :type', { type });
    }

    if (category) {
      query.andWhere('mediaItem.category = :category', { category });
    }

    return query.getMany();
  }

  async getRecent(limit: number = 10, type?: string, category?: string): Promise<MediaItem[]> {
    const query = this.mediaItemRepository.createQueryBuilder('mediaItem')
      .where('mediaItem.status = :status', { status: 'PUBLISHED' })
      .orderBy('mediaItem.publishedAt', 'DESC')
      .take(limit);

    if (type) {
      query.andWhere('mediaItem.type = :type', { type });
    }

    if (category) {
      query.andWhere('mediaItem.category = :category', { category });
    }

    return query.getMany();
  }

  async getRelated(id: string, limit: number = 5): Promise<MediaItem[]> {
    const mediaItem = await this.findById(id);
    if (!mediaItem) {
      return [];
    }

    return this.mediaItemRepository.createQueryBuilder('mediaItem')
      .where('mediaItem.status = :status', { status: 'PUBLISHED' })
      .andWhere('mediaItem.id != :id', { id: mediaItem.id })
      .andWhere('(mediaItem.category = :category OR mediaItem.tags && :tags)', {
        category: mediaItem.category,
        tags: mediaItem.tags || [],
      })
      .orderBy('mediaItem.viewCount', 'DESC')
      .take(limit)
      .getMany();
  }

  async incrementView(id: string): Promise<MediaItem | null> {
    const mediaItem = await this.findById(id);
    if (!mediaItem) {
      return null;
    }

    await this.mediaItemRepository.increment({ id }, 'viewCount', 1);
    return this.findById(id);
  }

  async getStats(
    startDate?: Date,
    endDate?: Date,
    type?: string
  ): Promise<{
    totalMediaItems: number;
    publishedMediaItems: number;
    draftMediaItems: number;
    totalViews: number;
    averageViews: number;
    typeBreakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
    mostPopular: MediaItem[];
  }> {
    const query = this.mediaItemRepository.createQueryBuilder('mediaItem');

    if (startDate) {
      query.andWhere('mediaItem.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('mediaItem.createdAt <= :endDate', { endDate });
    }

    if (type) {
      query.andWhere('mediaItem.type = :type', { type });
    }

    const mediaItems = await query.getMany();

    const totalMediaItems = mediaItems.length;
    const publishedMediaItems = mediaItems.filter(m => m.status === 'PUBLISHED').length;
    const draftMediaItems = mediaItems.filter(m => m.status === 'DRAFT').length;

    const totalViews = mediaItems.reduce((sum, item) => sum + (item.viewCount || 0), 0);
    const averageViews = totalMediaItems > 0 ? totalViews / totalMediaItems : 0;

    const typeBreakdown = mediaItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryBreakdown = mediaItems.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostPopular = mediaItems
      .filter(m => m.status === 'PUBLISHED')
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 5);

    return {
      totalMediaItems,
      publishedMediaItems,
      draftMediaItems,
      totalViews,
      averageViews,
      typeBreakdown,
      categoryBreakdown,
      mostPopular,
    };
  }

  async bulkUpdate(mediaItemIds: string[], updateData: UpdateMediaItemDto): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    for (const mediaItemId of mediaItemIds) {
      const mediaItem = await this.findById(mediaItemId);
      if (mediaItem) {
        await this.mediaItemRepository.update(mediaItemId, {
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

  async findByType(type: string, limit: number = 10): Promise<MediaItem[]> {
    return this.mediaItemRepository.find({
      where: { type, status: 'PUBLISHED' },
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }

  async findByCategory(category: string, limit: number = 10): Promise<MediaItem[]> {
    return this.mediaItemRepository.find({
      where: { category, status: 'PUBLISHED' },
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }

  async searchByTags(tags: string[], limit: number = 10): Promise<MediaItem[]> {
    return this.mediaItemRepository.createQueryBuilder('mediaItem')
      .where('mediaItem.status = :status', { status: 'PUBLISHED' })
      .andWhere('mediaItem.tags && :tags', { tags })
      .orderBy('mediaItem.publishedAt', 'DESC')
      .take(limit)
      .getMany();
  }
}
