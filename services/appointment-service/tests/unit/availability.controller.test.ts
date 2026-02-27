import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment, createAdminTestRequest, createTestRequest, createTestResponse } from '../../src/tests-helpers/setup';
import { mockAvailabilityService } from '../../src/tests-helpers/mocks';
import { consultantAvailabilityListFixture, createAvailabilityPayload } from '../fixtures/availability.fixture';
import { FIXED_IDS } from '../fixtures/common.fixture';
import { ConsultantNotFoundError, AvailabilityNotFoundError } from '../../src/shared/errors';

setupTestEnvironment();

let AvailabilityController: any;

beforeEach(async () => {
  jest.resetModules();
  ({ AvailabilityController } = await import('../../src/app/availability/availability.controller'));
});

describe('AvailabilityController.getByConsultant', () => {
  it('returns 200 with availability list', async () => {
    mockAvailabilityService.getConsultantAvailability.mockResolvedValue(consultantAvailabilityListFixture);

    const controller = new AvailabilityController({ availabilityService: mockAvailabilityService });
    const { res } = createTestResponse();
    const req = createTestRequest({ params: { consultantId: FIXED_IDS.consultantId } });

    await controller.getByConsultant(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('calls next with ConsultantNotFoundError when consultant is missing', async () => {
    mockAvailabilityService.getConsultantAvailability.mockRejectedValue(
      new ConsultantNotFoundError(FIXED_IDS.consultantId),
    );

    const controller = new AvailabilityController({ availabilityService: mockAvailabilityService });
    const { res } = createTestResponse();
    const next = jest.fn();
    const req = createTestRequest({ params: { consultantId: 'nonexistent' } });

    await controller.getByConsultant(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ConsultantNotFoundError));
  });
});

describe('AvailabilityController.create', () => {
  it('returns 201 with created availability', async () => {
    mockAvailabilityService.createAvailability.mockResolvedValue(consultantAvailabilityListFixture[0]);

    const controller = new AvailabilityController({ availabilityService: mockAvailabilityService });
    const { res } = createTestResponse();
    const req = createAdminTestRequest({ body: createAvailabilityPayload });

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('AvailabilityController.delete', () => {
  it('returns 204 on successful deletion', async () => {
    mockAvailabilityService.deleteAvailability.mockResolvedValue(undefined);

    const controller = new AvailabilityController({ availabilityService: mockAvailabilityService });
    const { res } = createTestResponse();
    const req = createAdminTestRequest({ params: { id: FIXED_IDS.availabilityId } });

    await controller.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('calls next with AvailabilityNotFoundError when record is missing', async () => {
    mockAvailabilityService.deleteAvailability.mockRejectedValue(
      new AvailabilityNotFoundError('nonexistent'),
    );

    const controller = new AvailabilityController({ availabilityService: mockAvailabilityService });
    const { res } = createTestResponse();
    const next = jest.fn();
    const req = createAdminTestRequest({ params: { id: 'nonexistent' } });

    await controller.delete(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AvailabilityNotFoundError));
  });
});