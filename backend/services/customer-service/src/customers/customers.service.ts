import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    membershipTier?: string;
  }): Promise<{ customers: Customer[]; total: number; page: number; limit: number }> {
    const { page, limit, search, status, membershipTier } = params;
    const skip = (page - 1) * limit;

    const query = this.customersRepository.createQueryBuilder('customer');

    if (search) {
      query.andWhere('(customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.email ILIKE :search)', 
        { search: `%${search}%` });
    }

    if (status) {
      query.andWhere('customer.status = :status', { status });
    }

    if (membershipTier) {
      query.andWhere('customer.membershipTier = :membershipTier', { membershipTier });
    }

    const [customers, total] = await query
      .orderBy('customer.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      customers,
      total,
      page,
      limit,
    };
  }

  async findById(id: string, user?: any): Promise<Customer | null> {
    const query = this.customersRepository.createQueryBuilder('customer')
      .where('customer.id = :id', { id });

    // Apply user access control
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      query.andWhere('customer.userId = :userId', { userId: user?.id });
    }

    return query.getOne();
  }

  async findByUserId(userId: string): Promise<Customer | null> {
    return this.customersRepository.findOne({
      where: { userId },
      relations: ['loyaltyAccount', 'reviews', 'supportTickets'],
    });
  }

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customersRepository.create(createCustomerDto);
    return this.customersRepository.save(customer);
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto, user?: any): Promise<Customer | null> {
    const customer = await this.findById(id, user);
    if (!customer) {
      return null;
    }

    await this.customersRepository.update(id, {
      ...updateCustomerDto,
      updatedAt: new Date(),
    });

    return this.findById(id, user);
  }

  async remove(id: string): Promise<void> {
    await this.customersRepository.delete(id);
  }

  async verify(id: string, verified: boolean, notes?: string): Promise<Customer | null> {
    const customer = await this.findById(id);
    if (!customer) {
      return null;
    }

    await this.customersRepository.update(id, {
      isVerified: verified,
      verificationDate: verified ? new Date() : null,
      verificationNotes: notes,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async search(query: string, params: {
    page: number;
    limit: number;
    filters?: string;
  }): Promise<{ customers: Customer[]; total: number; page: number; limit: number }> {
    const { page, limit, filters } = params;
    const skip = (page - 1) * limit;

    const searchQuery = this.customersRepository.createQueryBuilder('customer')
      .where('(customer.firstName ILIKE :query OR customer.lastName ILIKE :query OR customer.email ILIKE :query OR customer.phone ILIKE :query)', 
        { query: `%${query}%` });

    // Apply additional filters if provided
    if (filters) {
      try {
        const filterObj = JSON.parse(filters);
        if (filterObj.status) {
          searchQuery.andWhere('customer.status = :status', { status: filterObj.status });
        }
        if (filterObj.membershipTier) {
          searchQuery.andWhere('customer.membershipTier = :membershipTier', { membershipTier: filterObj.membershipTier });
        }
      } catch (e) {
        // Invalid filter format, ignore
      }
    }

    const [customers, total] = await searchQuery
      .orderBy('customer.firstName', 'ASC')
      .addOrderBy('customer.lastName', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      customers,
      total,
      page,
      limit,
    };
  }

  async getStats(
    startDate?: Date,
    endDate?: Date,
    membershipTier?: string
  ): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    membershipBreakdown: Record<string, number>;
    averageAge: number;
  }> {
    const query = this.customersRepository.createQueryBuilder('customer');

    if (startDate) {
      query.andWhere('customer.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('customer.createdAt <= :endDate', { endDate });
    }

    if (membershipTier) {
      query.andWhere('customer.membershipTier = :membershipTier', { membershipTier });
    }

    const customers = await query.getMany();

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'ACTIVE').length;
    const newCustomers = customers.filter(c => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return c.createdAt >= thirtyDaysAgo;
    }).length;

    const membershipBreakdown = customers.reduce((acc, customer) => {
      acc[customer.membershipTier] = (acc[customer.membershipTier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageAge = customers.length > 0
      ? customers.reduce((sum, customer) => sum + (customer.age || 0), 0) / customers.length
      : 0;

    return {
      totalCustomers,
      activeCustomers,
      newCustomers,
      membershipBreakdown,
      averageAge,
    };
  }

  async deactivate(id: string, reason?: string): Promise<Customer | null> {
    const customer = await this.findById(id);
    if (!customer) {
      return null;
    }

    await this.customersRepository.update(id, {
      status: 'INACTIVE',
      deactivationReason: reason,
      deactivatedAt: new Date(),
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async reactivate(id: string, reason?: string): Promise<Customer | null> {
    const customer = await this.findById(id);
    if (!customer) {
      return null;
    }

    await this.customersRepository.update(id, {
      status: 'ACTIVE',
      reactivationReason: reason,
      reactivatedAt: new Date(),
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.customersRepository.findOne({
      where: { email },
    });
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    return this.customersRepository.findOne({
      where: { phone },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.customersRepository.update(id, {
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async getCustomerOrders(customerId: string): Promise<any[]> {
    // This would integrate with order service
    // For now, return empty array
    return [];
  }

  async getCustomerReviews(customerId: string): Promise<any[]> {
    // This would integrate with reviews service
    // For now, return empty array
    return [];
  }
}
