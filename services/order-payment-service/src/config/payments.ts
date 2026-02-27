import { env } from './env';

export type StripeConfig = {
  secretKey:      string;
  publishableKey: string;
  webhookSecret:  string;
  apiVersion:     string;
  currency:       string;
  maxRetries:     number;
  timeoutMs:      number;
};

export type RazorpayConfig = {
  keyId:         string;
  keySecret:     string;
  webhookSecret: string;
  currency:      string;
  enabled:       boolean;
};

export type PaymentConfig = {
  stripe:               StripeConfig;
  razorpay:             RazorpayConfig;
  defaultProvider:      'stripe' | 'razorpay';
  defaultCurrency:      string;
  maxRefundAgeDays:     number;
  maxBulkRefundSize:    number;
  maxRefundAmount:      number;
  idempotencyTtlSecs:   number;
  webhookToleranceSecs: number;
};

export function buildPaymentConfig(): PaymentConfig {
  return {
    stripe: {
      secretKey:      env.STRIPE_SECRET_KEY,
      publishableKey: env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret:  env.STRIPE_WEBHOOK_SECRET,
      apiVersion:     '2024-06-20',
      currency:       'gbp',
      maxRetries:     3,
      timeoutMs:      30_000,
    },

    razorpay: {
      keyId:         env.RAZORPAY_KEY_ID,
      keySecret:     env.RAZORPAY_KEY_SECRET,
      webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
      currency:      'INR',
      enabled:       env.RAZORPAY_ENABLED,
    },

    defaultProvider:      'stripe',
    defaultCurrency:      'GBP',
    maxRefundAgeDays:     90,
    maxBulkRefundSize:    50,
    maxRefundAmount:      999_999.99,
    idempotencyTtlSecs:   86_400,
    webhookToleranceSecs: 300,
  };
}

export const paymentConfig: PaymentConfig = buildPaymentConfig();