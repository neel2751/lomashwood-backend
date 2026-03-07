import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersRepository {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
  ) {}

  async create(customerData: Partial<Customer>): Promise<Customer> {
    const customer = this.customersRepository.create(customerData);
    return this.customersRepository.save(customer);
  }

  async findAll(): Promise<Customer[]> {
    return this.customersRepository.find({
      relations: ['loyaltyAccount', 'reviews', 'supportTickets'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Customer | null> {
    return this.customersRepository.findOne({
      where: { id },
      relations: ['loyaltyAccount', 'reviews', 'supportTickets'],
    });
  }

  async findByUserId(userId: string): Promise<Customer | null> {
    return this.customersRepository.findOne({
      where: { userId },
      relations: ['loyaltyAccount', 'reviews', 'supportTickets'],
    });
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

  async update(id: string, updateData: Partial<Customer>): Promise<Customer | null> {
    await this.customersRepository.update(id, updateData);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.customersRepository.delete(id);
  }

  async findWithPagination(
    page: number,
    limit: number,
    filters?: {
      search?: string;
      status?: string;
      membershipTier?: string;
    }
  ): Promise<{ customers: Customer[]; total: number }> {
    const skip = (page - 1) * limit;
    const query = this.customersRepository.createQueryBuilder('customer');

    if (filters?.search) {
      query.andWhere('(customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.email ILIKE :search)', 
        { search: `%${filters.search}%` });
    }

    if (filters?.status) {
      query.andWhere('customer.status = :status', { status: filters.status });
    }

    if (filters?.membershipTier) {
      query.andWhere('customer.membershipTier = :membershipTier', { membershipTier: filters.membershipTier });
    }

    const [customers, total] = await query
      .orderBy('customer.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { customers, total };
  }

  async searchCustomers(query: string, limit: number = 10): Promise<Customer[]> {
    return this.customersRepository.createQueryBuilder('customer')
      .where('(customer.firstName ILIKE :query OR customer.lastName ILIKE :query OR customer.email ILIKE :query)', 
        { query: `%${query}%` })
      .orderBy('customer.firstName', 'ASC')
      .addOrderBy('customer.lastName', 'ASC')
      .take(limit)
      .getMany();
  }

  async getActiveCustomers(): Promise<Customer[]> {
    return this.customersRepository.find({
      where: { status: 'ACTIVE' },
      relations: ['loyaltyAccount'],
      order: { lastLoginAt: 'DESC' },
    });
  }

  async getCustomersByMembershipTier(tier: string): Promise<Customer[]> {
    return this.customersRepository.find({
      where: { membershipTier: tier },
      relations: ['loyaltyAccount'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCustomerStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  }>{
    const query = this.customersRepository.createQueryBuilder('customer');

    if (startDate) {
      query.andWhere('customer.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('customer.createdAt <= :endDate', { endDate });
    }

    const customers = await query.getMany();

    const total = customers.length;
    const active = customers.filter(c => c.status === 'ACTIVE').length;
    const inactive = customers.filter(c => c.status === 'INACTIVE').length;

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const newThisMonth = customers.filter(c => c.createdAt >= thisMonth).length;

    return {
      total,
      active,
      inactive,
      newThisMonth,
    };
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.customersRepository.update(id, {
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async bulkUpdateStatus(customerIds: string[], status: string, reason?: string): Promise<void> {
    await this.customersRepository
      .createQueryBuilder()
      .update(Customer)
      .set({ status, updatedAt: new Date() })
      .where('id IN (:...ids)', { ids: customerIds })
      .execute();

    if (reason) {
      await this.customersRepository
        .createQueryBuilder()
        .update(Customer)
        .set({ 
          statusChangeReason: reason,
          statusChangedAt: new Date(),
        })
        .where('id IN (:...ids)', { ids: customerIds })
        .execute();
    }
  }

  async getCustomersWithLoyaltyPoints(minPoints: number = 0): Promise<Customer[]> {
    return this.customersRepository.createQueryBuilder('customer')
      .leftJoinAndSelect('customer.loyaltyAccount', 'loyaltyAccount')
      .where('loyaltyAccount.points >= :minPoints', { minPoints })
      .andWhere('customer.status = :status', { status: 'ACTIVE' })
      .orderBy('loyaltyAccount.points', 'DESC')
      .getMany();
  }

  async getRecentlyActive(days: number = 30): Promise<Customer[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.customersRepository.find({
      where: {
        status: 'ACTIVE',
        lastLoginAt: { $gte: cutoffDate },
      },
      relations: ['loyaltyAccount'],
      order: { lastLoginAt: 'DESC' },
    });
  }
}
