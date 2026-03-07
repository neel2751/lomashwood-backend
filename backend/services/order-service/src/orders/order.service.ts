import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, PaginatedResponse } from '../../../../../packages/api-client/src/types/api.types';

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  shippingAddress: any;
  billingAddress: any;
  notes?: string;
  estimatedDelivery?: Date;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'STRIPE' | 'RAZORPAY' | 'BANK_TRANSFER';
  provider: string;
  transactionId?: string;
  gatewayResponse?: any;
  failureReason?: string;
  refundedAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Invoice {
  id: string;
  orderId: string;
  customerId: string;
  invoiceNumber: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  items: any;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  dueDate: Date;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Refund {
  id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'FAILED';
  refundId?: string;
  processedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface GetOrdersParams {
  page: number;
  limit: number;
  filters: {
    status?: string;
    customerId?: string;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

export class OrderService {
  private orders: Order[] = [];
  private payments: Payment[] = [];
  private invoices: Invoice[] = [];
  private refunds: Refund[] = [];

  constructor() {
    this.initializeMockData();
  }

  async getOrders(params: GetOrdersParams): Promise<PaginatedResponse<Order[]>> {
    try {
      let filteredOrders = [...this.orders];

      // Apply filters
      if (params.filters.status) {
        filteredOrders = filteredOrders.filter(o => o.status === params.filters.status);
      }

      if (params.filters.customerId) {
        filteredOrders = filteredOrders.filter(o => o.customerId === params.filters.customerId);
      }

      if (params.filters.startDate) {
        filteredOrders = filteredOrders.filter(o => o.createdAt >= params.filters.startDate!);
      }

      if (params.filters.endDate) {
        filteredOrders = filteredOrders.filter(o => o.createdAt <= params.filters.endDate!);
      }

      // Sort orders
      const sortBy = params.filters.sortBy || 'createdAt';
      const sortOrder = params.filters.sortOrder || 'desc';
      
      filteredOrders.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Order];
        let bValue: any = b[sortBy as keyof Order];
        
        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // Pagination
      const total = filteredOrders.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedOrders,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get orders error:', error);
      return {
        success: false,
        message: 'Failed to fetch orders',
        error: 'GET_ORDERS_FAILED',
      };
    }
  }

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    try {
      const order = this.orders.find(o => o.id === id);
      
      if (!order) {
        return {
          success: false,
          message: 'Order not found',
          error: 'ORDER_NOT_FOUND',
        };
      }

      return {
        success: true,
        data: order,
      };
    } catch (error) {
      console.error('Get order error:', error);
      return {
        success: false,
        message: 'Failed to fetch order',
        error: 'GET_ORDER_FAILED',
      };
    }
  }

  async createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Order>> {
    try {
      const orderNumber = this.generateOrderNumber();
      
      const order: Order = {
        id: uuidv4(),
        orderNumber,
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.orders.push(order);

      return {
        success: true,
        data: order,
      };
    } catch (error) {
      console.error('Create order error:', error);
      return {
        success: false,
        message: 'Failed to create order',
        error: 'CREATE_ORDER_FAILED',
      };
    }
  }

  async updateOrder(id: string, orderData: Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Order>> {
    try {
      const orderIndex = this.orders.findIndex(o => o.id === id);
      
      if (orderIndex === -1) {
        return {
          success: false,
          message: 'Order not found',
          error: 'ORDER_NOT_FOUND',
        };
      }

      const updatedOrder: Order = {
        ...this.orders[orderIndex],
        ...orderData,
        updatedAt: new Date(),
      };

      this.orders[orderIndex] = updatedOrder;

      return {
        success: true,
        data: updatedOrder,
      };
    } catch (error) {
      console.error('Update order error:', error);
      return {
        success: false,
        message: 'Failed to update order',
        error: 'UPDATE_ORDER_FAILED',
      };
    }
  }

  async cancelOrder(id: string, reason: string): Promise<ApiResponse<Order>> {
    try {
      const orderIndex = this.orders.findIndex(o => o.id === id);
      
      if (orderIndex === -1) {
        return {
          success: false,
          message: 'Order not found',
          error: 'ORDER_NOT_FOUND',
        };
      }

      // Only allow cancellation of orders that are not already shipped/delivered/cancelled
      const order = this.orders[orderIndex];
      if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status)) {
        return {
          success: false,
          message: 'Order cannot be cancelled at this stage',
          error: 'ORDER_CANNOT_BE_CANCELLED',
        };
      }

      const updatedOrder: Order = {
        ...order,
        status: 'CANCELLED',
        notes: reason,
        updatedAt: new Date(),
      };

      this.orders[orderIndex] = updatedOrder;

      return {
        success: true,
        data: updatedOrder,
      };
    } catch (error) {
      console.error('Cancel order error:', error);
      return {
        success: false,
        message: 'Failed to cancel order',
        error: 'CANCEL_ORDER_FAILED',
      };
    }
  }

  async createPayment(paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Payment>> {
    try {
      const payment: Payment = {
        id: uuidv4(),
        ...paymentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.payments.push(payment);

      return {
        success: true,
        data: payment,
      };
    } catch (error) {
      console.error('Create payment error:', error);
      return {
        success: false,
        message: 'Failed to create payment',
        error: 'CREATE_PAYMENT_FAILED',
      };
    }
  }

  async updatePaymentStatus(id: string, status: Payment['status'], gatewayResponse?: any): Promise<ApiResponse<Payment>> {
    try {
      const paymentIndex = this.payments.findIndex(p => p.id === id);
      
      if (paymentIndex === -1) {
        return {
          success: false,
          message: 'Payment not found',
          error: 'PAYMENT_NOT_FOUND',
        };
      }

      const updatedPayment: Payment = {
        ...this.payments[paymentIndex],
        status,
        gatewayResponse,
        updatedAt: new Date(),
      };

      this.payments[paymentIndex] = updatedPayment;

      return {
        success: true,
        data: updatedPayment,
      };
    } catch (error) {
      console.error('Update payment status error:', error);
      return {
        success: false,
        message: 'Failed to update payment status',
        error: 'UPDATE_PAYMENT_STATUS_FAILED',
      };
    }
  }

  async processRefund(refundData: Omit<Refund, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Refund>> {
    try {
      const refund: Refund = {
        id: uuidv4(),
        ...refundData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.refunds.push(refund);

      return {
        success: true,
        data: refund,
      };
    } catch (error) {
      console.error('Process refund error:', error);
      return {
        success: false,
        message: 'Failed to process refund',
        error: 'PROCESS_REFUND_FAILED',
      };
    }
  }

  async getInvoices(orderId: string): Promise<ApiResponse<Invoice[]>> {
    try {
      const orderInvoices = this.invoices.filter(i => i.orderId === orderId);
      
      return {
        success: true,
        data: orderInvoices,
      };
    } catch (error) {
      console.error('Get invoices error:', error);
      return {
        success: false,
        message: 'Failed to fetch invoices',
        error: 'GET_INVOICES_FAILED',
      };
    }
  }

  async generateInvoice(orderId: string): Promise<ApiResponse<Invoice>> {
    try {
      const order = this.orders.find(o => o.id === orderId);
      
      if (!order) {
        return {
          success: false,
          message: 'Order not found',
          error: 'ORDER_NOT_FOUND',
        };
      }

      const invoiceNumber = this.generateInvoiceNumber();
      
      const invoice: Invoice = {
        id: uuidv4(),
        orderId,
        customerId: order.customerId,
        invoiceNumber,
        status: 'DRAFT',
        items: order.items,
        subtotal: order.subtotal,
        taxAmount: order.tax,
        total: order.total,
        currency: order.currency,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.invoices.push(invoice);

      return {
        success: true,
        data: invoice,
      };
    } catch (error) {
      console.error('Generate invoice error:', error);
      return {
        success: false,
        message: 'Failed to generate invoice',
        error: 'GENERATE_INVOICE_FAILED',
      };
    }
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD${timestamp}${random}`;
  }

  private generateInvoiceNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV${timestamp}${random}`;
  }

  private initializeMockData(): void {
    // Initialize mock orders
    this.orders = [
      {
        id: uuidv4(),
        orderNumber: 'ORD123456789',
        customerId: 'customer-1',
        status: 'CONFIRMED',
        items: [
          {
            id: uuidv4(),
            orderId: 'order-1',
            productId: 'product-1',
            productName: 'Modern Kitchen Cabinet Set',
            productImage: '/images/products/kitchen-1.jpg',
            quantity: 1,
            unitPrice: 2499.99,
            totalPrice: 2499.99,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        subtotal: 2499.99,
        tax: 249.99,
        shipping: 50.00,
        discount: 0,
        total: 2799.98,
        currency: 'GBP',
        shippingAddress: {
          street: '123 Main St',
          city: 'London',
          postalCode: 'SW1A 1AA',
          country: 'UK',
        },
        billingAddress: {
          street: '123 Main St',
          city: 'London',
          postalCode: 'SW1A 1AA',
          country: 'UK',
        },
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Initialize mock payments
    this.payments = [
      {
        id: uuidv4(),
        orderId: this.orders[0].id,
        customerId: 'customer-1',
        amount: 2799.98,
        currency: 'GBP',
        status: 'COMPLETED',
        method: 'CREDIT_CARD',
        provider: 'stripe',
        transactionId: 'txn_123456789',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}
