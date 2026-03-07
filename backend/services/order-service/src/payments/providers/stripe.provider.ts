import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class StripeProvider {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  async createPayment(payment: Payment): Promise<any> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(payment.amount * 100), // Convert to cents
        currency: payment.currency.toLowerCase(),
        metadata: {
          orderId: payment.orderId,
          paymentId: payment.id,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: paymentIntent.amount / 100,
      };
    } catch (error) {
      throw new Error(`Stripe payment creation failed: ${error.message}`);
    }
  }

  async verifyPayment(payment: Payment): Promise<boolean> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(payment.providerPaymentId);
      return paymentIntent.status === 'succeeded';
    } catch (error) {
      return false;
    }
  }

  async refund(payment: Payment, amount: number): Promise<any> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.providerPaymentId,
        amount: Math.round(amount * 100), // Convert to cents
        metadata: {
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
      throw new Error(`Stripe refund failed: ${error.message}`);
    }
  }

  async handleWebhook(signature: string, webhookData: any): Promise<any> {
    try {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      const event = this.stripe.webhooks.constructEvent(
        webhookData,
        signature,
        webhookSecret
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object);
          break;
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }

      return { received: true, event: event.type };
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }

  private async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
    // Update payment status in database
    // This would be handled by the payment service
    console.log(`Payment succeeded: ${paymentIntent.id}`);
  }

  private async handlePaymentFailed(paymentIntent: any): Promise<void> {
    // Update payment status in database
    console.log(`Payment failed: ${paymentIntent.id}`);
  }

  private async handlePaymentCanceled(paymentIntent: any): Promise<void> {
    // Update payment status in database
    console.log(`Payment canceled: ${paymentIntent.id}`);
  }

  private mapStripeStatus(stripeStatus: string): string {
    switch (stripeStatus) {
      case 'requires_payment_method':
        return 'PENDING';
      case 'requires_confirmation':
        return 'PENDING';
      case 'requires_action':
        return 'PENDING';
      case 'processing':
        return 'PROCESSING';
      case 'succeeded':
        return 'COMPLETED';
      case 'canceled':
        return 'CANCELLED';
      default:
        return 'FAILED';
    }
  }

  async createCustomer(customerData: {
    email: string;
    name?: string;
    phone?: string;
  }): Promise<any> {
    try {
      const customer = await this.stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
      });

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      };
    } catch (error) {
      throw new Error(`Stripe customer creation failed: ${error.message}`);
    }
  }

  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<any> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
      };
    } catch (error) {
      throw new Error(`Payment method attachment failed: ${error.message}`);
    }
  }
}
