import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Showroom } from './entities/showroom.entity';
import { CreateShowroomDto } from './dto/create-showroom.dto';
import { UpdateShowroomDto } from './dto/update-showroom.dto';

@Injectable()
export class ShowroomsService {
  constructor(
    @InjectRepository(Showroom)
    private readonly showroomRepository: Repository<Showroom>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
    type?: string;
    region?: string;
    search?: string;
  }): Promise<{ showrooms: Showroom[]; total: number; page: number; limit: number }> {
    const { page, limit, status, type, region, search } = params;
    const skip = (page - 1) * limit;

    const query = this.showroomRepository.createQueryBuilder('showroom');

    if (status) {
      query.andWhere('showroom.status = :status', { status });
    }

    if (type) {
      query.andWhere('showroom.type = :type', { type });
    }

    if (region) {
      query.andWhere('showroom.region = :region', { region });
    }

    if (search) {
      query.andWhere('(showroom.name ILIKE :search OR showroom.description ILIKE :search OR showroom.address ILIKE :search)', 
        { search: `%${search}%` });
    }

    const [showrooms, total] = await query
      .orderBy('showroom.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      showrooms,
      total,
      page,
      limit,
    };
  }

  async findPublished(params: {
    page: number;
    limit: number;
    type?: string;
    region?: string;
    search?: string;
  }): Promise<{ showrooms: Showroom[]; total: number; page: number; limit: number }> {
    const { page, limit, type, region, search } = params;
    const skip = (page - 1) * limit;

    const query = this.showroomRepository.createQueryBuilder('showroom')
      .where('showroom.status = :status', { status: 'PUBLISHED' });

    if (type) {
      query.andWhere('showroom.type = :type', { type });
    }

    if (region) {
      query.andWhere('showroom.region = :region', { region });
    }

    if (search) {
      query.andWhere('(showroom.name ILIKE :search OR showroom.description ILIKE :search OR showroom.address ILIKE :search)', 
        { search: `%${search}%` });
    }

    const [showrooms, total] = await query
      .orderBy('showroom.featured', 'DESC')
      .addOrderBy('showroom.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      showrooms,
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<Showroom | null> {
    return this.showroomRepository.findOne({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Showroom | null> {
    return this.showroomRepository.findOne({ where: { slug } });
  }

  async create(createShowroomDto: CreateShowroomDto): Promise<Showroom> {
    const showroom = this.showroomRepository.create({
      ...createShowroomDto,
      slug: this.generateSlug(createShowroomDto.name),
      status: 'DRAFT',
    });
    return this.showroomRepository.save(showroom);
  }

  async update(id: string, updateShowroomDto: UpdateShowroomDto): Promise<Showroom | null> {
    const showroom = await this.findById(id);
    if (!showroom) {
      return null;
    }

    // Update slug if name changed
    if (updateShowroomDto.name && updateShowroomDto.name !== showroom.name) {
      updateShowroomDto.slug = this.generateSlug(updateShowroomDto.name);
    }

    await this.showroomRepository.update(id, {
      ...updateShowroomDto,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async remove(id: string): Promise<Showroom | null> {
    const showroom = await this.findById(id);
    if (!showroom) {
      return null;
    }

    await this.showroomRepository.delete(id);
    return showroom;
  }

  async publish(id: string, userId?: string): Promise<Showroom | null> {
    const showroom = await this.findById(id);
    if (!showroom) {
      return null;
    }

    await this.showroomRepository.update(id, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      publishedBy: userId,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async unpublish(id: string, userId?: string): Promise<Showroom | null> {
    const showroom = await this.findById(id);
    if (!showroom) {
      return null;
    }

    await this.showroomRepository.update(id, {
      status: 'DRAFT',
      publishedAt: null,
      publishedBy: null,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async feature(id: string, featured: boolean): Promise<Showroom | null> {
    const showroom = await this.findById(id);
    if (!showroom) {
      return null;
    }

    await this.showroomRepository.update(id, {
      featured,
      featuredAt: featured ? new Date() : null,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async getTypes(): Promise<string[]> {
    // This would typically fetch from a predefined list or database
    return [
      'MAIN_SHOWROOM',
      'SATELLITE_SHOWROOM',
      'POP_UP_SHOWROOM',
      'DESIGN_STUDIO',
      'WAREHOUSE',
      'DISTRIBUTION_CENTER',
      'SERVICE_CENTER',
      'EXPERIENCE_CENTER',
      'MOBILE_SHOWROOM',
      'VIRTUAL_SHOWROOM',
    ];
  }

  async getRegions(): Promise<string[]> {
    // This would typically fetch from a predefined list or database
    return [
      'NORTH_AMERICA',
      'SOUTH_AMERICA',
      'EUROPE',
      'ASIA',
      'AFRICA',
      'OCEANIA',
      'MIDDLE_EAST',
    ];
  }

  async getNearby(latitude: number, longitude: number, radius: number = 50, limit: number = 10): Promise<Showroom[]> {
    // This would typically use a geospatial query or external service
    // For now, returning mock nearby showrooms
    return this.showroomRepository
      .createQueryBuilder('showroom')
      .where('showroom.status = :status', { status: 'PUBLISHED' })
      .orderBy('showroom.featured', 'DESC')
      .addOrderBy('showroom.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async getAvailability(showroomId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const showroom = await this.findById(showroomId);
    if (!showroom) {
      throw new Error('Showroom not found');
    }

    // This would typically integrate with a booking system
    // For now, returning mock availability data
    return {
      showroomId,
      startDate,
      endDate,
      availableSlots: this.generateMockAvailabilitySlots(startDate, endDate),
      businessHours: showroom.businessHours,
      timezone: showroom.timezone,
      holidays: showroom.holidays,
    };
  }

  async bookAppointment(showroomId: string, appointmentData: {
    consultantId: string;
    date: Date;
    time: string;
    duration: number;
    notes?: string;
    contactInfo: any;
  }): Promise<any> {
    const showroom = await this.findById(showroomId);
    if (!showroom) {
      throw new Error('Showroom not found');
    }

    // This would typically integrate with a booking system
    // For now, returning mock appointment data
    const appointment = {
      id: this.generateId(),
      showroomId,
      consultantId: appointmentData.consultantId,
      date: appointmentData.date,
      time: appointmentData.time,
      duration: appointmentData.duration,
      notes: appointmentData.notes,
      contactInfo: appointmentData.contactInfo,
      status: 'CONFIRMED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Appointment booked:', appointment);
    return appointment;
  }

  async getAppointments(showroomId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const showroom = await this.findById(showroomId);
    if (!showroom) {
      throw new Error('Showroom not found');
    }

    // This would typically integrate with a booking system
    // For now, returning mock appointments data
    return [
      {
        id: this.generateId(),
        showroomId,
        consultantId: 'consultant-1',
        consultantName: 'John Doe',
        date: new Date(),
        time: '10:00',
        duration: 60,
        status: 'CONFIRMED',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        createdAt: new Date(),
      },
      // More mock appointment data would come from booking system
    ];
  }

  async getConsultants(showroomId: string): Promise<any[]> {
    const showroom = await this.findById(showroomId);
    if (!showroom) {
      throw new Error('Showroom not found');
    }

    // This would typically integrate with a consultant management system
    // For now, returning mock consultants data
    return [
      {
        id: 'consultant-1',
        name: 'John Doe',
        email: 'john.doe@lomashwood.com',
        phone: '+1-555-0123',
        title: 'Senior Design Consultant',
        bio: 'Experienced design consultant with 10+ years in furniture design',
        specialties: ['Interior Design', 'Space Planning', 'Custom Furniture'],
        languages: ['English', 'Spanish'],
        rating: 4.8,
        reviewCount: 127,
        image: '/images/consultants/john-doe.jpg',
        available: true,
      },
      // More mock consultant data would come from consultant system
    ];
  }

  async getProducts(showroomId: string, page: number = 1, limit: number = 10, category?: string): Promise<any> {
    const showroom = await this.findById(showroomId);
    if (!showroom) {
      throw new Error('Showroom not found');
    }

    // This would typically integrate with the product service
    // For now, returning mock products data
    return {
      products: [
        {
          id: 'product-1',
          name: 'Modern Oak Dining Table',
          description: 'Beautiful modern dining table made from solid oak',
          price: 2499.99,
          image: '/images/products/dining-table.jpg',
          category: category || 'Dining',
          inStock: true,
          featured: true,
        },
        // More mock product data would come from product service
      ],
      pagination: {
        page,
        limit,
        total: 50,
        totalPages: 5,
      },
    };
  }

  async getTours(showroomId: string): Promise<any[]> {
    const showroom = await this.findById(showroomId);
    if (!showroom) {
      throw new Error('Showroom not found');
    }

    // This would typically integrate with a virtual tour system
    // For now, returning mock tours data
    return [
      {
        id: 'tour-1',
        title: '360° Virtual Tour',
        description: 'Complete 360-degree virtual tour of our showroom',
        type: 'VIRTUAL_360',
        url: '/tours/showroom-1/360',
        thumbnail: '/images/tours/showroom-1-thumb.jpg',
        duration: 300,
        featured: true,
      },
      {
        id: 'tour-2',
        title: 'Video Tour',
        description: 'Professional video tour showcasing our best products',
        type: 'VIDEO',
        url: '/tours/showroom-1/video',
        thumbnail: '/images/tours/showroom-1-video-thumb.jpg',
        duration: 180,
        featured: false,
      },
      // More mock tour data would come from virtual tour system
    ];
  }

  async getGallery(showroomId: string): Promise<any[]> {
    const showroom = await this.findById(showroomId);
    if (!showroom) {
      throw new Error('Showroom not found');
    }

    // This would typically integrate with a media management system
    // For now, returning mock gallery data
    return [
      {
        id: 'gallery-1',
        title: 'Showroom Exterior',
        description: 'Beautiful exterior view of our flagship showroom',
        type: 'IMAGE',
        url: '/images/gallery/showroom-1-exterior.jpg',
        thumbnail: '/images/gallery/showroom-1-exterior-thumb.jpg',
        order: 1,
      },
      {
        id: 'gallery-2',
        title: 'Main Display Area',
        description: 'Spacious main display area with featured products',
        type: 'IMAGE',
        url: '/images/gallery/showroom-1-main.jpg',
        thumbnail: '/images/gallery/showroom-1-main-thumb.jpg',
        order: 2,
      },
      // More mock gallery data would come from media management system
    ];
  }

  async getReviews(showroomId: string, page: number = 1, limit: number = 10, rating?: number): Promise<any> {
    const showroom = await this.findById(showroomId);
    if (!showroom) {
      throw new Error('Showroom not found');
    }

    // This would typically integrate with a review system
    // For now, returning mock reviews data
    return {
      reviews: [
        {
          id: 'review-1',
          rating: 5,
          title: 'Excellent Experience',
          comment: 'Amazing showroom with beautiful products and helpful staff!',
          customerName: 'Sarah Johnson',
          customerEmail: 'sarah@example.com',
          verified: true,
          createdAt: new Date(),
          helpfulCount: 12,
        },
        // More mock review data would come from review system
      ],
      pagination: {
        page,
        limit,
        total: 25,
        totalPages: 3,
      },
      averageRating: 4.7,
      totalReviews: 25,
    };
  }

  async addReview(showroomId: string, reviewData: {
    rating: number;
    title: string;
    comment: string;
    customerName?: string;
    customerEmail?: string;
    verified: boolean;
  }): Promise<any> {
    const showroom = await this.findById(showroomId);
    if (!showroom) {
      throw new Error('Showroom not found');
    }

    // This would typically integrate with a review system
    // For now, returning mock review data
    const review = {
      id: this.generateId(),
      showroomId,
      rating: reviewData.rating,
      title: reviewData.title,
      comment: reviewData.comment,
      customerName: reviewData.customerName,
      customerEmail: reviewData.customerEmail,
      verified: reviewData.verified,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Review added:', review);
    return review;
  }

  async getStats(showroomId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const showroom = await this.findById(showroomId);
    if (!showroom) {
      throw new Error('Showroom not found');
    }

    // This would typically integrate with analytics system
    // For now, returning mock stats data
    return {
      showroomId,
      startDate,
      endDate,
      totalVisits: 1250,
      uniqueVisitors: 890,
      totalAppointments: 145,
      completedAppointments: 132,
      averageRating: 4.7,
      totalReviews: 25,
      conversionRate: 10.4,
      topProducts: [
        { productId: 'product-1', name: 'Modern Oak Dining Table', views: 450 },
        { productId: 'product-2', name: 'Leather Sofa Set', views: 320 },
      ],
      peakHours: [
        { hour: 10, visits: 45 },
        { hour: 14, visits: 38 },
        { hour: 16, visits: 52 },
      ],
      popularDays: [
        { day: 'Saturday', visits: 280 },
        { day: 'Sunday', visits: 220 },
        { day: 'Friday', visits: 195 },
      ],
    };
  }

  async getStatsSummary(startDate?: Date, endDate?: Date, region?: string, type?: string): Promise<any> {
    const query = this.showroomRepository.createQueryBuilder('showroom');

    if (startDate) {
      query.andWhere('showroom.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('showroom.createdAt <= :endDate', { endDate });
    }

    if (region) {
      query.andWhere('showroom.region = :region', { region });
    }

    if (type) {
      query.andWhere('showroom.type = :type', { type });
    }

    const showrooms = await query.getMany();

    const totalShowrooms = showrooms.length;
    const publishedShowrooms = showrooms.filter(s => s.status === 'PUBLISHED').length;
    const featuredShowrooms = showrooms.filter(s => s.featured).length;

    return {
      totalShowrooms,
      publishedShowrooms,
      featuredShowrooms,
      regionBreakdown: showrooms.reduce((acc, showroom) => {
        const region = showroom.region || 'Unknown';
        acc[region] = (acc[region] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      typeBreakdown: showrooms.reduce((acc, showroom) => {
        const type = showroom.type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageRating: 4.6,
      totalVisits: 15420,
      totalAppointments: 1820,
    };
  }

  async bulkUpdate(showroomIds: string[], updateData: UpdateShowroomDto): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    for (const showroomId of showroomIds) {
      const showroom = await this.findById(showroomIdId);
      if (showroom) {
        await this.showroomRepository.update(showroomIdId, {
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

  async bulkPublish(showroomIds: string[], userId?: string): Promise<{ published: number; failed: number }> {
    let published = 0;
    let failed = 0;

    for (const showroomId of showroomIds) {
      const showroom = await this.publish(showroomIdId, userId);
      if (showroom) {
        published++;
      } else {
        failed++;
      }
    }

    return { published, failed };
  }

  async bulkUnpublish(showroomIds: string[], userId?: string): Promise<{ unpublished: number; failed: number }> {
    let unpublished = 0;
    let failed = 0;

    for (const showroomId of showroomIds) {
      const showroom = await this.unpublish(showroomIdId, userId);
      if (showroom) {
        unpublished++;
      } else {
        failed++;
      }
    }

    return { unpublished, failed };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private generateMockAvailabilitySlots(startDate?: Date, endDate?: Date): any[] {
    const slots = [];
    const now = new Date();
    const start = startDate || now;
    const end = endDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
        for (let hour = 9; hour <= 17; hour++) {
          slots.push({
            date: date.toISOString().split('T')[0],
            time: `${hour.toString().padStart(2, '0')}:00`,
            available: true,
          });
        }
      }
    }

    return slots;
  }
}
