import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Refund } from './entities/refund.entity';
import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundDto } from './dto/update-refund.dto';

@Injectable()
export class RefundsService {
  constructor(
    @InjectRepository(Refund)
    private refundsRepository: Repository<Refund>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
    orderId?: string;
    paymentId?: string;
  }): Promise<{ refunds: Refund[]; total: number; page: number; limit: number }> {
    const { page, limit, status, orderId, paymentId } = params;
    const skip = (page - 1) * limit;

    const query = this.refundsRepository.createQueryBuilder('refund')
      .leftJoinAndSelect('refund.order', 'order')
      .leftJoinAndSelect('refund.payment', 'payment')
      .leftJoinAndSelect('order.user', 'user');

    if (status) {
      query.andWhere('refund.status = :status', { status });
    }

    if (orderId) {
      query.andWhere('refund.orderId = :orderId', { orderId });
    }

    if (paymentId) {
      query.andWhere('refund.paymentId = :paymentId', { paymentId });
    }

    const [refunds, total] = await query
      .orderBy('refund.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      refunds,
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<Refund | null> {
    return this.refundsRepository.findOne({
      where: { id },
      relations: ['order', 'payment', 'order.user'],
    });
  }

  async findByPayment(paymentId: string): Promise<Refund[]> {
    return this.refundsRepository.find({
      where: { paymentId },
      relations: ['order', 'payment'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByOrder(orderId: string): Promise<Refund[]> {
    return this.refundsRepository.find({
      where: { orderId },
      relations: ['order', 'payment'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(createRefundDto: CreateRefundDto): Promise<Refund> {
    const { orderId, paymentId, amount, reason, type } = createRefundDto;

    const refund = this.refundsRepository.create({
      orderId,
      paymentId,
      amount,
      reason,
      type,
      status: 'PENDING',
      refundNumber: this.generateRefundNumber(),
    });

    return this.refundsRepository.save(refund);
  }

  async update(id: string, updateRefundDto: UpdateRefundDto): Promise<Refund | null> {
    await this.refundsRepository.update(id, updateRefundDto);
    return this.findById(id);
  }

  async process(id: string, status: string, notes?: string): Promise<Refund | null> {
    const refund = await this.findById(id);
    if (!refund) {
      return null;
    }

    await this.refundsRepository.update(id, {
      status,
      notes,
      processedAt: new Date(),
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async getStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalRefunds: number;
    totalAmount: number;
    averageAmount: number;
    statusBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
  }> {
    const query = this.refundsRepository.createQueryBuilder('refund');

    if (startDate) {
      query.andWhere('refund.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('refund.createdAt <= :endDate', { endDate });
    }

    const refunds = await query.getMany();

    const totalRefunds = refunds.length;
    const totalAmount = refunds.reduce((sum, refund) => sum + refund.amount, 0);
    const averageAmount = totalRefunds > 0 ? totalAmount / totalRefunds : 0;

    const statusBreakdown = refunds.reduce((acc, refund) => {
      acc[refund.status] = (acc[refund.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeBreakdown = refunds.reduce((acc, refund) => {
      acc[refund.type] = (acc[refund.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRefunds,
      totalAmount,
      averageAmount,
      statusBreakdown,
      typeBreakdown,
    };
  }

  private generateRefundNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REF-${timestamp}-${random}`;
  }

  async calculateRefundAmount(orderId: string, items?: string[]): Promise<number> {
    // This would calculate refund amount based on order items
    // For now, return a mock calculation
    return 0;
  }

  async checkRefundEligibility(orderId: string): Promise<{
    eligible: boolean;
    reason?: string;
    maxRefundAmount?: number;
  }> {
    // This would check if order is eligible for refund
    // Based on time elapsed, order status, etc.
    return {
      eligible: true,
      maxRefundAmount: 0,
    };
  }

  async updateRefundStatus(id: string, status: string, notes?: string): Promise<Refund | null> {
    await this.refundsRepository.update(id, {
      status,
      notes,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async getRefundTimeline(id: string): Promise<any[]> {
    const refund = await this.findById(id);
    if (!refund) {
      return [];
    }

    return [
      {
        status: 'CREATED',
        timestamp: refund.createdAt,
        description: 'Refund request created',
      },
      ...(refund.processedAt ? [{
        status: refund.status,
        timestamp: refund.processedAt,
        description: `Refund ${refund.status.toLowerCase()}`,
      }] : []),
    ];
  }
}
