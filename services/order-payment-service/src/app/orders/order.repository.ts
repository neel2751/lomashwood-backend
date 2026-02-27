import { prisma } from '../../infrastructure/db/prisma.client';
import { Order, OrderStatus, Prisma } from '@prisma/client';
import { OrderStatistics } from './order.types';
import { logger } from '../../config/logger';

export class OrderRepository {
  async createOrder(data: Prisma.OrderCreateInput): Promise<Order> {
    try {
      return await prisma.order.create({
        data,
        include: {
          items: true,
          payments: true,
        },
      });
    } catch (error) {
      logger.error('Repository: Error creating order', error);
      throw error;
    }
  }

  async findOrderById(id: string): Promise<Order | null> {
    try {
      return await prisma.order.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          items: true,
          payments: true,
        },
      });
    } catch (error) {
      logger.error('Repository: Error finding order by ID', { id, error });
      throw error;
    }
  }

  async findOrderByNumber(orderNumber: string): Promise<Order | null> {
    try {
      return await prisma.order.findFirst({
        where: {
          orderNumber,
          deletedAt: null,
        },
        include: {
          items: true,
          payments: true,
        },
      });
    } catch (error) {
      logger.error('Repository: Error finding order by number', { orderNumber, error });
      throw error;
    }
  }

  async findOrders(
    filters: Prisma.OrderWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ orders: Order[]; total: number }> {
    try {
      const where: Prisma.OrderWhereInput = {
        ...filters,
        deletedAt: null,
      };

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: true,
            payments: true,
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder,
          },
        }),
        prisma.order.count({ where }),
      ]);

      return { orders, total };
    } catch (error) {
      logger.error('Repository: Error finding orders', { filters, error });
      throw error;
    }
  }

  async findOrdersByCustomerId(
    customerId: string,
    status?: OrderStatus
  ): Promise<Order[]> {
    try {
      const where: Prisma.OrderWhereInput = {
        customerId,
        deletedAt: null,
      };

      if (status) {
        where.status = status;
      }

      return await prisma.order.findMany({
        where,
        include: {
          items: true,
          payments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      logger.error('Repository: Error finding orders by customer', { customerId, error });
      throw error;
    }
  }

  async findOrdersByDateRange(
    startDate: Date,
    endDate: Date,
    status?: OrderStatus
  ): Promise<Order[]> {
    try {
      const where: Prisma.OrderWhereInput = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      };

      if (status) {
        where.status = status;
      }

      return await prisma.order.findMany({
        where,
        include: {
          items: true,
          payments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      logger.error('Repository: Error finding orders by date range', { startDate, endDate, error });
      throw error;
    }
  }

  async updateOrder(id: string, data: Prisma.OrderUpdateInput): Promise<Order> {
    try {
      return await prisma.order.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          items: true,
          payments: true,
        },
      });
    } catch (error) {
      logger.error('Repository: Error updating order', { id, error });
      throw error;
    }
  }

  async updateOrderWithHistory(
    id: string,
    data: Prisma.OrderUpdateInput,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    changedBy?: string,
    notes?: string
  ): Promise<Order> {
    try {
      return await prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: { id },
          data: {
            ...data,
            updatedAt: new Date(),
          },
          include: {
            items: true,
            payments: true,
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            fromStatus,
            toStatus,
            changedBy,
            notes,
          },
        });

        return updatedOrder;
      });
    } catch (error) {
      logger.error('Repository: Error updating order with history', { id, error });
      throw error;
    }
  }

  async bulkUpdateOrderStatus(
    orderIds: string[],
    status: OrderStatus,
    changedBy?: string
  ): Promise<number> {
    try {
      return await prisma.$transaction(async (tx) => {
        const result = await tx.order.updateMany({
          where: {
            id: { in: orderIds },
            deletedAt: null,
          },
          data: {
            status,
            updatedAt: new Date(),
          },
        });

        const historyRecords = orderIds.map(orderId => ({
          orderId,
          fromStatus: OrderStatus.PENDING,
          toStatus: status,
          changedBy,
          notes: 'Bulk status update',
        }));

        await tx.orderStatusHistory.createMany({
          data: historyRecords,
        });

        return result.count;
      });
    } catch (error) {
      logger.error('Repository: Error bulk updating order status', { orderIds, error });
      throw error;
    }
  }

  async softDeleteOrder(id: string): Promise<void> {
    try {
      await prisma.order.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Repository: Error soft deleting order', { id, error });
      throw error;
    }
  }

  async permanentlyDeleteOrder(id: string): Promise<void> {
    try {
      await prisma.order.delete({
        where: { id },
      });
    } catch (error) {
      logger.error('Repository: Error permanently deleting order', { id, error });
      throw error;
    }
  }

  async restoreOrder(id: string): Promise<Order> {
    try {
      return await prisma.order.update({
        where: { id },
        data: {
          deletedAt: null,
          updatedAt: new Date(),
        },
        include: {
          items: true,
          payments: true,
        },
      });
    } catch (error) {
      logger.error('Repository: Error restoring order', { id, error });
      throw error;
    }
  }

  async getOrderStatusHistory(orderId: string): Promise<any[]> {
    try {
      return await prisma.orderStatusHistory.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Repository: Error fetching order status history', { orderId, error });
      throw error;
    }
  }

  async getOrderStatistics(customerId?: string): Promise<OrderStatistics> {
    try {
      const where: Prisma.OrderWhereInput = {
        deletedAt: null,
      };

      if (customerId) {
        where.customerId = customerId;
      }

      const [
        totalOrders,
        totalRevenue,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        averageOrderValue,
      ] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.aggregate({
          where: {
            ...where,
            status: { not: OrderStatus.CANCELLED },
          },
          _sum: { total: true },
        }),
        prisma.order.count({
          where: { ...where, status: OrderStatus.PENDING },
        }),
        prisma.order.count({
          where: { ...where, status: OrderStatus.PROCESSING },
        }),
        prisma.order.count({
          where: { ...where, status: OrderStatus.SHIPPED },
        }),
        prisma.order.count({
          where: { ...where, status: OrderStatus.DELIVERED },
        }),
        prisma.order.count({
          where: { ...where, status: OrderStatus.CANCELLED },
        }),
        prisma.order.aggregate({
          where: {
            ...where,
            status: { not: OrderStatus.CANCELLED },
          },
          _avg: { total: true },
        }),
      ]);

      return {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        averageOrderValue: Math.round(averageOrderValue._avg.total || 0),
        ordersByStatus: {
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
      };
    } catch (error) {
      logger.error('Repository: Error fetching order statistics', error);
      throw error;
    }
  }

  async getRevenueByPeriod(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ date: string; revenue: number; orderCount: number }>> {
    try {
      const dateFormat = groupBy === 'day' 
        ? 'YYYY-MM-DD' 
        : groupBy === 'week' 
        ? 'YYYY-"W"IW' 
        : 'YYYY-MM';

      const result = await prisma.$queryRaw<Array<{ date: string; revenue: bigint; orderCount: bigint }>>`
        SELECT 
          TO_CHAR(created_at, ${dateFormat}) as date,
          SUM(total) as revenue,
          COUNT(*) as "orderCount"
        FROM orders
        WHERE created_at >= ${startDate}
          AND created_at <= ${endDate}
          AND status != ${OrderStatus.CANCELLED}
          AND deleted_at IS NULL
        GROUP BY TO_CHAR(created_at, ${dateFormat})
        ORDER BY date ASC
      `;

      return result.map(row => ({
        date: row.date,
        revenue: Number(row.revenue),
        orderCount: Number(row.orderCount),
      }));
    } catch (error) {
      logger.error('Repository: Error fetching revenue by period', { startDate, endDate, error });
      throw error;
    }
  }

  async getTopCustomersByRevenue(limit: number = 10): Promise<Array<{
    customerId: string;
    totalRevenue: number;
    orderCount: number;
  }>> {
    try {
      const result = await prisma.order.groupBy({
        by: ['customerId'],
        where: {
          status: { not: OrderStatus.CANCELLED },
          deletedAt: null,
        },
        _sum: {
          total: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            total: 'desc',
          },
        },
        take: limit,
      });

      return result.map(row => ({
        customerId: row.customerId,
        totalRevenue: row._sum.total || 0,
        orderCount: row._count.id,
      }));
    } catch (error) {
      logger.error('Repository: Error fetching top customers', error);
      throw error;
    }
  }

  async getPendingOrdersOlderThan(hours: number): Promise<Order[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - hours);

      return await prisma.order.findMany({
        where: {
          status: OrderStatus.PENDING,
          createdAt: {
            lt: cutoffDate,
          },
          deletedAt: null,
        },
        include: {
          items: true,
          payments: true,
        },
      });
    } catch (error) {
      logger.error('Repository: Error fetching pending orders', { hours, error });
      throw error;
    }
  }

  async getOrdersWithoutPayment(): Promise<Order[]> {
    try {
      return await prisma.order.findMany({
        where: {
          status: {
            in: [OrderStatus.PENDING, OrderStatus.CONFIRMED],
          },
          payments: {
            none: {},
          },
          deletedAt: null,
        },
        include: {
          items: true,
          payments: true,
        },
      });
    } catch (error) {
      logger.error('Repository: Error fetching orders without payment', error);
      throw error;
    }
  }

  async countOrdersByStatus(status: OrderStatus): Promise<number> {
    try {
      return await prisma.order.count({
        where: {
          status,
          deletedAt: null,
        },
      });
    } catch (error) {
      logger.error('Repository: Error counting orders by status', { status, error });
      throw error;
    }
  }

  async getOrdersByProductId(productId: string): Promise<Order[]> {
    try {
      return await prisma.order.findMany({
        where: {
          items: {
            some: {
              productId,
            },
          },
          deletedAt: null,
        },
        include: {
          items: true,
          payments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      logger.error('Repository: Error fetching orders by product', { productId, error });
      throw error;
    }
  }

  async searchOrders(searchTerm: string): Promise<Order[]> {
    try {
      return await prisma.order.findMany({
        where: {
          OR: [
            { orderNumber: { contains: searchTerm, mode: 'insensitive' } },
            { customerEmail: { contains: searchTerm, mode: 'insensitive' } },
            { customerPhone: { contains: searchTerm, mode: 'insensitive' } },
            { trackingNumber: { contains: searchTerm, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
        include: {
          items: true,
          payments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });
    } catch (error) {
      logger.error('Repository: Error searching orders', { searchTerm, error });
      throw error;
    }
  }
}