import { Request, Response, NextFunction } from 'express';
import { SizeService } from './size.service';
import { CreateSizeDTO, UpdateSizeDTO, SizeFilters, BulkCreateSizeDTO, BulkDeleteSizeDTO } from './size.types';
import { SizeMapper } from './size.mapper';
import { SIZE_CONSTANTS } from './size.constants';

export class SizeController {
  constructor(private readonly sizeService: SizeService) {}

  async getAllSizes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: SizeFilters = {
        q: req.query.q as string,
        category: req.query.category as any,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        page: parseInt(req.query.page as string) || SIZE_CONSTANTS.PAGINATION.DEFAULT_PAGE,
        limit: parseInt(req.query.limit as string) || SIZE_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        sortBy: (req.query.sortBy as any) || SIZE_CONSTANTS.SORT.DEFAULT_FIELD,
        sortOrder: (req.query.sortOrder as any) || SIZE_CONSTANTS.SORT.DEFAULT_ORDER
      };

      const result = await this.sizeService.findAll(filters);

      res.status(200).json({
        success: true,
        message: 'Sizes retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getSizeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const size = await this.sizeService.findById(id);

      if (!size) {
        res.status(404).json({
          success: false,
          message: SIZE_CONSTANTS.ERROR_MESSAGES.SIZE_NOT_FOUND,
          error: {
            code: SIZE_CONSTANTS.ERROR_CODES.SIZE_NOT_FOUND
          }
        });
        return;
      }

      const response = SizeMapper.toResponse(size);

      res.status(200).json({
        success: true,
        message: 'Size retrieved successfully',
        data: response
      });
    } catch (error) {
      next(error);
    }
  }

  async createSize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createData: CreateSizeDTO = req.body;

      const size = await this.sizeService.create(createData);
      const response = SizeMapper.toResponse(size);

      res.status(201).json({
        success: true,
        message: SIZE_CONSTANTS.SUCCESS_MESSAGES.SIZE_CREATED,
        data: response
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateSizeDTO = req.body;

      const size = await this.sizeService.update(id, updateData);

      if (!size) {
        res.status(404).json({
          success: false,
          message: SIZE_CONSTANTS.ERROR_MESSAGES.SIZE_NOT_FOUND,
          error: {
            code: SIZE_CONSTANTS.ERROR_CODES.SIZE_NOT_FOUND
          }
        });
        return;
      }

      const response = SizeMapper.toResponse(size);

      res.status(200).json({
        success: true,
        message: SIZE_CONSTANTS.SUCCESS_MESSAGES.SIZE_UPDATED,
        data: response
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await this.sizeService.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: SIZE_CONSTANTS.ERROR_MESSAGES.SIZE_NOT_FOUND,
          error: {
            code: SIZE_CONSTANTS.ERROR_CODES.SIZE_NOT_FOUND
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: SIZE_CONSTANTS.SUCCESS_MESSAGES.SIZE_DELETED,
        data: { id }
      });
    } catch (error) {
      next(error);
    }
  }

  async searchSizes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: SizeFilters = {
        q: req.query.q as string,
        category: req.query.category as any,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        page: parseInt(req.query.page as string) || SIZE_CONSTANTS.PAGINATION.DEFAULT_PAGE,
        limit: parseInt(req.query.limit as string) || SIZE_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        sortBy: (req.query.sortBy as any) || SIZE_CONSTANTS.SORT.DEFAULT_FIELD,
        sortOrder: (req.query.sortOrder as any) || SIZE_CONSTANTS.SORT.DEFAULT_ORDER
      };

      const result = await this.sizeService.search(filters);

      res.status(200).json({
        success: true,
        message: 'Search completed successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSizeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const size = await this.sizeService.updateStatus(id, isActive);

      if (!size) {
        res.status(404).json({
          success: false,
          message: SIZE_CONSTANTS.ERROR_MESSAGES.SIZE_NOT_FOUND,
          error: {
            code: SIZE_CONSTANTS.ERROR_CODES.SIZE_NOT_FOUND
          }
        });
        return;
      }

      const response = SizeMapper.toResponse(size);

      res.status(200).json({
        success: true,
        message: SIZE_CONSTANTS.SUCCESS_MESSAGES.SIZE_STATUS_UPDATED,
        data: response
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkCreateSizes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bulkData: BulkCreateSizeDTO = req.body;

      const result = await this.sizeService.bulkCreate(bulkData.sizes);
      const response = SizeMapper.toBulkCreateResponse(result.created, result.failed);

      const statusCode = result.failed.length > 0 ? 207 : 201;

      res.status(statusCode).json({
        success: result.failed.length === 0,
        message: result.failed.length === 0 
          ? SIZE_CONSTANTS.SUCCESS_MESSAGES.BULK_CREATE_SUCCESS 
          : SIZE_CONSTANTS.ERROR_MESSAGES.BULK_OPERATION_FAILED,
        data: response
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkDeleteSizes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bulkData: BulkDeleteSizeDTO = req.body;

      const result = await this.sizeService.bulkDelete(bulkData.ids);
      const response = SizeMapper.toBulkDeleteResponse(result.deleted, result.failed);

      const statusCode = result.failed.length > 0 ? 207 : 200;

      res.status(statusCode).json({
        success: result.failed.length === 0,
        message: result.failed.length === 0 
          ? SIZE_CONSTANTS.SUCCESS_MESSAGES.BULK_DELETE_SUCCESS 
          : SIZE_CONSTANTS.ERROR_MESSAGES.BULK_OPERATION_FAILED,
        data: response
      });
    } catch (error) {
      next(error);
    }
  }

  async getSizesByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.params;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const page = parseInt(req.query.page as string) || SIZE_CONSTANTS.PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit as string) || SIZE_CONSTANTS.PAGINATION.DEFAULT_LIMIT;

      const result = await this.sizeService.findByCategory(category as any, isActive, page, limit);

      res.status(200).json({
        success: true,
        message: 'Sizes retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getSizeWithProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const sizeWithProducts = await this.sizeService.findByIdWithProducts(id);

      if (!sizeWithProducts) {
        res.status(404).json({
          success: false,
          message: SIZE_CONSTANTS.ERROR_MESSAGES.SIZE_NOT_FOUND,
          error: {
            code: SIZE_CONSTANTS.ERROR_CODES.SIZE_NOT_FOUND
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Size with products retrieved successfully',
        data: sizeWithProducts
      });
    } catch (error) {
      next(error);
    }
  }

  async getSizesByDimensions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const width = parseFloat(req.query.width as string);
      const height = parseFloat(req.query.height as string);
      const depth = parseFloat(req.query.depth as string);
      const tolerance = parseFloat(req.query.tolerance as string) || 0;

      const sizes = await this.sizeService.findByDimensions(width, height, depth, tolerance);

      res.status(200).json({
        success: true,
        message: 'Sizes retrieved successfully',
        data: SizeMapper.toResponseArray(sizes)
      });
    } catch (error) {
      next(error);
    }
  }
}