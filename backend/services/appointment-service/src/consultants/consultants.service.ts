import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consultant } from './entities/consultant.entity';
import { CreateConsultantDto } from './dto/create-consultant.dto';
import { UpdateConsultantDto } from './dto/update-consultant.dto';

@Injectable()
export class ConsultantsService {
  constructor(
    @InjectRepository(Consultant)
    private consultantsRepository: Repository<Consultant>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    specialization?: string;
    showroomId?: string;
    isActive?: boolean;
  }): Promise<{ consultants: Consultant[]; total: number; page: number; limit: number }> {
    const { page, limit, specialization, showroomId, isActive } = params;
    const skip = (page - 1) * limit;

    const query = this.consultantsRepository.createQueryBuilder('consultant')
      .leftJoinAndSelect('consultant.showroom', 'showroom');

    if (specialization) {
      query.andWhere('consultant.specialization = :specialization', { specialization });
    }

    if (showroomId) {
      query.andWhere('consultant.showroomId = :showroomId', { showroomId });
    }

    if (isActive !== undefined) {
      query.andWhere('consultant.isActive = :isActive', { isActive });
    }

    const [consultants, total] = await query
      .orderBy('consultant.firstName', 'ASC')
      .addOrderBy('consultant.lastName', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      consultants,
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<Consultant | null> {
    return this.consultantsRepository.findOne({
      where: { id },
      relations: ['showroom'],
    });
  }

  async create(createConsultantDto: CreateConsultantDto): Promise<Consultant> {
    const consultant = this.consultantsRepository.create(createConsultantDto);
    return this.consultantsRepository.save(consultant);
  }

  async update(id: string, updateConsultantDto: UpdateConsultantDto): Promise<Consultant | null> {
    await this.consultantsRepository.update(id, updateConsultantDto);
    return this.findById(id);
  }

  async getAvailability(id: string, filters: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<any[]> {
    // This would integrate with the availability service
    // For now, return mock data
    return [];
  }

  async getAppointments(id: string, filters: {
    page: number;
    limit: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    // This would integrate with the appointments service
    // For now, return mock data
    return {
      appointments: [],
      total: 0,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async getStats(id: string, filters: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    averageRating: number;
    totalRevenue: number;
  }> {
    // This would calculate actual statistics
    // For now, return mock data
    return {
      totalAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      averageRating: 0,
      totalRevenue: 0,
    };
  }

  async updateStatus(id: string, isActive: boolean, reason?: string): Promise<Consultant | null> {
    await this.consultantsRepository.update(id, {
      isActive,
      statusChangeReason: reason,
      statusChangedAt: new Date(),
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async getSpecializations(): Promise<string[]> {
    // This would return distinct specializations from database
    // For now, return mock data
    return [
      'Interior Design',
      'Furniture Consultation',
      'Space Planning',
      'Color Consultation',
      'Material Selection',
      'Custom Design',
    ];
  }

  async findByShowroom(showroomId: string, filters: {
    specialization?: string;
    isActive?: boolean;
  }): Promise<Consultant[]> {
    const { specialization, isActive } = filters;

    const query = this.consultantsRepository.createQueryBuilder('consultant')
      .leftJoinAndSelect('consultant.showroom', 'showroom')
      .where('consultant.showroomId = :showroomId', { showroomId });

    if (specialization) {
      query.andWhere('consultant.specialization = :specialization', { specialization });
    }

    if (isActive !== undefined) {
      query.andWhere('consultant.isActive = :isActive', { isActive });
    }

    return query
      .orderBy('consultant.firstName', 'ASC')
      .addOrderBy('consultant.lastName', 'ASC')
      .getMany();
  }

  async findBySpecialization(specialization: string): Promise<Consultant[]> {
    return this.consultantsRepository.find({
      where: { specialization, isActive: true },
      relations: ['showroom'],
      order: { firstName: 'ASC', lastName: 'ASC' },
    });
  }

  async search(query: string): Promise<Consultant[]> {
    return this.consultantsRepository.createQueryBuilder('consultant')
      .leftJoinAndSelect('consultant.showroom', 'showroom')
      .where('consultant.firstName ILIKE :query', { query: `%${query}%` })
      .orWhere('consultant.lastName ILIKE :query', { query: `%${query}%` })
      .orWhere('consultant.specialization ILIKE :query', { query: `%${query}%` })
      .andWhere('consultant.isActive = :isActive', { isActive: true })
      .orderBy('consultant.firstName', 'ASC')
      .addOrderBy('consultant.lastName', 'ASC')
      .getMany();
  }

  async getTopRated(limit: number = 5): Promise<Consultant[]> {
    return this.consultantsRepository.find({
      where: { isActive: true },
      relations: ['showroom'],
      order: { rating: 'DESC' },
      take: limit,
    });
  }

  async updateRating(id: string, rating: number): Promise<Consultant | null> {
    const consultant = await this.findById(id);
    if (!consultant) {
      return null;
    }

    const newRating = consultant.rating ? (consultant.rating + rating) / 2 : rating;
    
    await this.consultantsRepository.update(id, {
      rating: newRating,
      totalRatings: (consultant.totalRatings || 0) + 1,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }
}
