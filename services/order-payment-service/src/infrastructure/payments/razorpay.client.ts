import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export type RazorpayOrderParams = {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
  partial_payment?: boolean;
};

export type RazorpayOrder = {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
};

export type RazorpayPayment = {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string | null;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string;
  contact: string;
  notes: Record<string, string>;
  fee: number | null;
  tax: number | null;
  error_code: string | null;
  error_description: string | null;
  created_at: number;
};

export type RazorpayRefund = {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  notes: Record<string, string>;
  receipt: string | null;
  acquirer_data: Record<string, string>;
  created_at: number;
  batch_id: string | null;
  status: string;
  speed_processed: string;
  speed_requested: string;
};

export type RazorpayRefundParams = {
  amount?: number;
  speed?: 'normal' | 'optimum';
  notes?: Record<string, string>;
  receipt?: string;
};

export type RazorpayWebhookVerificationParams = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export type RazorpayWebhookPayloadVerificationParams = {
  rawBody: string;
  signature: string;
  secret: string;
};

export type RazorpayListParams = {
  from?: number;
  to?: number;
  count?: number;
  skip?: number;
};

export type RazorpayList<T> = {
  entity: string;
  count: number;
  items: T[];
};

function buildRazorpayClient(): Razorpay {
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

export class RazorpayClient {
  private readonly client: Razorpay;

  constructor() {
    this.client = buildRazorpayClient();
  }

  // ── Orders ─────────────────────────────────────────────────────────────────

  async createOrder(params: RazorpayOrderParams): Promise<RazorpayOrder> {
    try {
      const order = await this.client.orders.create({
        amount: Math.round(params.amount * 100),
        currency: params.currency,
        receipt: params.receipt,
        notes: params.notes,
        partial_payment: params.partial_payment ?? false,
      }) as unknown as RazorpayOrder;

      logger.info('Razorpay order created', {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      });

      return order;
    } catch (error) {
      this.handleRazorpayError('createOrder', error);
    }
  }

  async retrieveOrder(orderId: string): Promise<RazorpayOrder> {
    try {
      return await this.client.orders.fetch(orderId) as unknown as RazorpayOrder;
    } catch (error) {
      this.handleRazorpayError('retrieveOrder', error);
    }
  }

  async listOrders(params: RazorpayListParams = {}): Promise<RazorpayList<RazorpayOrder>> {
    try {
      return await this.client.orders.all(params) as unknown as RazorpayList<RazorpayOrder>;
    } catch (error) {
      this.handleRazorpayError('listOrders', error);
    }
  }

  async fetchOrderPayments(orderId: string): Promise<RazorpayList<RazorpayPayment>> {
    try {
      return await this.client.orders.fetchPayments(orderId) as unknown as RazorpayList<RazorpayPayment>;
    } catch (error) {
      this.handleRazorpayError('fetchOrderPayments', error);
    }
  }

  // ── Payments ───────────────────────────────────────────────────────────────

  async retrievePayment(paymentId: string): Promise<RazorpayPayment> {
    try {
      return await this.client.payments.fetch(paymentId) as unknown as RazorpayPayment;
    } catch (error) {
      this.handleRazorpayError('retrievePayment', error);
    }
  }

  async capturePayment(
    paymentId: string,
    amount: number,
    currency: string,
  ): Promise<RazorpayPayment> {
    try {
      const payment = await this.client.payments.capture(
        paymentId,
        Math.round(amount * 100),
        currency,
      ) as unknown as RazorpayPayment;

      logger.info('Razorpay payment captured', {
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
      });

      return payment;
    } catch (error) {
      this.handleRazorpayError('capturePayment', error);
    }
  }

  async listPayments(params: RazorpayListParams = {}): Promise<RazorpayList<RazorpayPayment>> {
    try {
      return await this.client.payments.all(params) as unknown as RazorpayList<RazorpayPayment>;
    } catch (error) {
      this.handleRazorpayError('listPayments', error);
    }
  }

  // ── Refunds ────────────────────────────────────────────────────────────────

  async createRefund(
    paymentId: string,
    params: RazorpayRefundParams = {},
  ): Promise<RazorpayRefund> {
    try {
      const refund = await this.client.payments.refund(paymentId, {
        amount: params.amount !== undefined ? Math.round(params.amount * 100) : undefined,
        speed: params.speed ?? 'normal',
        notes: params.notes,
        receipt: params.receipt,
      }) as unknown as RazorpayRefund;

      logger.info('Razorpay refund created', {
        refundId: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
      });

      return refund;
    } catch (error) {
      this.handleRazorpayError('createRefund', error);
    }
  }

  async retrieveRefund(paymentId: string, refundId: string): Promise<RazorpayRefund> {
    try {
      return await this.client.payments.fetchRefund(paymentId, refundId) as unknown as RazorpayRefund;
    } catch (error) {
      this.handleRazorpayError('retrieveRefund', error);
    }
  }

  async listRefundsForPayment(
    paymentId: string,
    params: RazorpayListParams = {},
  ): Promise<RazorpayList<RazorpayRefund>> {
    try {
      return await this.client.payments.fetchMultipleRefund(paymentId, params) as unknown as RazorpayList<RazorpayRefund>;
    } catch (error) {
      this.handleRazorpayError('listRefundsForPayment', error);
    }
  }

  // ── Webhook verification ───────────────────────────────────────────────────

  verifyPaymentSignature(params: RazorpayWebhookVerificationParams): boolean {
    try {
      const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;

      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(params.razorpaySignature, 'hex'),
      );

      if (!isValid) {
        logger.warn('Razorpay payment signature verification failed', {
          orderId: params.razorpayOrderId,
          paymentId: params.razorpayPaymentId,
        });
      }

      return isValid;
    } catch (error) {
      logger.error('Razorpay signature verification threw an error', { error });
      return false;
    }
  }

  verifyWebhookSignature(params: RazorpayWebhookPayloadVerificationParams): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', params.secret)
        .update(params.rawBody)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(params.signature, 'hex'),
      );

      if (!isValid) {
        logger.warn('Razorpay webhook signature verification failed');
      }

      return isValid;
    } catch (error) {
      logger.error('Razorpay webhook signature verification threw an error', { error });
      return false;
    }
  }

  // ── Health ─────────────────────────────────────────────────────────────────

  async checkHealth(): Promise<boolean> {
    try {
      await this.client.orders.all({ count: 1 });
      return true;
    } catch (error) {
      logger.error('Razorpay health check failed', { error });
      return false;
    }
  }

  // ── Error handling ─────────────────────────────────────────────────────────

  private handleRazorpayError(operation: string, error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      'error' in error
    ) {
      const razorpayError = error as {
        statusCode: number;
        error: {
          code: string;
          description: string;
          source: string;
          step: string;
          reason: string;
          metadata?: Record<string, unknown>;
        };
      };

      logger.error(`Razorpay error in ${operation}`, {
        statusCode: razorpayError.statusCode,
        code: razorpayError.error.code,
        description: razorpayError.error.description,
        reason: razorpayError.error.reason,
        source: razorpayError.error.source,
        step: razorpayError.error.step,
      });

      throw razorpayError;
    }

    logger.error(`Unexpected Razorpay error in ${operation}`, { error });
    throw error;
  }
}

export const razorpayClient = new RazorpayClient();