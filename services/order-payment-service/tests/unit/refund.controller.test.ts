import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupUnitTest } from '../../src/tests-helpers/setup';
import { createMockRequest, createMockResponse, createMockNext, mockRefundService } from '../../src/tests-helpers/mocks';
import { RefundController } from '../../src/app/refunds/refund.controller';
import { RefundNotFoundError, RefundNotEligibleError } from '../../src/shared/errors';
import { HTTP_STATUS } from '../../src/shared/constants';
import { REFUND_FULL_SUCCEEDED, REFUND_PENDING, PAYMENT_SUCCEEDED, CUSTOMER_SNAPSHOT_1 } from '../../tests/fixtures';

setupUnitTest();
jest.mock('../../src/app/refunds/refund.service', () => ({ RefundService: jest.fn().mockImplementation(() => mockRefundService) }));

describe('RefundController', () => {
  let controller: RefundController;
  let req: ReturnType<typeof createMockRequest>;
  let res: ReturnType<typeof createMockResponse>;
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new RefundController(mockRefundService as any);
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
  });

  describe('issueRefund', () => {
    it('responds 201 on successful refund', async () => {
      req.body = { paymentId: PAYMENT_SUCCEEDED.id, amount: PAYMENT_SUCCEEDED.amount, reason: 'CUSTOMER_REQUEST', note: null };
      req.user = { id: CUSTOMER_SNAPSHOT_1.id };
      mockRefundService.issueRefund.mockResolvedValueOnce(REFUND_FULL_SUCCEEDED);

      await controller.issueRefund(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id: REFUND_FULL_SUCCEEDED.id }) }));
    });

    it('calls next with RefundNotEligibleError', async () => {
      req.body = { paymentId: 'bad-payment', amount: 100, reason: 'CUSTOMER_REQUEST', note: null };
      req.user = { id: CUSTOMER_SNAPSHOT_1.id };
      const error = new RefundNotEligibleError('bad-order', 'Payment not succeeded');
      mockRefundService.issueRefund.mockRejectedValueOnce(error);

      await controller.issueRefund(req as any, res as any, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getRefund', () => {
    it('responds 200 with refund data', async () => {
      req.params = { id: REFUND_FULL_SUCCEEDED.id };
      mockRefundService.getRefund.mockResolvedValueOnce(REFUND_FULL_SUCCEEDED);

      await controller.getRefund(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    it('calls next with RefundNotFoundError', async () => {
      req.params = { id: 'missing' };
      mockRefundService.getRefund.mockRejectedValueOnce(new RefundNotFoundError('missing'));

      await controller.getRefund(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
    });
  });
});