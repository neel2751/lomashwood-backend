import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupUnitTest } from '../../src/tests-helpers/setup';
import { createMockRequest, createMockResponse, createMockNext, mockPaymentService } from '../../src/tests-helpers/mocks';
import { PaymentController } from '../../src/app/payments/payment.controller';
import { PaymentError, NotFoundError } from '../../src/shared/errors';
import { HTTP_STATUS } from '../../src/shared/constants';
import {
  PAYMENT_PENDING,
  PAYMENT_SUCCEEDED,
  ORDER_PENDING_KITCHEN,
  CUSTOMER_SNAPSHOT_1,
} from '../../tests/fixtures';

setupUnitTest();

jest.mock('../../src/app/payments/payment.service', () => ({
  PaymentService: jest.fn().mockImplementation(() => mockPaymentService),
}));

describe('PaymentController', () => {
  let controller: PaymentController;
  let req: ReturnType<typeof createMockRequest>;
  let res: ReturnType<typeof createMockResponse>;
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PaymentController(mockPaymentService as any);
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
  });

  describe('createPaymentIntent', () => {
    it('responds 201 with client secret', async () => {
      req.body = { orderId: ORDER_PENDING_KITCHEN.id };
      req.user = { id: CUSTOMER_SNAPSHOT_1.id };
      mockPaymentService.createPaymentIntent.mockResolvedValueOnce({
        paymentId: PAYMENT_PENDING.id,
        clientSecret: PAYMENT_PENDING.stripeClientSecret,
        stripePaymentIntentId: PAYMENT_PENDING.stripePaymentIntentId,
      });

      await controller.createPaymentIntent(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentId: PAYMENT_PENDING.id,
            clientSecret: expect.any(String),
          }),
        }),
      );
    });

    it('calls next with PaymentError on Stripe failure', async () => {
      req.body = { orderId: ORDER_PENDING_KITCHEN.id };
      req.user = { id: CUSTOMER_SNAPSHOT_1.id };
      const error = new PaymentError('Card declined', 'card_declined');
      mockPaymentService.createPaymentIntent.mockRejectedValueOnce(error);

      await controller.createPaymentIntent(req as any, res as any, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getPayment', () => {
    it('responds 200 with payment data', async () => {
      req.params = { id: PAYMENT_SUCCEEDED.id };
      mockPaymentService.getPayment.mockResolvedValueOnce(PAYMENT_SUCCEEDED);

      await controller.getPayment(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ id: PAYMENT_SUCCEEDED.id }) }),
      );
    });

    it('calls next with NotFoundError when payment missing', async () => {
      req.params = { id: 'missing-id' };
      const error = new NotFoundError('Payment', 'missing-id');
      mockPaymentService.getPayment.mockRejectedValueOnce(error);

      await controller.getPayment(req as any, res as any, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getPayments', () => {
    it('responds 200 with paginated payments', async () => {
      req.query = { page: '1', limit: '20' };
      mockPaymentService.getPayments.mockResolvedValueOnce({
        data: [PAYMENT_PENDING, PAYMENT_SUCCEEDED],
        meta: { page: 1, limit: 20, total: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false },
      });

      await controller.getPayments(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ meta: expect.objectContaining({ total: 2 }) }),
      );
    });
  });
});