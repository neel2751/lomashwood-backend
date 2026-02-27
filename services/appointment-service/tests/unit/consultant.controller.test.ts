import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment, createAdminTestRequest, createTestRequest, createTestResponse } from '../../src/tests-helpers/setup';
import { mockConsultantService } from '../../src/tests-helpers/mocks';
import {
  consultantKitchenFixture,
  consultantsListFixture,
  createConsultantPayload,
  updateConsultantPayload,
} from '../fixtures/consultants.fixture';
import { FIXED_IDS, BASE_PAGINATION_META } from '../fixtures/common.fixture';
import { ConsultantNotFoundError } from '../../src/shared/errors';

setupTestEnvironment();

let ConsultantController: any;

beforeEach(async () => {
  jest.resetModules();
  ({ ConsultantController } = await import('../../src/app/consultant/consultant.controller'));
});

describe('ConsultantController.create', () => {
  it('returns 201 with created consultant', async () => {
    mockConsultantService.createConsultant.mockResolvedValue(consultantKitchenFixture);

    const controller = new ConsultantController({ consultantService: mockConsultantService });
    const { res } = createTestResponse();
    const req = createAdminTestRequest({ body: createConsultantPayload });

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.status(201).json).toHaveBeenCalledWith(
      expect.objectContaining({ id: FIXED_IDS.consultantId }),
    );
  });

  it('calls next on error', async () => {
    mockConsultantService.createConsultant.mockRejectedValue(new Error('Duplicate email'));

    const controller = new ConsultantController({ consultantService: mockConsultantService });
    const { res } = createTestResponse();
    const next = jest.fn();
    const req = createAdminTestRequest({ body: createConsultantPayload });

    await controller.create(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('ConsultantController.getById', () => {
  it('returns 200 with consultant when found', async () => {
    mockConsultantService.getConsultantById.mockResolvedValue(consultantKitchenFixture);

    const controller = new ConsultantController({ consultantService: mockConsultantService });
    const { res } = createTestResponse();
    const req = createTestRequest({ params: { id: FIXED_IDS.consultantId } });

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('calls next with ConsultantNotFoundError when not found', async () => {
    mockConsultantService.getConsultantById.mockRejectedValue(
      new ConsultantNotFoundError('nonexistent'),
    );

    const controller = new ConsultantController({ consultantService: mockConsultantService });
    const { res } = createTestResponse();
    const next = jest.fn();
    const req = createTestRequest({ params: { id: 'nonexistent' } });

    await controller.getById(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ConsultantNotFoundError));
  });
});

describe('ConsultantController.list', () => {
  it('returns 200 with paginated consultants', async () => {
    mockConsultantService.getAllConsultants.mockResolvedValue({
      data: consultantsListFixture,
      meta: { ...BASE_PAGINATION_META, total: consultantsListFixture.length },
    });

    const controller = new ConsultantController({ consultantService: mockConsultantService });
    const { res } = createTestResponse();
    const req = createAdminTestRequest({ query: {} });

    await controller.list(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('ConsultantController.update', () => {
  it('returns 200 with updated consultant', async () => {
    const updated = { ...consultantKitchenFixture, ...updateConsultantPayload };
    mockConsultantService.updateConsultant.mockResolvedValue(updated);

    const controller = new ConsultantController({ consultantService: mockConsultantService });
    const { res } = createTestResponse();
    const req = createAdminTestRequest({
      params: { id: FIXED_IDS.consultantId },
      body: updateConsultantPayload,
    });

    await controller.update(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('ConsultantController.deactivate', () => {
  it('returns 200 with deactivated consultant', async () => {
    const deactivated = { ...consultantKitchenFixture, isActive: false };
    mockConsultantService.deactivateConsultant.mockResolvedValue(deactivated);

    const controller = new ConsultantController({ consultantService: mockConsultantService });
    const { res } = createTestResponse();
    const req = createAdminTestRequest({ params: { id: FIXED_IDS.consultantId } });

    await controller.deactivate(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status(200).json).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
  });
});