import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedDesign } from './entities/saved-design.entity';

@Injectable()
export class SavedDesignsService {
  constructor(
    @InjectRepository(SavedDesign)
    private savedDesignRepository: Repository<SavedDesign>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    customerId?: string;
    category?: string;
    style?: string;
    room?: string;
    user?: any;
  }): Promise<{ designs: SavedDesign[]; total: number; page: number; limit: number }> {
    const { page, limit, customerId, category, style, room, user } = params;
    const skip = (page - 1) * limit;

    const query = this.savedDesignRepository.createQueryBuilder('design')
      .leftJoinAndSelect('design.customer', 'customer');

    // Apply user access control
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      query.andWhere('design.customerId = :customerId', { customerId: user?.id });
    } else if (customerId) {
      query.andWhere('design.customerId = :customerId', { customerId });
    }

    if (category) {
      query.andWhere('design.category = :category', { category });
    }

    if (style) {
      query.andWhere('design.style = :style', { style });
    }

    if (room) {
      query.andWhere('design.room = :room', { room });
    }

    const [designs, total] = await query
      .orderBy('design.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      designs,
      total,
      page,
      limit,
    };
  }

  async findById(id: string, user?: any): Promise<SavedDesign | null> {
    const query = this.savedDesignRepository.createQueryBuilder('design')
      .leftJoinAndSelect('design.customer', 'customer')
      .where('design.id = :id', { id });

    // Apply user access control
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      query.andWhere('(design.customerId = :customerId OR design.isPublic = :isPublic)', {
        customerId: user?.id,
        isPublic: true,
      });
    }

    return query.getOne();
  }

  async findByCustomer(customerId: string, params: {
    page: number;
    limit: number;
    category?: string;
    style?: string;
    room?: string;
  }, user?: any): Promise<{ designs: SavedDesign[]; total: number; page: number; limit: number }> {
    const { page, limit, category, style, room } = params;
    const skip = (page - 1) * limit;

    // Apply user access control
    const targetCustomerId = (user?.role !== 'ADMIN' && user?.role !== 'STAFF') ? user?.id : customerId;

    const query = this.savedDesignRepository.createQueryBuilder('design')
      .where('design.customerId = :customerId', { customerId: targetCustomerId });

    if (category) {
      query.andWhere('design.category = :category', { category });
    }

    if (style) {
      query.andWhere('design.style = :style', { style });
    }

    if (room) {
      query.andWhere('design.room = :room', { room });
    }

    const [designs, total] = await query
      .orderBy('design.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      designs,
      total,
      page,
      limit,
    };
  }

  async create(createData: {
    name: string;
    description?: string;
    category?: string;
    style?: string;
    room?: string;
    designData: any;
    thumbnail?: string;
    images?: string[];
    tags?: string[];
    isPublic?: boolean;
    customerId: string;
  }): Promise<SavedDesign> {
    const design = this.savedDesignRepository.create({
      ...createData,
      isPublic: createData.isPublic || false,
      shareToken: this.generateShareToken(),
    });

    return this.savedDesignRepository.save(design);
  }

  async update(id: string, updateData: any, user?: any): Promise<SavedDesign | null> {
    const design = await this.findById(id, user);
    if (!design) {
      return null;
    }

    // Check if user can update this design
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF' && design.customerId !== user?.id) {
      return null;
    }

    await this.savedDesignRepository.update(id, {
      ...updateData,
      updatedAt: new Date(),
    });

    return this.findById(id, user);
  }

  async remove(id: string, user?: any): Promise<SavedDesign | null> {
    const design = await this.findById(id, user);
    if (!design) {
      return null;
    }

    // Check if user can delete this design
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF' && design.customerId !== user?.id) {
      return null;
    }

    await this.savedDesignRepository.delete(id);
    return design;
  }

  async duplicate(id: string, duplicateData: {
    name?: string;
    description?: string;
    duplicatedBy: string;
  }, user?: any): Promise<SavedDesign | null> {
    const originalDesign = await this.findById(id, user);
    if (!originalDesign) {
      return null;
    }

    const newDesign = this.savedDesignRepository.create({
      name: duplicateData.name || `Copy of ${originalDesign.name}`,
      description: duplicateData.description || originalDesign.description,
      customerId: user?.id,
      category: originalDesign.category,
      style: originalDesign.style,
      room: originalDesign.room,
      designData: originalDesign.designData,
      thumbnail: originalDesign.thumbnail,
      images: originalDesign.images,
      tags: originalDesign.tags,
      isPublic: false,
      shareToken: this.generateShareToken(),
      duplicatedFrom: id,
      duplicatedBy: duplicateData.duplicatedBy,
      duplicatedAt: new Date(),
    });

    return this.savedDesignRepository.save(newDesign);
  }

  async share(id: string, shareData: {
    emails: string[];
    message?: string;
    expiresIn?: number;
    sharedBy: string;
  }, user?: any): Promise<any> {
    const design = await this.findById(id, user);
    if (!design) {
      return null;
    }

    // Check if user can share this design
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF' && design.customerId !== user?.id) {
      return null;
    }

    const shareToken = this.generateShareToken();
    const expiresAt = shareData.expiresIn 
      ? new Date(Date.now() + shareData.expiresIn * 24 * 60 * 60 * 1000)
      : null;

    await this.savedDesignRepository.update(id, {
      isPublic: true,
      shareToken,
      shareExpiresAt: expiresAt,
      sharedAt: new Date(),
      sharedBy: shareData.sharedBy,
      updatedAt: new Date(),
    });

    // Here you would integrate with an email service to send the share emails
    // For now, just return the share information
    return {
      shareToken,
      expiresAt,
      sharedAt: new Date(),
    };
  }

  async findByShareToken(shareToken: string): Promise<SavedDesign | null> {
    const design = await this.savedDesignRepository.findOne({
      where: { shareToken, isPublic: true },
      relations: ['customer'],
    });

    // Check if share token has expired
    if (design?.shareExpiresAt && design.shareExpiresAt < new Date()) {
      return null;
    }

    return design;
  }

  async getCategories(): Promise<string[]> {
    // This would typically fetch from a predefined list or database
    return [
      'Living Room',
      'Bedroom',
      'Kitchen',
      'Bathroom',
      'Office',
      'Outdoor',
      'Dining Room',
      'Entryway',
      'Kids Room',
      'Home Office',
    ];
  }

  async getStyles(): Promise<string[]> {
    return [
      'Modern',
      'Traditional',
      'Contemporary',
      'Minimalist',
      'Industrial',
      'Scandinavian',
      'Bohemian',
      'Farmhouse',
      'Mid-Century Modern',
      'Coastal',
      'Rustic',
      'Art Deco',
    ];
  }

  async getRooms(): Promise<string[]> {
    return [
      'Living Room',
      'Bedroom',
      'Kitchen',
      'Bathroom',
      'Office',
      'Dining Room',
      'Entryway',
      'Kids Room',
      'Home Office',
      'Outdoor',
      'Garage',
      'Basement',
      'Attic',
      'Laundry Room',
    ];
  }

  async search(params: {
    query: string;
    page: number;
    limit: number;
    category?: string;
    style?: string;
    room?: string;
    isPublic?: boolean;
    user?: any;
  }): Promise<{ designs: SavedDesign[]; total: number; page: number; limit: number }> {
    const { query, page, limit, category, style, room, isPublic, user } = params;
    const skip = (page - 1) * limit;

    const searchQuery = this.savedDesignRepository.createQueryBuilder('design')
      .leftJoinAndSelect('design.customer', 'customer')
      .where('(design.name ILIKE :query OR design.description ILIKE :query OR design.tags::text ILIKE :query)', 
        { query: `%${query}%` });

    // Apply user access control
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      searchQuery.andWhere('(design.customerId = :customerId OR design.isPublic = :isPublic)', {
        customerId: user?.id,
        isPublic: true,
      });
    }

    if (isPublic !== undefined) {
      searchQuery.andWhere('design.isPublic = :isPublic', { isPublic });
    }

    if (category) {
      searchQuery.andWhere('design.category = :category', { category });
    }

    if (style) {
      searchQuery.andWhere('design.style = :style', { style });
    }

    if (room) {
      searchQuery.andWhere('design.room = :room', { room });
    }

    const [designs, total] = await searchQuery
      .orderBy('design.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      designs,
      total,
      page,
      limit,
    };
  }

  async getStats(
    startDate?: Date,
    endDate?: Date,
    customerId?: string
  ): Promise<{
    totalDesigns: number;
    publicDesigns: number;
    privateDesigns: number;
    categoryBreakdown: Record<string, number>;
    styleBreakdown: Record<string, number>;
    roomBreakdown: Record<string, number>;
    averageDesignsPerCustomer: number;
    mostActiveCustomers: any[];
  }> {
    const query = this.savedDesignRepository.createQueryBuilder('design')
      .leftJoinAndSelect('design.customer', 'customer');

    if (startDate) {
      query.andWhere('design.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('design.createdAt <= :endDate', { endDate });
    }

    if (customerId) {
      query.andWhere('design.customerId = :customerId', { customerId });
    }

    const designs = await query.getMany();

    const totalDesigns = designs.length;
    const publicDesigns = designs.filter(d => d.isPublic).length;
    const privateDesigns = totalDesigns - publicDesigns;

    const categoryBreakdown = designs.reduce((acc, design) => {
      acc[design.category] = (acc[design.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const styleBreakdown = designs.reduce((acc, design) => {
      acc[design.style] = (acc[design.style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const roomBreakdown = designs.reduce((acc, design) => {
      acc[design.room] = (acc[design.room] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get customer statistics
    const customerStats = designs.reduce((acc, design) => {
      acc[design.customerId] = (acc[design.customerId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const uniqueCustomers = Object.keys(customerStats).length;
    const averageDesignsPerCustomer = uniqueCustomers > 0 ? totalDesigns / uniqueCustomers : 0;

    const mostActiveCustomers = Object.entries(customerStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([customerId, count]) => ({ customerId, count }));

    return {
      totalDesigns,
      publicDesigns,
      privateDesigns,
      categoryBreakdown,
      styleBreakdown,
      roomBreakdown,
      averageDesignsPerCustomer,
      mostActiveCustomers,
    };
  }

  async bulkExport(designIds: string[], options: {
    format?: string;
    includeImages?: boolean;
  }): Promise<any> {
    const designs = await this.savedDesignRepository.findByIds(designIds);
    
    // Here you would implement the actual export logic
    // For now, return the designs data
    return {
      designs,
      format: options.format || 'JSON',
      includeImages: options.includeImages || false,
      exportedAt: new Date(),
      totalCount: designs.length,
    };
  }

  private generateShareToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
