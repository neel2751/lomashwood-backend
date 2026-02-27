import { Prisma } from '@prisma/client';
import {
  RefundWithRelations,
  RefundResponse,
  RefundListResponse,
  RefundSummary,
  RefundSummaryInput,
  RefundStatusBreakdown,
  RefundStatusBreakdownItem,
} from './refund.types';
import { PaginatedResult } from '../../shared/pagination';

export class RefundMapper {
  static toResponse(refund: RefundWithRelations): RefundResponse {
    return {
      id: refund.id,
      orderId: refund.orderId,
      paymentId: refund.paymentId,
      stripeRefundId: refund.stripeRefundId,
      amount: RefundMapper.decimalToNumber(refund.amount),
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      notes: refund.notes,
      failureReason: refund.failureReason,
      requestedBy: refund.requestedBy,
      processedAt: refund.processedAt,
      settledAt: refund.settledAt,
      cancelledAt: refund.cancelledAt,
      cancelledBy: refund.cancelledBy,
      retryCount: refund.retryCount,
      metadata: RefundMapper.parseMetadata(refund.metadata),
      createdAt: refund.createdAt,
      updatedAt: refund.updatedAt,
      order: {
        id: refund.order.id,
        orderNumber: refund.order.orderNumber,
        status: refund.order.status,
        customer: {
          id: refund.order.customer.id,
          email: refund.order.customer.email,
          firstName: refund.order.customer.firstName,
          lastName: refund.order.customer.lastName,
        },
      },
      payment: {
        id: refund.payment.id,
        stripePaymentIntentId: refund.payment.stripePaymentIntentId,
        amount: RefundMapper.decimalToNumber(refund.payment.amount),
        currency: refund.payment.currency,
        status: refund.payment.status,
      },
    };
  }

  static toResponseList(refunds: RefundWithRelations[]): RefundResponse[] {
    return refunds.map(RefundMapper.toResponse);
  }

  static toPaginatedResponse(
    result: PaginatedResult<RefundWithRelations>,
  ): RefundListResponse {
    return {
      data: RefundMapper.toResponseList(result.data),
      meta: result.meta,
    };
  }

  static toSummary(input: RefundSummaryInput): RefundSummary {
    return {
      orderId: input.orderId,
      currency: input.currency,
      totalPaid: RefundMapper.roundAmount(input.totalPaid),
      totalRefunded: RefundMapper.roundAmount(input.totalRefunded),
      pendingRefunds: RefundMapper.roundAmount(input.pendingRefunds),
      remainingRefundable: RefundMapper.roundAmount(input.remainingRefundable),
      refundCount: input.refundCount,
      isFullyRefunded:
        input.totalPaid > 0 &&
        RefundMapper.roundAmount(input.totalRefunded) >=
          RefundMapper.roundAmount(input.totalPaid),
      isPartiallyRefunded:
        input.totalRefunded > 0 &&
        RefundMapper.roundAmount(input.totalRefunded) <
          RefundMapper.roundAmount(input.totalPaid),
    };
  }

  static toStatusBreakdown(
    rows: Array<{ status: RefundStatusBreakdownItem['status']; count: number; totalAmount: number }>,
  ): RefundStatusBreakdown {
    return rows.map((row) => ({
      status: row.status,
      count: row.count,
      totalAmount: RefundMapper.roundAmount(row.totalAmount),
    }));
  }

  private static decimalToNumber(value: Prisma.Decimal | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return RefundMapper.roundAmount(value);
    return RefundMapper.roundAmount(value.toNumber());
  }

  private static roundAmount(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private static parseMetadata(
    raw: Prisma.JsonValue | null | undefined,
  ): Record<string, unknown> | null {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'object' && !Array.isArray(raw)) {
      return raw as Record<string, unknown>;
    }
    return null;
  }
}