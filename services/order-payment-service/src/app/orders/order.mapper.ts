import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import {
  OrderResponseDTO,
  OrderItemResponseDTO,
  OrderListResponseDTO,
  OrderSummaryDTO,
  CreateOrderDTO,
  UpdateOrderDTO,
  OrderEntity,
  OrderItemEntity,
  OrderCalculation,
  OrderStatistics,
  OrderCreatedEvent,
  OrderStatusChangedEvent,
  OrderCancelledEvent,
  ShippingAddressDTO,
  BillingAddressDTO,
} from './order.types';

export class OrderMapper {
  static toResponseDTO(order: OrderEntity): OrderResponseDTO {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      items: order.items
        ? order.items.map((item) => this.toItemResponseDTO(item))
        : [],
      subtotal: order.subtotal.toNumber(),
      taxAmount: order.taxAmount.toNumber(),
      shippingAmount: order.shippingAmount.toNumber(),
      discountAmount: order.discountAmount.toNumber(),
      totalAmount: order.totalAmount.toNumber(),
      shippingAddress: JSON.parse(order.shippingAddress as string),
      billingAddress: JSON.parse(order.billingAddress as string),
      trackingNumber: order.trackingNumber || undefined,
      estimatedDeliveryDate: order.estimatedDeliveryDate || undefined,
      notes: order.notes || undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  static toItemResponseDTO(item: OrderItemEntity): OrderItemResponseDTO {
    return {
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage || undefined,
      variantId: item.variantId || undefined,
      variantName: item.variantName || undefined,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
      discount: item.discount.toNumber(),
      taxAmount: item.taxAmount.toNumber(),
      subtotal: item.subtotal.toNumber(),
      total: item.total.toNumber(),
      customization: item.customization
        ? JSON.parse(item.customization as string)
        : undefined,
    };
  }

  static toListResponseDTO(
    orders: OrderEntity[],
    total: number,
    page: number,
    limit: number
  ): OrderListResponseDTO {
    return {
      orders: orders.map((order) => this.toResponseDTO(order)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static toSummaryDTO(order: OrderEntity): OrderSummaryDTO {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount.toNumber(),
      itemCount: order.items?.length || 0,
      createdAt: order.createdAt,
    };
  }

  static toPrismaCreateInput(
    dto: CreateOrderDTO,
    orderNumber: string,
    calculation: OrderCalculation
  ): Prisma.OrderCreateInput {
    return {
      orderNumber,
      customer: {
        connect: { id: dto.customerId },
      },
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: new Prisma.Decimal(calculation.subtotal),
      taxAmount: new Prisma.Decimal(calculation.taxAmount),
      shippingAmount: new Prisma.Decimal(calculation.shippingAmount),
      discountAmount: new Prisma.Decimal(calculation.discountAmount),
      totalAmount: new Prisma.Decimal(calculation.totalAmount),
      shippingAddress: JSON.stringify(dto.shippingAddress),
      billingAddress: JSON.stringify(dto.billingAddress),
      couponCode: dto.couponCode,
      notes: dto.notes,
      deliveryPreference: dto.deliveryPreference,
      items: {
        create: dto.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: '',
          sku: '',
          quantity: item.quantity,
          unitPrice: new Prisma.Decimal(0),
          discount: new Prisma.Decimal(0),
          taxAmount: new Prisma.Decimal(0),
          subtotal: new Prisma.Decimal(0),
          total: new Prisma.Decimal(0),
          customization: item.customization
            ? JSON.stringify(item.customization)
            : null,
        })),
      },
    };
  }

  static toPrismaUpdateInput(dto: UpdateOrderDTO): Prisma.OrderUpdateInput {
    const updateData: Prisma.OrderUpdateInput = {};

    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }

    if (dto.trackingNumber !== undefined) {
      updateData.trackingNumber = dto.trackingNumber;
    }

