import Stripe from 'stripe';
import { PaymentStatus, Prisma } from '@prisma/client';
import {
  RazorpayPayment,
  RazorpayRefund,
  RazorpayOrder,
} from './razorpay.client';

export type NormalisedPayment = {
  provider: 'stripe' | 'razorpay';
  providerPaymentId: string;
  providerOrderId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  captured: boolean;
  refunded: boolean;
  amountRefunded: number;
  description: string | null;
  email: string | null;
  metadata: Record<string, string>;
  createdAt: Date;
  rawData: Record<string, unknown>;
};

export type NormalisedRefund = {
  provider: 'stripe' | 'razorpay';
  providerRefundId: string;
  providerPaymentId: string;
  amount: number;
  currency: string;
  status: string;
  reason: string | null;
  metadata: Record<string, string>;
  createdAt: Date;
  rawData: Record<string, unknown>;
};

export type NormalisedOrder = {
  provider: 'razorpay';
  providerOrderId: string;
  amount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  createdAt: Date;
  rawData: Record<string, unknown>;
};

export type StripeToPrismaPaymentInput = {
  stripePaymentIntentId: string;
  stripeCustomerId: string | null;
  amount: Prisma.Decimal;
  currency: string;
  status: PaymentStatus;
  paymentMethodId: string | null;
  paymentMethodType: string | null;
  captured: boolean;
  description: string | null;
  receiptEmail: string | null;
  metadata: Prisma.InputJsonValue;
};

export type RazorpayToPrismaPaymentInput = {
  razorpayPaymentId: string;
  razorpayOrderId: string | null;
  amount: Prisma.Decimal;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  captured: boolean;
  email: string | null;
  contact: string | null;
  metadata: Prisma.InputJsonValue;
};

export class PaymentMapper {
\

  static fromStripePaymentIntent(intent: Stripe.PaymentIntent): NormalisedPayment {
    return {
      provider: 'stripe',
      providerPaymentId: intent.id,
      providerOrderId: null,
      amount: PaymentMapper.stripeAmountToDecimal(intent.amount),
      currency: intent.currency.toUpperCase(),
      status: PaymentMapper.stripeStatusToInternal(intent.status),
      paymentMethod:
        typeof intent.payment_method === 'string'
          ? intent.payment_method
          : intent.payment_method?.id ?? null,
      captured: intent.status === 'succeeded',
      refunded: false,
      amountRefunded: 0,
      description: intent.description,
      email: intent.receipt_email,
      metadata: intent.metadata as Record<string, string>,
      createdAt: new Date(intent.created * 1000),
      rawData: intent as unknown as Record<string, unknown>,
    };
  }

  static fromStripeCharge(charge: Stripe.Charge): NormalisedPayment {
    return {
      provider: 'stripe',
      providerPaymentId:
        typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id ?? charge.id,
      providerOrderId: null,
      amount: PaymentMapper.stripeAmountToDecimal(charge.amount),
      currency: charge.currency.toUpperCase(),
      status: PaymentMapper.stripeChargeStatusToInternal(charge.status),
      paymentMethod:
        typeof charge.payment_method === 'string'
          ? charge.payment_method
          : null,
      captured: charge.captured,
      refunded: charge.refunded,
      amountRefunded: PaymentMapper.stripeAmountToDecimal(charge.amount_refunded),
      description: charge.description,
      email: charge.billing_details?.email ?? null,
      metadata: charge.metadata as Record<string, string>,
      createdAt: new Date(charge.created * 1000),
      rawData: charge as unknown as Record<string, unknown>,
    };
  }

  static fromStripeRefund(refund: Stripe.Refund): NormalisedRefund {
    return {
      provider: 'stripe',
      providerRefundId: refund.id,
      providerPaymentId:
        typeof refund.payment_intent === 'string'
          ? refund.payment_intent
          : refund.payment_intent?.id ?? '',
      amount: PaymentMapper.stripeAmountToDecimal(refund.amount),
      currency: refund.currency.toUpperCase(),
      status: refund.status ?? 'unknown',
      reason: refund.reason ?? null,
      metadata: refund.metadata as Record<string, string>,
      createdAt: new Date(refund.created * 1000),
      rawData: refund as unknown as Record<string, unknown>,
    };
  }

  static stripeIntentToPrismaInput(
    intent: Stripe.PaymentIntent,
  ): StripeToPrismaPaymentInput {
    const method =
      typeof intent.payment_method === 'string'
        ? intent.payment_method
        : intent.payment_method?.id ?? null;

    const methodType =
      typeof intent.payment_method === 'object' && intent.payment_method !== null
        ? intent.payment_method.type
        : null;

    return {
      stripePaymentIntentId: intent.id,
      stripeCustomerId:
        typeof intent.customer === 'string'
          ? intent.customer
          : intent.customer?.id ?? null,
      amount: new Prisma.Decimal(PaymentMapper.stripeAmountToDecimal(intent.amount)),
      currency: intent.currency.toUpperCase(),
      status: PaymentMapper.stripeStatusToInternal(intent.status),
      paymentMethodId: method,
      paymentMethodType: methodType,
      captured: intent.status === 'succeeded',
      description: intent.description,
      receiptEmail: intent.receipt_email,
      metadata: intent.metadata as Prisma.InputJsonValue,
    };
  }


