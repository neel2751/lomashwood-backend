import { ColourRepository } from './colour.repository';
import {
  CreateColourDTO,
  UpdateColourDTO,
  ColourQueryDTO,
  ColourResponseDTO,
  PaginatedColoursResponseDTO,
  ColourWithProductsDTO,
  ColourStatistics,
  BulkDeleteColourResult,
} from './colour.types';
import { ColourMapper } from './colour.mapper';
import { COLOUR_CONSTANTS, COLOUR_ERROR_CODES } from './colour.constants';
import { ApiError } from '../../shared/errors';
import { Logger } from '../../shared/utils';

export class ColourService {
  private readonly logger: Logger;

  constructor(private readonly colourRepository: ColourRepository) {
    this.logger = new Logger('ColourService');
  }

  async createColour(data: CreateColourDTO): Promise<ColourResponseDTO> {
    this.logger.info('Creating colour', { name: data.name });

    const existingColour = await this.colourRepository.findByName(data.name);
    if (existingColour) {
      throw new ApiError(
        COLOUR_CONSTANTS.HTTP_STATUS.CONFLICT,
        COLOUR_CONSTANTS.ERRORS.COLOUR_ALREADY_EXISTS,
        COLOUR_ERROR_CODES.COL002
      );
    }

    if (!COLOUR_CONSTANTS.REGEX.HEX_COLOR.test(data.hexCode)) {
      throw new ApiError(
        COLOUR_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
        COLOUR_CONSTANTS.ERRORS.INVALID_HEX_CODE,
        COLOUR_ERROR_CODES.COL003
      );
    }

    const colour = await this.colourRepository.create(data);

    this.logger.info('Colour created successfully', { id: colour.id });

    return ColourMapper.toResponseDTO(colour);
  }

