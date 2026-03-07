import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
    userId?: string;
    user?: any;
  }): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
    const { page, limit, status, userId, user } = params;
    const skip = (page - 1) * limit;

    const query = this.ordersRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('orderItems.colour', 'colour')
      .leftJoinAndSelect('orderItems.size', 'size')
      .leftJoinAndSelect('order.payment', 'payment')
      .leftJoinAndSelect('order.invoice', 'invoice');

    // Apply filters based on user role
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      query.andWhere('order.userId = :userId', { userId: user?.id });
    } else if (userId) {
      query.andWhere('order.userId = :userId', { userId });
    }

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    const [orders, total] = await query
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      orders,
      total,
      page,
      limit,
    };
  }

  async findById(id: string, user?: any): Promise<Order | null> {
    const query = this.ordersRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('orderItems.colour', 'colour')
      .leftJoinAndSelect('orderItems.size', 'size')
      .leftJoinAndSelect('order.payment', 'payment')
      .leftJoinAndSelect('order.invoice', 'invoice')
      .leftJoinAndSelect('order.refunds', 'refunds')
      .where('order.id = :id', { id });

    // Apply user access control
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      query.andWhere('order.userId = :userId', { userId: user?.id });
    }

    return query.getOne();
  }

  async findByUser(
    userId: string,
    pagination: { page: number; limit: number },
    user?: any
  ): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Apply user access control
    const targetUserId = (user?.role !== 'ADMIN' && user?.role !== 'STAFF') ? user?.id : userId;

    const [orders, total] = await this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('order.payment', 'payment')
      .where('order.userId = :userId', { userId: targetUserId })
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      orders,
      total,
      page,
      limit,
    };
  }

  async create(createOrderDto: CreateOrderDto, user?: any): Promise<Order> {
    const { items, ...orderData } = createOrderDto;

    const order = this.ordersRepository.create({
      ...orderData,
      userId: user?.id || orderData.userId,
      status: 'PENDING',
      orderNumber: this.generateOrderNumber(),
    });

    const savedOrder = await this.ordersRepository.save(order);

    // Create order items
    const orderItems = items.map(item =>
      this.orderItemsRepository.create({
        orderId: savedOrder.id,
        productId: item.productId,
        colourId: item.colourId,
        sizeId: item.sizeId,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.price * item.quantity,
      })
    );

    await this.orderItemsRepository.save(orderItems);

    return this.findById(savedOrder.id);
  }

  async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto): Promise<Order | null> {
    const { status, notes } = updateStatusDto;

    await this.ordersRepository.update(id, {
      status,
      notes,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async cancel(id: string, user?: any): Promise<Order | null> {
    const order = await this.findById(id, user);
    
    if (!order) {
      return null;
    }

    // Check if order can be cancelled
    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      return null;
    }

    await this.ordersRepository.update(id, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy: user?.id,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async getTracking(id: string, user?: any): Promise<any> {
    const order = await this.findById(id, user);
    
    if (!order) {
      return null;
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      estimatedDelivery: order.estimatedDelivery,
      trackingHistory: order.trackingHistory || [],
    };
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  async updateTracking(id: string, trackingData: {
    trackingNumber: string;
    carrier: string;
    estimatedDelivery?: Date;
  }): Promise<Order | null> {
    await this.ordersRepository.update(id, {
      ...trackingData,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async addTrackingHistory(id: string, history: {
    status: string;
    location: string;
    timestamp: Date;
    description?: string;
  }): Promise<Order | null> {
    const order = await this.findById(id);
    
    if (!order) {
      return null;
    }

    const trackingHistory = [...(order.trackingHistory || []), history];
    
    await this.ordersRepository.update(id, {
      trackingHistory,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }
}
