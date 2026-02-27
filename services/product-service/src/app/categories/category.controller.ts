import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoryQuerySchema,
  CategoryIdSchema,
  BulkDeleteCategorySchema,
} from './category.schemas';
import { CATEGORY_CONSTANTS } from './category.constants';
import { ApiError } from '../../shared/errors';
import { asyncHandler } from '../../shared/utils';

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  createCategory = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const validatedData = CreateCategorySchema.parse(req.body);

      const category = await this.categoryService.createCategory(validatedData);

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.CREATED).json({
        success: true,
        message: CATEGORY_CONSTANTS.SUCCESS_MESSAGES.CATEGORY_CREATED,
        data: category,
      });
    }
  );

  getAllCategories = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const validatedQuery = CategoryQuerySchema.parse(req.query);

      const result = await this.categoryService.getAllCategories(validatedQuery);

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    }
  );

  getCategoryById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { id } = CategoryIdSchema.parse(req.params);

      const category = await this.categoryService.getCategoryById(id);

      if (!category) {
        throw new ApiError(
          CATEGORY_CONSTANTS.HTTP_STATUS.NOT_FOUND,
          CATEGORY_CONSTANTS.ERRORS.CATEGORY_NOT_FOUND
        );
      }

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: category,
      });
    }
  );

  getCategoryBySlug = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { slug } = req.params;

      if (!slug || typeof slug !== 'string') {
        throw new ApiError(
          CATEGORY_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
          CATEGORY_CONSTANTS.ERRORS.INVALID_SLUG
        );
      }

      const category = await this.categoryService.getCategoryBySlug(slug);

      if (!category) {
        throw new ApiError(
          CATEGORY_CONSTANTS.HTTP_STATUS.NOT_FOUND,
          CATEGORY_CONSTANTS.ERRORS.CATEGORY_NOT_FOUND
        );
      }

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: category,
      });
    }
  );

  updateCategory = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { id } = CategoryIdSchema.parse(req.params);
      const validatedData = UpdateCategorySchema.parse(req.body);

      const category = await this.categoryService.updateCategory(id, validatedData);

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: CATEGORY_CONSTANTS.SUCCESS_MESSAGES.CATEGORY_UPDATED,
        data: category,
      });
    }
  );

  deleteCategory = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { id } = CategoryIdSchema.parse(req.params);

      await this.categoryService.deleteCategory(id);

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: CATEGORY_CONSTANTS.SUCCESS_MESSAGES.CATEGORY_DELETED,
      });
    }
  );

  bulkDeleteCategories = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { ids } = BulkDeleteCategorySchema.parse(req.body);

      const result = await this.categoryService.bulkDeleteCategories(ids);

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: CATEGORY_CONSTANTS.SUCCESS_MESSAGES.CATEGORIES_BULK_DELETED,
        data: result,
      });
    }
  );

  getCategoriesByType = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { type } = req.params;

      if (!type || (type !== 'KITCHEN' && type !== 'BEDROOM')) {
        throw new ApiError(
          CATEGORY_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
          CATEGORY_CONSTANTS.ERRORS.INVALID_TYPE
        );
      }

      const categories = await this.categoryService.getCategoriesByType(type);

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: categories,
      });
    }
  );

  getActiveCategories = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const categories = await this.categoryService.getActiveCategories();

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: categories,
      });
    }
  );

  getFeaturedCategories = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { limit } = req.query;
      const parsedLimit = limit ? parseInt(limit as string, 10) : CATEGORY_CONSTANTS.FEATURED.DEFAULT_LIMIT;

      const categories = await this.categoryService.getFeaturedCategories(parsedLimit);

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: categories,
      });
    }
  );

  getCategoryHierarchy = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const hierarchy = await this.categoryService.getCategoryHierarchy();

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: hierarchy,
      });
    }
  );

  getCategoryWithProducts = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { id } = CategoryIdSchema.parse(req.params);
      const { page, limit } = req.query;

      const parsedPage = page ? parseInt(page as string, 10) : CATEGORY_CONSTANTS.PAGINATION.DEFAULT_PAGE;
      const parsedLimit = limit ? parseInt(limit as string, 10) : CATEGORY_CONSTANTS.PAGINATION.DEFAULT_LIMIT;

      const result = await this.categoryService.getCategoryWithProducts(id, parsedPage, parsedLimit);

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: result.category,
        products: result.products,
        meta: result.meta,
      });
    }
  );

  toggleCategoryStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { id } = CategoryIdSchema.parse(req.params);

      const category = await this.categoryService.toggleCategoryStatus(id);

      const message = category.isActive
        ? CATEGORY_CONSTANTS.SUCCESS_MESSAGES.CATEGORY_ACTIVATED
        : CATEGORY_CONSTANTS.SUCCESS_MESSAGES.CATEGORY_DEACTIVATED;

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message,
        data: category,
      });
    }
  );

  toggleFeaturedStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { id } = CategoryIdSchema.parse(req.params);

      const category = await this.categoryService.toggleFeaturedStatus(id);

      const message = category.isFeatured
        ? CATEGORY_CONSTANTS.SUCCESS_MESSAGES.CATEGORY_FEATURED
        : CATEGORY_CONSTANTS.SUCCESS_MESSAGES.CATEGORY_UNFEATURED;

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message,
        data: category,
      });
    }
  );

  searchCategories = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        throw new ApiError(
          CATEGORY_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
          CATEGORY_CONSTANTS.ERRORS.INVALID_SEARCH_QUERY
        );
      }

      const categories = await this.categoryService.searchCategories(query);

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: categories,
      });
    }
  );

  getCategoryStatistics = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const statistics = await this.categoryService.getCategoryStatistics();

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: statistics,
      });
    }
  );

  reorderCategories = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { categoryOrders } = req.body;

      if (!Array.isArray(categoryOrders)) {
        throw new ApiError(
          CATEGORY_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
          CATEGORY_CONSTANTS.ERRORS.INVALID_REORDER_DATA
        );
      }

      await this.categoryService.reorderCategories(categoryOrders);

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: CATEGORY_CONSTANTS.SUCCESS_MESSAGES.CATEGORIES_REORDERED,
      });
    }
  );

  exportCategories = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { format } = req.query;

      const exportData = await this.categoryService.exportCategories(format as string);

      res.status(CATEGORY_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: exportData,
      });
    }
  );
}