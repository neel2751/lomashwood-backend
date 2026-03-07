import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AppointmentService } from '../appointments/appointment.service';
import { ApiResponse } from '../../../../packages/api-client/src/types/api.types';

export class AppointmentController {
  private appointmentService = new AppointmentService();

  async getAppointments(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        customerId,
        consultantId,
        showroomId,
        status,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        customerId: customerId as string,
        consultantId: consultantId as string,
        showroomId: showroomId as string,
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await this.appointmentService.getAppointments({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters,
      });

      res.json(result);
    } catch (error) {
      console.error('Get appointments error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.appointmentService.getAppointment(id);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async createAppointment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        } as ApiResponse);
        return;
      }

      const appointmentData = req.body;
      const result = await this.appointmentService.createAppointment(appointmentData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async updateAppointment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        } as ApiResponse);
        return;
      }

      const { id } = req.params;
      const appointmentData = req.body;
      const result = await this.appointmentService.updateAppointment(id, appointmentData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Update appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async cancelAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await this.appointmentService.cancelAppointment(id, reason);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Cancel appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getAvailability(req: Request, res: Response): Promise<void> {
    try {
      const {
        consultantId,
        showroomId,
        startDate,
        endDate,
      } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
          error: 'DATES_REQUIRED',
        } as ApiResponse);
        return;
      }

      const availabilityParams = {
        consultantId: consultantId as string,
        showroomId: showroomId as string,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const result = await this.appointmentService.getAvailability(availabilityParams);

      res.json(result);
    } catch (error) {
      console.error('Get availability error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getConsultants(req: Request, res: Response): Promise<void> {
    try {
      const { active = 'true' } = req.query;
      const result = await this.appointmentService.getConsultants(active === 'true');

      res.json(result);
    } catch (error) {
      console.error('Get consultants error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getShowrooms(req: Request, res: Response): Promise<void> {
    try {
      const { active = 'true' } = req.query;
      const result = await this.appointmentService.getShowrooms(active === 'true');

      res.json(result);
    } catch (error) {
      console.error('Get showrooms error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getTimeSlots(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.query;

      if (!date) {
        res.status(400).json({
          success: false,
          message: 'Date is required',
          error: 'DATE_REQUIRED',
        } as ApiResponse);
        return;
      }

      const result = await this.appointmentService.getTimeSlots(new Date(date as string));

      res.json(result);
    } catch (error) {
      console.error('Get time slots error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async rescheduleAppointment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        } as ApiResponse);
        return;
      }

      const { id } = req.params;
      const { newDate, newTime, reason } = req.body;
      const result = await this.appointmentService.rescheduleAppointment(id, newDate, newTime, reason);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Reschedule appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }
}
