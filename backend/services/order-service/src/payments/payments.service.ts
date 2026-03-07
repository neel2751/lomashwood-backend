import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { StripeProvider } from './providers/stripe.provider';
import { RazorpayProvider } from './providers/razorpay.provider';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private stripeProvider: StripeProvider,
    private razorpayProvider: RazorpayProvider,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const { orderId, amount, currency, method, provider } = createPaymentDto;

    // Create payment record
    const payment = this.paymentsRepository.create({
      orderId,
      amount,
      currency: currency || 'USD',
      method,
      provider,
      status: 'PENDING',
    });

    const savedPayment = await this.paymentsRepository.save(payment);

    // Process payment with provider
    let providerResponse;
    switch (provider) {
      case 'STRIPE':
        providerResponse = await this.stripeProvider.createPayment(savedPayment);
        break;
      case 'RAZORPAY':
        providerResponse = await this.razorpayProvider.createPayment(savedPayment);
        break;
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }

    // Update payment with provider response
    await this.paymentsRepository.update(savedPayment.id, {
      providerPaymentId: providerResponse.id,
      providerResponse: providerResponse,
      status: providerResponse.status,
    });

    return this.findById(savedPayment.id);
  }

  async findById(id: string): Promise<Payment | null> {
    return this.paymentsRepository.findOne({
      where: { id },
      relations: ['order', 'order.user'],
    });
  }

  async findByOrder(orderId: string): Promise<Payment[]> {
    return this.paymentsRepository.find({
      where: { orderId },
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: string, notes?: string): Promise<Payment | null> {
    await this.paymentsRepository.update(id, {
      status,
      notes,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async refund(paymentId: string, amount?: number, reason?: string): Promise<Payment | null> {
    const payment = await this.findById(paymentId);
    if (!payment) {
      return null;
    }

    if (payment.status !== 'COMPLETED') {
      return null;
    }

    const refundAmount = amount || payment.amount;

    // Process refund with provider
    let refundResponse;
    switch (payment.provider) {
      case 'STRIPE':
        refundResponse = await this.stripeProvider.refund(payment, refundAmount);
        break;
      case 'RAZORPAY':
        refundResponse = await this.razorpayProvider.refund(payment, refundAmount);
        break;
      default:
        throw new Error(`Unsupported payment provider: ${payment.provider}`);
    }

    // Update payment record
    await this.paymentsRepository.update(paymentId, {
      status: 'REFUNDED',
      refundAmount,
      refundReason: reason,
      refundId: refundResponse.id,
      refundedAt: new Date(),
      updatedAt: new Date(),
    });

    return this.findById(paymentId);
  }

  async handleStripeWebhook(signature: string, webhookData: any): Promise<any> {
    return this.stripeProvider.handleWebhook(signature, webhookData);
  }

  async handleRazorpayWebhook(headers: any, webhookData: any): Promise<any> {
    return this.razorpayProvider.handleWebhook(headers, webhookData);
  }

  async getOrderPaymentSummary(orderId: string): Promise<{
    totalAmount: number;
    paidAmount: number;
    refundedAmount: number;
    pendingAmount: number;
    payments: Payment[];
  }> {
    const payments = await this.findByOrder(orderId);
    
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const paidAmount = payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, payment) => sum + payment.amount, 0);
    const refundedAmount = payments
      .filter(p => p.status === 'REFUNDED')
      .reduce((sum, payment) => sum + (payment.refundAmount || 0), 0);
    const pendingAmount = totalAmount - paidAmount;

    return {
      totalAmount,
      paidAmount,
      refundedAmount,
      pendingAmount,
      payments,
    };
  }

  async verifyPayment(paymentId: string, provider: string): Promise<boolean> {
    const payment = await this.findById(paymentId);
    if (!payment) {
      return false;
    }

    let isVerified = false;
    switch (provider) {
      case 'STRIPE':
        isVerified = await this.stripeProvider.verifyPayment(payment);
        break;
      case 'RAZORPAY':
        isVerified = await this.razorpayProvider.verifyPayment(payment);
        break;
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }

    if (isVerified) {
      await this.paymentsRepository.update(paymentId, {
        status: 'COMPLETED',
        completedAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return isVerified;
  }

  async getPaymentStats(filters?: {
    startDate?: Date;
    endDate?: Date;
    provider?: string;
    status?: string;
  }): Promise<{
    totalPayments: number;
    totalAmount: number;
    averageAmount: number;
    providerBreakdown: Record<string, number>;
    statusBreakdown: Record<string, number>;
  }> {
    const query = this.paymentsRepository.createQueryBuilder('payment');

    if (filters?.startDate) {
      query.andWhere('payment.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('payment.createdAt <= :endDate', { endDate: filters.endDate });
    }

    if (filters?.provider) {
      query.andWhere('payment.provider = :provider', { provider: filters.provider });
    }

    if (filters?.status) {
      query.andWhere('payment.status = :status', { status: filters.status });
    }

    const payments = await query.getMany();

    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

    const providerBreakdown = payments.reduce((acc, payment) => {
      acc[payment.provider] = (acc[payment.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusBreakdown = payments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPayments,
      totalAmount,
      averageAmount,
      providerBreakdown,
      statusBreakdown,
    };
  }
}