    if (dto.estimatedDeliveryDate !== undefined) {
      updateData.estimatedDeliveryDate = dto.estimatedDeliveryDate;
    }

    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }

    return updateData;
  }

  static toOrderCreatedEvent(order: OrderEntity): OrderCreatedEvent {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      totalAmount: order.totalAmount.toNumber(),
      items:
        order.items?.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toNumber(),
          total: item.total.toNumber(),
        })) || [],
      createdAt: order.createdAt,
    };
  }

  static toOrderStatusChangedEvent(
    order: OrderEntity,
    fromStatus: OrderStatus,
    toStatus: OrderStatus
  ): OrderStatusChangedEvent {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      fromStatus,
      toStatus,
      changedAt: new Date(),
    };
  }

  static toOrderCancelledEvent(
    order: OrderEntity,
    cancelReason: string,
    refundAmount?: number
  ): OrderCancelledEvent {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      cancelReason,
      refundAmount,
      cancelledAt: new Date(),
    };
  }

  static toStatisticsDTO(data: {
    totalOrders: number;
    statusCounts: Record<OrderStatus, number>;
    totalRevenue: Prisma.Decimal;
    averageOrderValue: Prisma.Decimal;
    from: Date;
    to: Date;
  }): OrderStatistics {
    return {
      totalOrders: data.totalOrders,
      pendingOrders: data.statusCounts[OrderStatus.PENDING] || 0,
      processingOrders: data.statusCounts[OrderStatus.PROCESSING] || 0,
      shippedOrders: data.statusCounts[OrderStatus.SHIPPED] || 0,
      deliveredOrders: data.statusCounts[OrderStatus.DELIVERED] || 0,
      cancelledOrders: data.statusCounts[OrderStatus.CANCELLED] || 0,
      totalRevenue: data.totalRevenue.toNumber(),
      averageOrderValue: data.averageOrderValue.toNumber(),
      period: {
        from: data.from,
        to: data.to,
      },
    };
  }

  static toShippingAddressDTO(jsonString: string): ShippingAddressDTO {
    return JSON.parse(jsonString);
  }

  static toBillingAddressDTO(jsonString: string): BillingAddressDTO {
    return JSON.parse(jsonString);
  }

  static fromShippingAddressDTO(dto: ShippingAddressDTO): string {
    return JSON.stringify(dto);
  }

  static fromBillingAddressDTO(dto: BillingAddressDTO): string {
    return JSON.stringify(dto);
  }

  static enrichOrderItemWithProductData(
    item: Prisma.OrderItemCreateInput,
    productData: {
      name: string;
      sku: string;
      image?: string;
      price: number;
    }
  ): Prisma.OrderItemCreateInput {
    return {
      ...item,
      productName: productData.name,
      sku: productData.sku,
      productImage: productData.image,
      unitPrice: new Prisma.Decimal(productData.price),
    };
  }

  static calculateItemTotals(
    quantity: number,
    unitPrice: number,
    discount: number,
    taxRate: number
  ): {
    subtotal: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    total: Prisma.Decimal;
  } {
    const subtotal = quantity * unitPrice - discount;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    return {
      subtotal: new Prisma.Decimal(subtotal),
      taxAmount: new Prisma.Decimal(taxAmount),
      total: new Prisma.Decimal(total),
    };
  }

  static normalizeOrderNumber(orderNumber: string): string {
    return orderNumber.toUpperCase().trim();
  }

  static generateOrderNumber(prefix: string = 'ORD'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  static toMinimalDTO(order: Order): {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    totalAmount: number;
  } {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount.toNumber(),
    };
  }

  static extractCustomerEmailFromShipping(
    shippingAddress: string
  ): string | null {
    try {
      const parsed = JSON.parse(shippingAddress);
      return parsed.email || null;
    } catch {
      return null;
    }
  }

  static isOrderEditable(status: OrderStatus): boolean {
    return [OrderStatus.PENDING, OrderStatus.PROCESSING].includes(status);
  }

  static isOrderCancellable(status: OrderStatus): boolean {
    return ![
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ].includes(status);
  }

  static canRefund(
    status: OrderStatus,
    paymentStatus: PaymentStatus
  ): boolean {
    return (
      [OrderStatus.CANCELLED, OrderStatus.RETURNED].includes(status) &&
      paymentStatus === PaymentStatus.PAID
    );
  }

  static groupByStatus(orders: OrderEntity[]): Map<OrderStatus, OrderEntity[]> {
    const grouped = new Map<OrderStatus, OrderEntity[]>();

    orders.forEach((order) => {
      const existing = grouped.get(order.status) || [];
      grouped.set(order.status, [...existing, order]);
    });

    return grouped;
  }

  static sortByCreatedDate(
    orders: OrderEntity[],
    direction: 'asc' | 'desc' = 'desc'
  ): OrderEntity[] {
    return [...orders].sort((a, b) => {
      const dateA = a.createdAt.getTime();
      const dateB = b.createdAt.getTime();
      return direction === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }

  static filterByDateRange(
    orders: OrderEntity[],
    from: Date,
    to: Date
  ): OrderEntity[] {
    return orders.filter(
      (order) => order.createdAt >= from && order.createdAt <= to
    );
  }

  static calculateTotalRevenue(orders: OrderEntity[]): number {
    return orders.reduce(
      (sum, order) => sum + order.totalAmount.toNumber(),
      0
    );
  }

  static getAverageOrderValue(orders: OrderEntity[]): number {
    if (orders.length === 0) return 0;
    return this.calculateTotalRevenue(orders) / orders.length;
  }
}