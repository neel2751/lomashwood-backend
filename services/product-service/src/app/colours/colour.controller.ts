import { Request, Response, NextFunction } from 'express';
import { ColourService } from './colour.service';
import {
  CreateColourSchema,
  UpdateColourSchema,
  ColourQuerySchema,
  ColourIdSchema,
  BulkDeleteColourSchema,
} from './colour.schemas';
import { COLOUR_CONSTANTS } from './colour.constants';
import { ApiError } from '../../shared/errors';
import { asyncHandler } from '../../shared/utils';

export class ColourController {
  constructor(private readonly colourService: ColourService) {}

  createColour = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const validatedData = CreateColourSchema.parse(req.body);

      const colour = await this.colourService.createColour(validatedData);

      res.status(COLOUR_CONSTANTS.HTTP_STATUS.CREATED).json({
        success: true,
        message: COLOUR_CONSTANTS.SUCCESS_MESSAGES.COLOUR_CREATED,
        data: colour,
      });
    }
  );

  getAllColours = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const validatedQuery = ColourQuerySchema.parse(req.query);

      const result = await this.colourService.getAllColours(validatedQuery);

      res.status(COLOUR_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    }
  );

  getColourById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { id } = ColourIdSchema.parse(req.params);

      const colour = await this.colourService.getColourById(id);

      if (!colour) {
        throw new ApiError(
          COLOUR_CONSTANTS.HTTP_STATUS.NOT_FOUND,
          COLOUR_CONSTANTS.ERRORS.COLOUR_NOT_FOUND
        );
      }

      res.status(COLOUR_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: colour,
      });
    }
  );

  updateColour = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { id } = ColourIdSchema.parse(req.params);
      const validatedData = UpdateColourSchema.parse(req.body);

      const colour = await this.colourService.updateColour(id, validatedData);

      res.status(COLOUR_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: COLOUR_CONSTANTS.SUCCESS_MESSAGES.COLOUR_UPDATED,
        data: colour,
      });
    }
  );

  deleteColour = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { id } = ColourIdSchema.parse(req.params);

      await this.colourService.deleteColour(id);

      res.status(COLOUR_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: COLOUR_CONSTANTS.SUCCESS_MESSAGES.COLOUR_DELETED,
      });
    }
  );

  bulkDeleteColours = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { ids } = BulkDeleteColourSchema.parse(req.body);

      const result = await this.colourService.bulkDeleteColours(ids);

      res.status(COLOUR_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: COLOUR_CONSTANTS.SUCCESS_MESSAGES.COLOURS_BULK_DELETED,
        data: result,
      });
    }
  );

  getActiveColours = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const colours = await this.colourService.getActiveColours();

      res.status(COLOUR_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: colours,
      });
    }
  );

  getPopularColours = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { limit } = req.query;
      const parsedLimit = limit
        ? parseInt(limit as string, 10)
        : COLOUR_CONSTANTS.POPULAR.DEFAULT_LIMIT;

      const colours = await this.colourService.getPopularColours(parsedLimit);

      res.status(COLOUR_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: colours,
      });
    }
  );

  searchColours = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        throw new ApiError(
          COLOUR_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
          COLOUR_CONSTANTS.ERRORS.INVALID_SEARCH_QUERY
        );
      }

      const colours = await this.colourService.searchColours(query);

      res.status(COLOUR_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: colours,
      });
    }
  );

  toggleColourStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { id } = ColourIdSchema.parse(req.params);

      const colour = await this.colourService.toggleColourStatus(id);

      const message = colour.isActive
        ? COLOUR_CONSTANTS.SUCCESS_MESSAGES.COLOUR_ACTIVATED
        : COLOUR_CONSTANTS.SUCCESS_MESSAGES.COLOUR_DEACTIVATED;

      res.status(COLOUR_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message,
        data: colour,
      });
    }
  );

  getColourStatistics = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const statistics = await this.colourService.getColourStatistics();

      res.status(COLOUR_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: statistics,
      });
    }
  );

  getColourWithProducts = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { id } = ColourIdSchema.parse(req.params);
      const { page, limit } = req.query;

      const parsedPage = page
        ? parseInt(page as string, 10)
        : COLOUR_CONSTANTS.PAGINATION.DEFAULT_PAGE;
      const parsedLimit = limit
        ? parseInt(limit as string, 10)
        : COLOUR_CONSTANTS.PAGINATION.DEFAULT_LIMIT;

      const result = await this.colourService.getColourWithProducts(id, parsedPage, parsedLimit);

      res.status(COLOUR_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: result.colour,
        products: result.products,
        meta: result.meta,
      });
    }
  );

  exportColours = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { format } = req.query;

      const exportData = await this.colourService.exportColours(format as string);

      res.status(COLOUR_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: exportData,
      });
    }
  );

  getColoursByCategory = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { categoryId } = req.params;

      if (!categoryId) {
        throw new ApiError(
          COLOUR_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
          COLOUR_CONSTANTS.ERRORS.INVALID_CATEGORY_ID
        );
      }

      const colours = await this.colourService.getColoursByCategory(categoryId);

      res.status(COLOUR_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: colours,
      });
    }
  );

  validateHexCode = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { hexCode } = req.body;

      if (!hexCode || typeof hexCode !== 'string') {
        throw new ApiError(
          COLOUR_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
          COLOUR_CONSTANTS.ERRORS.INVALID_HEX_CODE
        );
      }

      const isValid = COLOUR_CONSTANTS.REGEX.HEX_COLOR.test(hexCode);

      res.status(COLOUR_CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: {
          hexCode,
          isValid,
        },
      });
    }
  );
}