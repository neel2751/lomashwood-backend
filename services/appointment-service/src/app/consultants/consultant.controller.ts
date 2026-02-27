import { Request, Response, NextFunction } from 'express';
import { ConsultantService } from './consultant.service';
import {
  CreateConsultantSchema,
  UpdateConsultantSchema,
  ConsultantQuerySchema,
} from './consultant.schemas';
import { successResponse, paginatedResponse } from '../../shared/utils';
import { HTTP_STATUS } from '../../shared/constants';

export class ConsultantController {
  constructor(private readonly consultantService: ConsultantService) {}

  async createConsultant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateConsultantSchema.parse(req.body);
      const consultant = await this.consultantService.createConsultant(validated);
      res.status(HTTP_STATUS.CREATED).json(successResponse(consultant, 'Consultant created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getConsultantById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const consultant = await this.consultantService.getConsultantById(req.params.id);
      res.status(HTTP_STATUS.OK).json(successResponse(consultant));
    } catch (error) {
      next(error);
    }
  }

  async getAllConsultants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = ConsultantQuerySchema.parse(req.query);
      const result = await this.consultantService.getAllConsultants(query);
      res.status(HTTP_STATUS.OK).json(paginatedResponse(result.data, result.meta));
    } catch (error) {
      next(error);
    }
  }

  async updateConsultant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = UpdateConsultantSchema.parse(req.body);
      const consultant = await this.consultantService.updateConsultant(req.params.id, validated);
      res.status(HTTP_STATUS.OK).json(successResponse(consultant, 'Consultant updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteConsultant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.consultantService.deleteConsultant(req.params.id);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  async activateConsultant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const consultant = await this.consultantService.activateConsultant(req.params.id);
      res.status(HTTP_STATUS.OK).json(successResponse(consultant, 'Consultant activated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deactivateConsultant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const consultant = await this.consultantService.deactivateConsultant(req.params.id);
      res.status(HTTP_STATUS.OK).json(successResponse(consultant, 'Consultant deactivated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getConsultantAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = ConsultantQuerySchema.parse(req.query);
      const availability = await this.consultantService.getConsultantAvailability(req.params.id, query);
      res.status(HTTP_STATUS.OK).json(successResponse(availability));
    } catch (error) {
      next(error);
    }
  }

  async getConsultantBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = ConsultantQuerySchema.parse(req.query);
      const result = await this.consultantService.getConsultantBookings(req.params.id, query);
      res.status(HTTP_STATUS.OK).json(paginatedResponse(result.data, result.meta));
    } catch (error) {
      next(error);
    }
  }

  async getConsultantStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await this.consultantService.getConsultantStats(req.params.id);
      res.status(HTTP_STATUS.OK).json(successResponse(stats));
    } catch (error) {
      next(error);
    }
  }
}