  static fromRazorpayPayment(payment: RazorpayPayment): NormalisedPayment {
    return {
      provider: 'razorpay',
      providerPaymentId: payment.id,
      providerOrderId: payment.order_id,
      amount: PaymentMapper.razorpayAmountToDecimal(payment.amount),
      currency: payment.currency.toUpperCase(),
      status: PaymentMapper.razorpayStatusToInternal(payment.status),
      paymentMethod: payment.method,
      captured: payment.captured,
      refunded: payment.refund_status !== null,
      amountRefunded: PaymentMapper.razorpayAmountToDecimal(payment.amount_refunded),
      description: payment.description,
      email: payment.email,
      metadata: payment.notes as Record<string, string>,
      createdAt: new Date(payment.created_at * 1000),
      rawData: payment as unknown as Record<string, unknown>,
    };
  }

  static fromRazorpayRefund(refund: RazorpayRefund): NormalisedRefund {
    return {
      provider: 'razorpay',
      providerRefundId: refund.id,
      providerPaymentId: refund.payment_id,
      amount: PaymentMapper.razorpayAmountToDecimal(refund.amount),
      currency: refund.currency.toUpperCase(),
      status: refund.status,
      reason: null,
      metadata: refund.notes as Record<string, string>,
      createdAt: new Date(refund.created_at * 1000),
      rawData: refund as unknown as Record<string, unknown>,
    };
  }

  static fromRazorpayOrder(order: RazorpayOrder): NormalisedOrder {
    return {
      provider: 'razorpay',
      providerOrderId: order.id,
      amount: PaymentMapper.razorpayAmountToDecimal(order.amount),
      amountPaid: PaymentMapper.razorpayAmountToDecimal(order.amount_paid),
      amountDue: PaymentMapper.razorpayAmountToDecimal(order.amount_due),
      currency: order.currency.toUpperCase(),
      receipt: order.receipt,
      status: order.status,
      attempts: order.attempts,
      notes: order.notes as Record<string, string>,
      createdAt: new Date(order.created_at * 1000),
      rawData: order as unknown as Record<string, unknown>,
    };
  }

  static razorpayPaymentToPrismaInput(
    payment: RazorpayPayment,
  ): RazorpayToPrismaPaymentInput {
    return {
      razorpayPaymentId: payment.id,
      razorpayOrderId: payment.order_id,
      amount: new Prisma.Decimal(PaymentMapper.razorpayAmountToDecimal(payment.amount)),
      currency: payment.currency.toUpperCase(),
      status: PaymentMapper.razorpayStatusToInternal(payment.status),
      paymentMethod: payment.method,
      captured: payment.captured,
      email: payment.email,
      contact: payment.contact,
      metadata: payment.notes as Prisma.InputJsonValue,
    };
  }


  static stripeStatusToInternal(status: Stripe.PaymentIntent.Status): PaymentStatus {
    const map: Record<Stripe.PaymentIntent.Status, PaymentStatus> = {
      requires_payment_method: PaymentStatus.PENDING,
      requires_confirmation: PaymentStatus.PENDING,
      requires_action: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      requires_capture: PaymentStatus.PROCESSING,
      canceled: PaymentStatus.CANCELLED,
      succeeded: PaymentStatus.SUCCEEDED,
    };
    return map[status] ?? PaymentStatus.PENDING;
  }

  static stripeChargeStatusToInternal(
    status: Stripe.Charge.Status,
  ): PaymentStatus {
    const map: Record<Stripe.Charge.Status, PaymentStatus> = {
      succeeded: PaymentStatus.SUCCEEDED,
      pending: PaymentStatus.PROCESSING,
      failed: PaymentStatus.FAILED,
    };
    return map[status] ?? PaymentStatus.PENDING;
  }

  static razorpayStatusToInternal(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      created: PaymentStatus.PENDING,
      authorized: PaymentStatus.PROCESSING,
      captured: PaymentStatus.SUCCEEDED,
      refunded: PaymentStatus.REFUNDED,
      failed: PaymentStatus.FAILED,
    };
    return map[status] ?? PaymentStatus.PENDING;
  }


  static stripeAmountToDecimal(amountInCents: number): number {
    return Math.round(amountInCents) / 100;
  }

  static decimalToStripeAmount(amount: number): number {
    return Math.round(amount * 100);
  }

  static razorpayAmountToDecimal(amountInPaise: number): number {
    return Math.round(amountInPaise) / 100;
  }

  static decimalToRazorpayAmount(amount: number): number {
    return Math.round(amount * 100);
  }
}