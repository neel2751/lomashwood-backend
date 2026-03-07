import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
  ) {}

  async create(orderData: Partial<Order>): Promise<Order> {
    const order = this.ordersRepository.create(orderData);
    return this.ordersRepository.save(order);
  }

  async createOrderItem(itemData: Partial<OrderItem>): Promise<OrderItem> {
    const orderItem = this.orderItemsRepository.create(itemData);
    return this.orderItemsRepository.save(orderItem);
  }

  async findAll(): Promise<Order[]> {
    return this.ordersRepository.find({
      relations: ['user', 'items', 'items.product', 'items.colour', 'items.size', 'payment', 'invoice'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Order | null> {
    return this.ordersRepository.findOne({
      where: { id },
      relations: [
        'user',
        'items',
        'items.product',
        'items.colour',
        'items.size',
        'payment',
        'invoice',
        'refunds',
      ],
    });
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { userId },
      relations: ['items', 'items.product', 'payment'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.ordersRepository.findOne({
      where: { orderNumber },
      relations: ['user', 'items', 'items.product', 'payment'],
    });
  }

  async update(id: string, updateData: Partial<Order>): Promise<Order | null> {
    await this.ordersRepository.update(id, updateData);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.ordersRepository.delete(id);
  }

  async findWithPagination(
    page: number,
    limit: number,
    filters?: {
      status?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ orders: Order[]; total: number }> {
    const skip = (page - 1) * limit;
    const query = this.ordersRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.payment', 'payment');

    if (filters?.status) {
      query.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters?.userId) {
      query.andWhere('order.userId = :userId', { userId: filters.userId });
    }

    if (filters?.startDate) {
      query.andWhere('order.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('order.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const [orders, total] = await query
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { orders, total };
  }

  async getOrderStats(filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    statusBreakdown: Record<string, number>;
  }> {
    const query = this.ordersRepository.createQueryBuilder('order');

    if (filters?.startDate) {
      query.andWhere('order.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('order.createdAt <= :endDate', { endDate: filters.endDate });
    }

    if (filters?.status) {
      query.andWhere('order.status = :status', { status: filters.status });
    }

    const orders = await query.getMany();

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const statusBreakdown = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      statusBreakdown,
    };
  }
}