  async getAllColours(query: ColourQueryDTO): Promise<PaginatedColoursResponseDTO> {
    this.logger.info('Fetching colours', { query });

    const { page, limit, isActive, search, sortBy } = query;

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { hexCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = this.buildOrderBy(sortBy);

    const [colours, total] = await Promise.all([
      this.colourRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      this.colourRepository.count({ where }),
    ]);

    return ColourMapper.toPaginatedResponse(colours, total, page, limit);
  }

  async getColourById(id: string): Promise<ColourResponseDTO> {
    this.logger.info('Fetching colour by ID', { id });

    const colour = await this.colourRepository.findById(id, {
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!colour) {
      throw new ApiError(
        COLOUR_CONSTANTS.HTTP_STATUS.NOT_FOUND,
        COLOUR_CONSTANTS.ERRORS.COLOUR_NOT_FOUND,
        COLOUR_ERROR_CODES.COL001
      );
    }

    return ColourMapper.toResponseDTO(colour);
  }

  async updateColour(id: string, data: UpdateColourDTO): Promise<ColourResponseDTO> {
    this.logger.info('Updating colour', { id, data });

    const existingColour = await this.colourRepository.findById(id);
    if (!existingColour) {
      throw new ApiError(
        COLOUR_CONSTANTS.HTTP_STATUS.NOT_FOUND,
        COLOUR_CONSTANTS.ERRORS.COLOUR_NOT_FOUND,
        COLOUR_ERROR_CODES.COL001
      );
    }

    if (data.name && data.name !== existingColour.name) {
      const colourWithName = await this.colourRepository.findByName(data.name);
      if (colourWithName) {
        throw new ApiError(
          COLOUR_CONSTANTS.HTTP_STATUS.CONFLICT,
          COLOUR_CONSTANTS.ERRORS.COLOUR_NAME_EXISTS,
          COLOUR_ERROR_CODES.COL004
        );
      }
    }

    if (data.hexCode && !COLOUR_CONSTANTS.REGEX.HEX_COLOR.test(data.hexCode)) {
      throw new ApiError(
        COLOUR_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
        COLOUR_CONSTANTS.ERRORS.INVALID_HEX_CODE,
        COLOUR_ERROR_CODES.COL003
      );
    }

    const colour = await this.colourRepository.update(id, data);

    this.logger.info('Colour updated successfully', { id });

    return ColourMapper.toResponseDTO(colour);
  }

  async deleteColour(id: string): Promise<void> {
    this.logger.info('Deleting colour', { id });

    const colour = await this.colourRepository.findById(id, {
      include: {
        products: true,
      },
    });

    if (!colour) {
      throw new ApiError(
        COLOUR_CONSTANTS.HTTP_STATUS.NOT_FOUND,
        COLOUR_CONSTANTS.ERRORS.COLOUR_NOT_FOUND,
        COLOUR_ERROR_CODES.COL001
      );
    }

    if (colour.products && colour.products.length > 0) {
      throw new ApiError(
        COLOUR_CONSTANTS.HTTP_STATUS.CONFLICT,
        COLOUR_CONSTANTS.ERRORS.COLOUR_HAS_PRODUCTS,
        COLOUR_ERROR_CODES.COL005
      );
    }

    await this.colourRepository.delete(id);

    this.logger.info('Colour deleted successfully', { id });
  }

  async bulkDeleteColours(ids: string[]): Promise<BulkDeleteColourResult> {
    this.logger.info('Bulk deleting colours', { count: ids.length });

    const result: BulkDeleteColourResult = {
      successful: [],
      failed: [],
      total: ids.length,
      successCount: 0,
      failCount: 0,
    };

    for (const id of ids) {
      try {
        await this.deleteColour(id);
        result.successful.push(id);
        result.successCount++;
      } catch (error) {
        result.failed.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        result.failCount++;
      }
    }

    this.logger.info('Bulk delete completed', result);

    return result;
  }

  async getActiveColours(): Promise<ColourResponseDTO[]> {
    this.logger.info('Fetching active colours');

    const colours = await this.colourRepository.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return ColourMapper.toResponseDTOList(colours);
  }

  async getPopularColours(limit: number): Promise<ColourResponseDTO[]> {
    this.logger.info('Fetching popular colours', { limit });

    const colours = await this.colourRepository.findPopular(limit);

    return ColourMapper.toResponseDTOList(colours);
  }

  async searchColours(query: string): Promise<ColourResponseDTO[]> {
    this.logger.info('Searching colours', { query });

    const colours = await this.colourRepository.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { hexCode: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      take: COLOUR_CONSTANTS.SEARCH.MAX_RESULTS,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return ColourMapper.toResponseDTOList(colours);
  }

  async toggleColourStatus(id: string): Promise<ColourResponseDTO> {
    this.logger.info('Toggling colour status', { id });

    const colour = await this.colourRepository.findById(id);
    if (!colour) {
      throw new ApiError(
        COLOUR_CONSTANTS.HTTP_STATUS.NOT_FOUND,
        COLOUR_CONSTANTS.ERRORS.COLOUR_NOT_FOUND,
        COLOUR_ERROR_CODES.COL001
      );
    }

    const updated = await this.colourRepository.update(id, {
      isActive: !colour.isActive,
    });

    return ColourMapper.toResponseDTO(updated);
  }

  async getColourStatistics(): Promise<ColourStatistics> {
    this.logger.info('Fetching colour statistics');

    const [totalColours, activeColours, coloursWithProducts] = await Promise.all([
      this.colourRepository.count({}),
      this.colourRepository.count({ where: { isActive: true } }),
      this.colourRepository.countColoursWithProducts(),
    ]);

    return {
      totalColours,
      activeColours,
      coloursWithProducts,
    };
  }

  async getColourWithProducts(
    id: string,
    page: number,
    limit: number
  ): Promise<ColourWithProductsDTO> {
    this.logger.info('Fetching colour with products', { id, page, limit });

    const colour = await this.colourRepository.findById(id);

    if (!colour) {
      throw new ApiError(
        COLOUR_CONSTANTS.HTTP_STATUS.NOT_FOUND,
        COLOUR_CONSTANTS.ERRORS.COLOUR_NOT_FOUND,
        COLOUR_ERROR_CODES.COL001
      );
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.colourRepository.findProductsByColour(id, skip, limit),
      this.colourRepository.countProductsByColour(id),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      colour: ColourMapper.toResponseDTO(colour),
      products,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async exportColours(format?: string): Promise<unknown> {
    this.logger.info('Exporting colours', { format });

    const colours = await this.colourRepository.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return ColourMapper.toExportDTOList(colours);
  }

  async getColoursByCategory(categoryId: string): Promise<ColourResponseDTO[]> {
    this.logger.info('Fetching colours by category', { categoryId });

    const colours = await this.colourRepository.findByCategory(categoryId);

    return ColourMapper.toResponseDTOList(colours);
  }

  private buildOrderBy(sortBy?: string): Record<string, string> | Record<string, string>[] {
    switch (sortBy) {
      case COLOUR_CONSTANTS.SORT_OPTIONS.NAME_ASC:
        return { name: 'asc' };
      case COLOUR_CONSTANTS.SORT_OPTIONS.NAME_DESC:
        return { name: 'desc' };
      case COLOUR_CONSTANTS.SORT_OPTIONS.NEWEST:
        return { createdAt: 'desc' };
      case COLOUR_CONSTANTS.SORT_OPTIONS.OLDEST:
        return { createdAt: 'asc' };
      case COLOUR_CONSTANTS.SORT_OPTIONS.MOST_USED:
        return [{ products: { _count: 'desc' } }, { name: 'asc' }];
      default:
        return { name: 'asc' };
    }
  }
}