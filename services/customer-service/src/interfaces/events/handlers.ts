import { logger } from '../../config/logger';
import { prisma } from '../../infrastructure/db/prisma.client';
import { LoyaltyRepository } from '../../app/loyalty/loyalty.repository';
import { LoyaltyService } from '../../app/loyalty/loyalty.service';
import { LOYALTY_POINTS_RULES } from '../../app/loyalty/loyalty.constants';
import { eventProducer } from '../../infrastructure/messaging/event-producer';
import { CUSTOMER_EVENT_TOPICS } from '../../infrastructure/messaging/event-topics';
import {
  OrderCompletedPayload,
  OrderCancelledPayload,
  PaymentSucceededPayload,
  AppointmentBookedPayload,
  AppointmentCancelledPayload,
  UserRegisteredPayload,
  InboundEventEnvelope,
} from './payload.types';

const loyaltyRepository = new LoyaltyRepository(prisma);
const loyaltyService = new LoyaltyService(loyaltyRepository);

export async function handleOrderCompleted(
  envelope: InboundEventEnvelope<OrderCompletedPayload>,
): Promise<void> {
  const { payload, metadata } = envelope;
  const { customerId, orderId, orderRef, totalAmount } = payload;

  logger.info({ eventId: metadata.eventId, orderId, customerId }, 'Handling order.completed');

  try {
    const pointsToEarn = Math.floor(totalAmount * LOYALTY_POINTS_RULES.POINTS_PER_POUND);

    if (pointsToEarn > 0) {
      const result = await loyaltyService.earnPoints({
        customerId,
        points: pointsToEarn,
        description: `Points earned for order ${orderRef}`,
        reference: orderId,
      });

      await eventProducer.publish(
        CUSTOMER_EVENT_TOPICS.LOYALTY_POINTS_EARNED,
        {
          accountId: result.account.id,
          customerId,
          transactionId: result.transaction.id,
          points: pointsToEarn,
          newBalance: result.account.pointsBalance,
          tier: result.account.tier,
          description: result.transaction.description,
          reference: orderId,
        },
        { correlationId: metadata.eventId, customerId },
      );
    }
  } catch (error) {
    logger.error(
      { error: (error as Error).message, orderId, customerId },
      'Failed to process order.completed event',
    );
    throw error;
  }
}

export async function handleOrderCancelled(
  envelope: InboundEventEnvelope<OrderCancelledPayload>,
): Promise<void> {
  const { payload, metadata } = envelope;
  const { customerId, orderId } = payload;

  logger.info({ eventId: metadata.eventId, orderId, customerId }, 'Handling order.cancelled');
}

export async function handlePaymentSucceeded(
  envelope: InboundEventEnvelope<PaymentSucceededPayload>,
): Promise<void> {
  const { payload, metadata } = envelope;
  const { customerId, paymentId, orderId } = payload;

  logger.info(
    { eventId: metadata.eventId, paymentId, orderId, customerId },
    'Handling payment.succeeded',
  );
}

export async function handleAppointmentBooked(
  envelope: InboundEventEnvelope<AppointmentBookedPayload>,
): Promise<void> {
  const { payload, metadata } = envelope;
  const { customerId, appointmentId } = payload;

  logger.info(
    { eventId: metadata.eventId, appointmentId, customerId },
    'Handling appointment.booked',
  );
}

export async function handleAppointmentCancelled(
  envelope: InboundEventEnvelope<AppointmentCancelledPayload>,
): Promise<void> {
  const { payload, metadata } = envelope;
  const { customerId, appointmentId } = payload;

  logger.info(
    { eventId: metadata.eventId, appointmentId, customerId },
    'Handling appointment.cancelled',
  );
}

export async function handleUserRegistered(
  envelope: InboundEventEnvelope<UserRegisteredPayload>,
): Promise<void> {
  const { payload, metadata } = envelope;
  const { userId, email, firstName, lastName, phone } = payload;

  logger.info({ eventId: metadata.eventId, userId, email }, 'Handling auth.user.created');

  try {
    const existing = await prisma.customer.findUnique({ where: { userId } });
    if (existing) {
      logger.warn({ userId }, 'Customer already exists, skipping creation');
      return;
    }

    const customer = await prisma.$transaction(async (tx) => {
      const newCustomer = await tx.customer.create({
        data: {
          userId,
          email,
          firstName,
          lastName,
          phone: phone ?? null,
        },
      });

      await tx.customerProfile.create({
        data: { customerId: newCustomer.id },
      });

      await tx.loyaltyAccount.create({
        data: { customerId: newCustomer.id },
      });

      await tx.notificationPreference.create({
        data: { customerId: newCustomer.id },
      });

      return newCustomer;
    });

    await eventProducer.publish(
      CUSTOMER_EVENT_TOPICS.PROFILE_UPDATED,
      { customerId: customer.id, updatedFields: ['created'], updatedAt: new Date().toISOString() },
      { correlationId: metadata.eventId, customerId: customer.id, userId },
    );

    logger.info({ customerId: customer.id, userId }, 'Customer created from user registration');
  } catch (error) {
    logger.error(
      { error: (error as Error).message, userId, email },
      'Failed to process auth.user.created event',
    );
    throw error;
  }
}