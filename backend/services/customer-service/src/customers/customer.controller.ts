import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { CustomerService } from '../customers/customer.service';
import { ApiResponse } from '../../../../packages/api-client/src/types/api.types';

export class CustomerController {
  private customerService = new CustomerService();

  async getCustomers(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        search,
        status,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        search: search as string,
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await this.customerService.getCustomers({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters,
      });

      res.json(result);
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.customerService.getCustomer(id);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get customer error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async createCustomer(req: Request, res: Response): Promise<void> {
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

      const customerData = req.body;
      const result = await this.customerService.createCustomer(customerData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async updateCustomer(req: Request, res: Response): Promise<void> {
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
      const customerData = req.body;
      const result = await this.customerService.updateCustomer(id, customerData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async deleteCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.customerService.deleteCustomer(id);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Delete customer error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getReviews(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        customerId,
        productId,
        rating,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        customerId: customerId as string,
        productId: productId as string,
        rating: rating ? parseInt(rating as string) : undefined,
        status: status as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await this.customerService.getReviews({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters,
      });

      res.json(result);
    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async createReview(req: Request, res: Response): Promise<void> {
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

      const reviewData = req.body;
      const result = await this.customerService.createReview(reviewData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getSupportTickets(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        customerId,
        status,
        priority,
        category,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        customerId: customerId as string,
        status: status as string,
        priority: priority as string,
        category: category as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await this.customerService.getSupportTickets({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters,
      });

      res.json(result);
    } catch (error) {
      console.error('Get support tickets error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async createSupportTicket(req: Request, res: Response): Promise<void> {
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

      const ticketData = req.body;
      const result = await this.customerService.createSupportTicket(ticketData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create support ticket error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getWishlist(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const result = await this.customerService.getWishlist(customerId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get wishlist error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async addToWishlist(req: Request, res: Response): Promise<void> {
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

      const { customerId } = req.params;
      const { productId } = req.body;
      const result = await this.customerService.addToWishlist(customerId, productId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Add to wishlist error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async removeFromWishlist(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, productId } = req.params;
      const result = await this.customerService.removeFromWishlist(customerId, productId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }
}
