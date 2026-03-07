import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Payment } from '../entities/payment.entity';

interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  notes: any;
}

interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id?: string;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status?: string;
  captured: boolean;
  description: string;
  notes: any;
  created_at: number;
}

@Injectable()
export class RazorpayProvider {
  private razorpay: any;

  constructor(private configService: ConfigService) {
    const Razorpay = require('razorpay');
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET'),
    });
  }

  async createPayment(payment: Payment): Promise<any> {
    try {
      const order: RazorpayOrder = await this.razorpay.orders.create({
        amount: Math.round(payment.amount * 100), // Convert to paise
        currency: payment.currency.toUpperCase(),
        receipt: payment.id,
        notes: {
          orderId: payment.orderId,
          paymentId: payment.id,
        },
      });

      return {
        id: order.id,
        amount: order.amount / 100,
        currency: order.currency,
        status: this.mapRazorpayStatus(order.status),
        key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
      };
    } catch (error) {
      throw new Error(`Razorpay payment creation failed: ${error.message}`);
    }
  }

  async verifyPayment(payment: Payment): Promise<boolean> {
    try {
      const razorpayPayment = await this.razorpay.payments.fetch(payment.providerPaymentId);
      return razorpayPayment.status === 'captured';
    } catch (error) {
      return false;
    }
  }

  async refund(payment: Payment, amount: number): Promise<any> {
    try {
      const refund = await this.razorpay.payments.refund(payment.providerPaymentId, {
        amount: Math.round(amount * 100), // Convert to paise
        notes: {
          orderId: payment.orderId,
          paymentId: payment.id,
          reason: payment.refundReason || 'Customer requested',
        },
      });

      return {
        id: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
      };
    } catch (error) {
      throw new Error(`Razorpay refund failed: ${error.message}`);
    }
  }

  async handleWebhook(headers: any, webhookData: any): Promise<any> {
    try {
      const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
      const signature = headers['x-razorpay-signature'];
      
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(webhookData)
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new Error('Invalid webhook signature');
      }

      const event = JSON.parse(webhookData);

      switch (event.event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(event.payload.payment.entity);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(event.payload.payment.entity);
          break;
        case 'payment.authorized':
          await this.handlePaymentAuthorized(event.payload.payment.entity);
          break;
        default:
          console.log(`Unhandled webhook event type: ${event.event}`);
      }

      return { received: true, event: event.event };
    } catch (error) {
      throw new Error(`Webhook processing failed: ${error.message}`);
    }
  }

  private async handlePaymentCaptured(payment: RazorpayPayment): Promise<void> {
    // Update payment status in database
    console.log(`Payment captured: ${payment.id}`);
  }

  private async handlePaymentFailed(payment: RazorpayPayment): Promise<void> {
    // Update payment status in database
    console.log(`Payment failed: ${payment.id}`);
  }

  private async handlePaymentAuthorized(payment: RazorpayPayment): Promise<void> {
    // Update payment status in database
    console.log(`Payment authorized: ${payment.id}`);
  }

  private mapRazorpayStatus(razorpayStatus: string): string {
    switch (razorpayStatus) {
      case 'created':
        return 'PENDING';
      case 'attempted':
        return 'PROCESSING';
      case 'paid':
        return 'COMPLETED';
      default:
        return 'FAILED';
    }
  }

  async createOrder(orderData: {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: any;
  }): Promise<any> {
    try {
      const order = await this.razorpay.orders.create({
        amount: Math.round(orderData.amount * 100), // Convert to paise
        currency: orderData.currency.toUpperCase(),
        receipt: orderData.receipt,
        notes: orderData.notes,
      });

      return {
        id: order.id,
        amount: order.amount / 100,
        currency: order.currency,
        status: this.mapRazorpayStatus(order.status),
      };
    } catch (error) {
      throw new Error(`Razorpay order creation failed: ${error.message}`);
    }
  }

  async fetchPayment(paymentId: string): Promise<any> {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return {
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: this.mapRazorpayStatus(payment.status),
        method: payment.method,
        captured: payment.captured,
        created_at: new Date(payment.created_at * 1000),
      };
    } catch (error) {
      throw new Error(`Razorpay payment fetch failed: ${error.message}`);
    }
  }
}
