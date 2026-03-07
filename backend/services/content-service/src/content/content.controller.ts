import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { ContentService } from '../content/content.service';
import { ApiResponse } from '../../../../packages/api-client/src/types/api.types';

export class ContentController {
  private contentService = new ContentService();

  async getBlogs(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        category,
        status,
        featured,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        category: category as string,
        status: status as string,
        featured: featured === 'true',
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await this.contentService.getBlogs({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters,
      });

      res.json(result);
    } catch (error) {
      console.error('Get blogs error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getBlog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.contentService.getBlog(id);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async createBlog(req: Request, res: Response): Promise<void> {
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

      const blogData = req.body;
      const result = await this.contentService.createBlog(blogData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async updateBlog(req: Request, res: Response): Promise<void> {
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
      const blogData = req.body;
      const result = await this.contentService.updateBlog(id, blogData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Update blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async deleteBlog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.contentService.deleteBlog(id);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Delete blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getMediaItems(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        type,
        category,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        type: type as string,
        category: category as string,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await this.contentService.getMediaItems({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters,
      });

      res.json(result);
    } catch (error) {
      console.error('Get media items error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async uploadMedia(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
          error: 'NO_FILE_UPLOADED',
        } as ApiResponse);
        return;
      }

      const result = await this.contentService.uploadMedia(file);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Upload media error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getCmsPages(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        status: status as string,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await this.contentService.getCmsPages({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters,
      });

      res.json(result);
    } catch (error) {
      console.error('Get CMS pages error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getCmsPage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.contentService.getCmsPage(id);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get CMS page error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async createCmsPage(req: Request, res: Response): Promise<void> {
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

      const pageData = req.body;
      const result = await this.contentService.createCmsPage(pageData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create CMS page error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async updateCmsPage(req: Request, res: Response): Promise<void> {
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
      const pageData = req.body;
      const result = await this.contentService.updateCmsPage(id, pageData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Update CMS page error:', error);
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
      const result = await this.contentService.getShowrooms(active === 'true');

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

  async getLandingPages(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        status: status as string,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await this.contentService.getLandingPages({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters,
      });

      res.json(result);
    } catch (error) {
      console.error('Get landing pages error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }
}
