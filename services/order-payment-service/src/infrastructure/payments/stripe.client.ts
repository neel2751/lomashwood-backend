import Stripe from 'stripe';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

const STRIPE_API_VERSION = '2024-06-20' as const;

function buildStripeClient(): Stripe {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
    maxNetworkRetries: 3,
    timeout: 30000,
    appInfo: {
      name: 'lomash-wood-backend',
      version: '1.0.0',
    },
  });
}

export const stripe: Stripe = buildStripeClient();

export class StripeClient {
  constructor(private readonly client: Stripe = stripe) {}


  async createPaymentIntent(
    params: Stripe.PaymentIntentCreateParams,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const intent = await this.client.paymentIntents.create(params);

      logger.info('Stripe PaymentIntent created', {
        intentId: intent.id,
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
      });

      return intent;
    } catch (error) {
      this.handleStripeError('createPaymentIntent', error);
    }
  }

  async retrievePaymentIntent(
    intentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await this.client.paymentIntents.retrieve(intentId);
    } catch (error) {
      this.handleStripeError('retrievePaymentIntent', error);
    }
  }

  async confirmPaymentIntent(
    intentId: string,
    params?: Stripe.PaymentIntentConfirmParams,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const intent = await this.client.paymentIntents.confirm(intentId, params);

      logger.info('Stripe PaymentIntent confirmed', {
        intentId: intent.id,
        status: intent.status,
      });

      return intent;
    } catch (error) {
      this.handleStripeError('confirmPaymentIntent', error);
    }
  }

  async cancelPaymentIntent(
    intentId: string,
    params?: Stripe.PaymentIntentCancelParams,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const intent = await this.client.paymentIntents.cancel(intentId, params);

      logger.info('Stripe PaymentIntent cancelled', {
        intentId: intent.id,
        status: intent.status,
      });

      return intent;
    } catch (error) {
      this.handleStripeError('cancelPaymentIntent', error);
    }
  }

  async capturePaymentIntent(
    intentId: string,
    params?: Stripe.PaymentIntentCaptureParams,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const intent = await this.client.paymentIntents.capture(intentId, params);

      logger.info('Stripe PaymentIntent captured', {
        intentId: intent.id,
        amountCaptured: intent.amount_capturable,
        status: intent.status,
      });

      return intent;
    } catch (error) {
      this.handleStripeError('capturePaymentIntent', error);
    }
  }

  async updatePaymentIntent(
    intentId: string,
    params: Stripe.PaymentIntentUpdateParams,
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await this.client.paymentIntents.update(intentId, params);
    } catch (error) {
      this.handleStripeError('updatePaymentIntent', error);
    }
  }


  async createRefund(
    params: Stripe.RefundCreateParams,
  ): Promise<Stripe.Refund> {
    try {
      const refund = await this.client.refunds.create(params);

      logger.info('Stripe Refund created', {
        refundId: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        paymentIntent: refund.payment_intent,
      });

      return refund;
    } catch (error) {
      this.handleStripeError('createRefund', error);
    }
  }

  async retrieveRefund(refundId: string): Promise<Stripe.Refund> {
    try {
      return await this.client.refunds.retrieve(refundId);
    } catch (error) {
      this.handleStripeError('retrieveRefund', error);
    }
  }

  async cancelRefund(refundId: string): Promise<Stripe.Refund> {
    try {
      const refund = await this.client.refunds.cancel(refundId);

      logger.info('Stripe Refund cancelled', {
        refundId: refund.id,
        status: refund.status,
      });

      return refund;
    } catch (error) {
      this.handleStripeError('cancelRefund', error);
    }
  }


  async createCustomer(
    params: Stripe.CustomerCreateParams,
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.client.customers.create(params);

      logger.info('Stripe Customer created', { customerId: customer.id });

      return customer;
    } catch (error) {
      this.handleStripeError('createCustomer', error);
    }
  }

  async retrieveCustomer(
    customerId: string,
  ): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    try {
      return await this.client.customers.retrieve(customerId);
    } catch (error) {
      this.handleStripeError('retrieveCustomer', error);
    }
  }

  async updateCustomer(
    customerId: string,
    params: Stripe.CustomerUpdateParams,
  ): Promise<Stripe.Customer> {
    try {
      return await this.client.customers.update(customerId, params);
    } catch (error) {
      this.handleStripeError('updateCustomer', error);
    }
  }

  async deleteCustomer(customerId: string): Promise<Stripe.DeletedCustomer> {
    try {
      const deleted = await this.client.customers.del(customerId);

      logger.info('Stripe Customer deleted', { customerId });

      return deleted;
    } catch (error) {
      this.handleStripeError('deleteCustomer', error);
    }
  }


  async retrievePaymentMethod(
    paymentMethodId: string,
  ): Promise<Stripe.PaymentMethod> {
    try {
      return await this.client.paymentMethods.retrieve(paymentMethodId);
    } catch (error) {
      this.handleStripeError('retrievePaymentMethod', error);
    }
  }

  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<Stripe.PaymentMethod> {
    try {
      return await this.client.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    } catch (error) {
      this.handleStripeError('attachPaymentMethod', error);
    }
  }

  async detachPaymentMethod(
    paymentMethodId: string,
  ): Promise<Stripe.PaymentMethod> {
    try {
      return await this.client.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      this.handleStripeError('detachPaymentMethod', error);
    }
  }

  async listPaymentMethods(
    customerId: string,
    type: Stripe.PaymentMethodListParams.Type = 'card',
  ): Promise<Stripe.PaymentMethod[]> {
    try {
      const response = await this.client.paymentMethods.list({
        customer: customerId,
        type,
      });
      return response.data;
    } catch (error) {
      this.handleStripeError('listPaymentMethods', error);
    }
  }


  constructWebhookEvent(
    rawBody: Buffer,
    signature: string,
    secret: string,
  ): Stripe.Event {
    try {
      return this.client.webhooks.constructEvent(rawBody, signature, secret);
    } catch (error) {
      this.handleStripeError('constructWebhookEvent', error);
    }
  }


  async retrieveBalance(): Promise<Stripe.Balance> {
    try {
      return await this.client.balance.retrieve();
    } catch (error) {
      this.handleStripeError('retrieveBalance', error);
    }
  }


  async retrieveCharge(chargeId: string): Promise<Stripe.Charge> {
    try {
      return await this.client.charges.retrieve(chargeId);
    } catch (error) {
      this.handleStripeError('retrieveCharge', error);
    }
  }

  async listChargesForIntent(
    paymentIntentId: string,
  ): Promise<Stripe.Charge[]> {
    try {
      const response = await this.client.charges.list({
        payment_intent: paymentIntentId,
      });
      return response.data;
    } catch (error) {
      this.handleStripeError('listChargesForIntent', error);
    }
  }


  async checkHealth(): Promise<boolean> {
    try {
      await this.client.balance.retrieve();
      return true;
    } catch (error) {
      logger.error('Stripe health check failed', { error });
      return false;
    }
  }


  private handleStripeError(operation: string, error: unknown): never {
    if (error instanceof Stripe.errors.StripeCardError) {
      logger.warn(`Stripe card error in ${operation}`, {
        code: error.code,
        declineCode: error.decline_code,
        message: error.message,
      });
      throw error;
    }

    if (error instanceof Stripe.errors.StripeRateLimitError) {
      logger.warn(`Stripe rate limit in ${operation}`, { message: error.message });
      throw error;
    }

    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      logger.warn(`Stripe invalid request in ${operation}`, {
        param: error.param,
        message: error.message,
      });
      throw error;
    }

    if (error instanceof Stripe.errors.StripeAPIError) {
      logger.error(`Stripe API error in ${operation}`, {
        statusCode: error.statusCode,
        message: error.message,
      });
      throw error;
    }

    if (error instanceof Stripe.errors.StripeConnectionError) {
      logger.error(`Stripe connection error in ${operation}`, { message: error.message });
      throw error;
    }

    if (error instanceof Stripe.errors.StripeAuthenticationError) {
      logger.error(`Stripe authentication error in ${operation}`, { message: error.message });
      throw error;
    }

    logger.error(`Unexpected Stripe error in ${operation}`, { error });
    throw error;
  }
}

export const stripeClient = new StripeClient(stripe);