import { Request, Response, NextFunction } from 'express';
import { AvailabilityService } from './availability.service';
import {
  CreateAvailabilitySchema,
  UpdateAvailabilitySchema,
  AvailabilityQuerySchema,
  CreateSlotSchema,
  UpdateSlotSchema,
} from './availability.schemas';
import { successResponse, paginatedResponse } from '../../shared/utils';
import { HTTP_STATUS } from '../../shared/constants';
import {
  CreateAvailabilityDto,
  CreateSlotDto,
  UpdateAvailabilityDto,
  UpdateSlotDto,
} from './availability.types';

export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  async createAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateAvailabilitySchema.parse(req.body) as CreateAvailabilityDto;
      const availability = await this.availabilityService.createAvailability(validated);
      res.status(HTTP_STATUS.CREATED).json(successResponse(availability, 'Availability created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getAvailabilityById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const availability = await this.availabilityService.getAvailabilityById(req.params.id);
      res.status(HTTP_STATUS.OK).json(successResponse(availability));
    } catch (error) {
      next(error);
    }
  }

  async getAllAvailabilities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = AvailabilityQuerySchema.parse(req.query);
      const result = await this.availabilityService.getAllAvailabilities(query);
      res.status(HTTP_STATUS.OK).json(paginatedResponse(result.data, result.meta));
    } catch (error) {
      next(error);
    }
  }

  async getAvailabilityByConsultant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = AvailabilityQuerySchema.parse(req.query);
      const result = await this.availabilityService.getAvailabilityByConsultant(
        req.params.consultantId,
        query,
      );
      res.status(HTTP_STATUS.OK).json(paginatedResponse(result.data, result.meta));
    } catch (error) {
      next(error);
    }
  }

  async updateAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = UpdateAvailabilitySchema.parse(req.body) as UpdateAvailabilityDto;
      const availability = await this.availabilityService.updateAvailability(req.params.id, validated);
      res.status(HTTP_STATUS.OK).json(successResponse(availability, 'Availability updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.availabilityService.deleteAvailability(req.params.id);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  async createSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateSlotSchema.parse(req.body) as CreateSlotDto;
      const slot = await this.availabilityService.createSlot(validated);
      res.status(HTTP_STATUS.CREATED).json(successResponse(slot, 'Slot created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getSlotById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slot = await this.availabilityService.getSlotById(req.params.id);
      res.status(HTTP_STATUS.OK).json(successResponse(slot));
    } catch (error) {
      next(error);
    }
  }

  async getAvailableSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = AvailabilityQuerySchema.parse(req.query);
      const slots = await this.availabilityService.getAvailableSlots(query);
      res.status(HTTP_STATUS.OK).json(successResponse(slots));
    } catch (error) {
      next(error);
    }
  }

  async getSlotsByConsultant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = AvailabilityQuerySchema.parse(req.query);
      const slots = await this.availabilityService.getSlotsByConsultant(
        req.params.consultantId,
        query,
      );
      res.status(HTTP_STATUS.OK).json(successResponse(slots));
    } catch (error) {
      next(error);
    }
  }

  async updateSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = UpdateSlotSchema.parse(req.body) as UpdateSlotDto;
      const slot = await this.availabilityService.updateSlot(req.params.id, validated);
      res.status(HTTP_STATUS.OK).json(successResponse(slot, 'Slot updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.availabilityService.deleteSlot(req.params.id);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  async markSlotAsBooked(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slot = await this.availabilityService.markSlotAsBooked(req.params.id);
      res.status(HTTP_STATUS.OK).json(successResponse(slot, 'Slot marked as booked'));
    } catch (error) {
      next(error);
    }
  }

  async markSlotAsAvailable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slot = await this.availabilityService.markSlotAsAvailable(req.params.id);
      res.status(HTTP_STATUS.OK).json(successResponse(slot, 'Slot marked as available'));
    } catch (error) {
      next(error);
    }
  }
}