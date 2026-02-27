import { CategoryRepository } from './category.repository';
import {
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryQueryDTO,
  CategoryResponseDTO,
  PaginatedCategoriesResponseDTO,
  CategoryWithProductsDTO,
  CategoryStatistics,
  CategoryHierarchy,
  BulkDeleteCategoryResult,
  CategoryType,
} from './category.types';
import { CategoryMapper } from './category.mapper';
import { CATEGORY_CONSTANTS, CATEGORY_ERROR_CODES } from './category.constants';
import { ApiError } from '../../shared/errors';
import { Logger } from '../../shared/utils';

export class CategoryService {
  private readonly logger: Logger;

  constructor(private readonly categoryRepository: CategoryRepository) {
    this.logger = new Logger('CategoryService');
  }

  async createCategory(data: CreateCategoryDTO): Promise<CategoryResponseDTO> {
    this.logger.info('Creating category', { name: data.name });

    const existingCategory = await this.categoryRepository.findBySlug(data.slug);
    if (existingCategory) {
      throw new ApiError(
        CATEGORY_CONSTANTS.HTTP_STATUS.CONFLICT,
        CATEGORY_CONSTANTS.ERRORS.CATEGORY_ALREADY_EXISTS,
        CATEGORY_ERROR_CODES.CAT002
      );
    }

    if (data.parentId) {
      const parentCategory = await this.categoryRepository.findById(data.parentId);
      if (!parentCategory) {
        throw new ApiError(
          CATEGORY_CONSTANTS.HTTP_STATUS.NOT_FOUND,
          CATEGORY_CONSTANTS.ERRORS.PARENT_CATEGORY_NOT_FOUND,
          CATEGORY_ERROR_CODES.CAT007
        );
      }

      await this.validateCategoryDepth(data.parentId);
    }

    if (data.order === undefined) {
      const maxOrder = await this.categoryRepository.getMaxOrder();
      data.order = maxOrder + 1;
    }

    const category = await this.categoryRepository.create(data);

    this.logger.info('Category created successfully', { id: category.id });

    return CategoryMapper.toResponseDTO(category);
  }

  async getAllCategories(query: CategoryQueryDTO): Promise<PaginatedCategoriesResponseDTO> {
    this.logger.info('Fetching categories', { query });

    const { page, limit, type, isActive, isFeatured, search, sortBy, parentId } = query;

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = this.buildOrderBy(sortBy);

    const [categories, total] = await Promise.all([
      this.categoryRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          parent: true,
          children: true,
          _count: {
            select: { products: true },
          },
        },
      }),
      this.categoryRepository.count({ where }),
    ]);

    return CategoryMapper.toPaginatedResponse(categories, total, page, limit);
  }

  async getCategoryById(id: string): Promise<CategoryResponseDTO> {
    this.logger.info('Fetching category by ID', { id });

    const category = await this.categoryRepository.findById(id, {
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new ApiError(
        CATEGORY_CONSTANTS.HTTP_STATUS.NOT_FOUND,
        CATEGORY_CONSTANTS.ERRORS.CATEGORY_NOT_FOUND,
        CATEGORY_ERROR_CODES.CAT001
      );
    }

    return CategoryMapper.toResponseDTO(category);
  }

  async getCategoryBySlug(slug: string): Promise<CategoryResponseDTO> {
    this.logger.info('Fetching category by slug', { slug });

    const category = await this.categoryRepository.findBySlug(slug, {
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new ApiError(
        CATEGORY_CONSTANTS.HTTP_STATUS.NOT_FOUND,
        CATEGORY_CONSTANTS.ERRORS.CATEGORY_NOT_FOUND,
        CATEGORY_ERROR_CODES.CAT001
      );
    }

    return CategoryMapper.toResponseDTO(category);
  }

  async updateCategory(id: string, data: UpdateCategoryDTO): Promise<CategoryResponseDTO> {
    this.logger.info('Updating category', { id, data });

    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      throw new ApiError(
        CATEGORY_CONSTANTS.HTTP_STATUS.NOT_FOUND,
        CATEGORY_CONSTANTS.ERRORS.CATEGORY_NOT_FOUND,
        CATEGORY_ERROR_CODES.CAT001
      );
    }

    if (data.slug && data.slug !== existingCategory.slug) {
      const categoryWithSlug = await this.categoryRepository.findBySlug(data.slug);
      if (categoryWithSlug) {
        throw new ApiError(
          CATEGORY_CONSTANTS.HTTP_STATUS.CONFLICT,
          CATEGORY_CONSTANTS.ERRORS.CATEGORY_SLUG_EXISTS,
          CATEGORY_ERROR_CODES.CAT008
        );
      }
    }

    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new ApiError(
          CATEGORY_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
          CATEGORY_CONSTANTS.ERRORS.CANNOT_SET_SELF_AS_PARENT,
          CATEGORY_ERROR_CODES.CAT009
        );
      }

      if (data.parentId) {
        const parentCategory = await this.categoryRepository.findById(data.parentId);
        if (!parentCategory) {
          throw new ApiError(
            CATEGORY_CONSTANTS.HTTP_STATUS.NOT_FOUND,
            CATEGORY_CONSTANTS.ERRORS.PARENT_CATEGORY_NOT_FOUND,
            CATEGORY_ERROR_CODES.CAT007
          );
        }

        await this.validateCircularReference(id, data.parentId);
        await this.validateCategoryDepth(data.parentId);
      }
    }

    const category = await this.categoryRepository.update(id, data);

    this.logger.info('Category updated successfully', { id });

    return CategoryMapper.toResponseDTO(category);
  }

  async deleteCategory(id: string): Promise<void> {
    this.logger.info('Deleting category', { id });

    const category = await this.categoryRepository.findById(id, {
      include: {
        products: true,
        children: true,
      },
    });

    if (!category) {
      throw new ApiError(
        CATEGORY_CONSTANTS.HTTP_STATUS.NOT_FOUND,
        CATEGORY_CONSTANTS.ERRORS.CATEGORY_NOT_FOUND,
        CATEGORY_ERROR_CODES.CAT001
      );
    }

    if (category.products && category.products.length > 0) {
      throw new ApiError(
        CATEGORY_CONSTANTS.HTTP_STATUS.CONFLICT,
        CATEGORY_CONSTANTS.ERRORS.CATEGORY_HAS_PRODUCTS,
        CATEGORY_ERROR_CODES.CAT010
      );
    }

    if (category.children && category.children.length > 0) {
      throw new ApiError(
        CATEGORY_CONSTANTS.HTTP_STATUS.CONFLICT,
        CATEGORY_CONSTANTS.ERRORS.CATEGORY_HAS_CHILDREN,
        CATEGORY_ERROR_CODES.CAT011
      );
    }

    await this.categoryRepository.delete(id);

    this.logger.info('Category deleted successfully', { id });
  }

  async bulkDeleteCategories(ids: string[]): Promise<BulkDeleteCategoryResult> {
    this.logger.info('Bulk deleting categories', { count: ids.length });

    const result: BulkDeleteCategoryResult = {
      successful: [],
      failed: [],
      total: ids.length,
      successCount: 0,
      failCount: 0,
    };

    for (const id of ids) {
      try {
        await this.deleteCategory(id);
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

  async getCategoriesByType(type: CategoryType): Promise<CategoryResponseDTO[]> {
    this.logger.info('Fetching categories by type', { type });

    const categories = await this.categoryRepository.findMany({
      where: { type, isActive: true },
      orderBy: { order: 'asc' },
      include: {
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    return CategoryMapper.toResponseDTOList(categories);
  }

  async getActiveCategories(): Promise<CategoryResponseDTO[]> {
    this.logger.info('Fetching active categories');

    const categories = await this.categoryRepository.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    return CategoryMapper.toResponseDTOList(categories);
  }

  async getFeaturedCategories(limit: number): Promise<CategoryResponseDTO[]> {
    this.logger.info('Fetching featured categories', { limit });

    const categories = await this.categoryRepository.findMany({
      where: { isFeatured: true, isActive: true },
      take: limit,
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return CategoryMapper.toResponseDTOList(categories);
  }

  async getCategoryHierarchy(): Promise<CategoryHierarchy[]> {
    this.logger.info('Fetching category hierarchy');

    const categories = await this.categoryRepository.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { order: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
            },
            _count: {
              select: { products: true },
            },
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    return CategoryMapper.toHierarchyList(categories);
  }

  async getCategoryWithProducts(
    id: string,
    page: number,
    limit: number
  ): Promise<CategoryWithProductsDTO> {
    this.logger.info('Fetching category with products', { id, page, limit });

    const category = await this.categoryRepository.findById(id, {
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      throw new ApiError(
        CATEGORY_CONSTANTS.HTTP_STATUS.NOT_FOUND,
        CATEGORY_CONSTANTS.ERRORS.CATEGORY_NOT_FOUND,
        CATEGORY_ERROR_CODES.CAT001
      );
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.categoryRepository.findProductsByCategory(id, skip, limit),
      this.categoryRepository.countProductsByCategory(id),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      category: CategoryMapper.toResponseDTO(category),
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

  async toggleCategoryStatus(id: string): Promise<CategoryResponseDTO> {
    this.logger.info('Toggling category status', { id });

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new ApiError(
        CATEGORY_CONSTANTS.HTTP_STATUS.NOT_FOUND,
        CATEGORY_CONSTANTS.ERRORS.CATEGORY_NOT_FOUND,
        CATEGORY_ERROR_CODES.CAT001
      );
    }

    const updated = await this.categoryRepository.update(id, {
      isActive: !category.isActive,
    });

    return CategoryMapper.toResponseDTO(updated);
  }

  async toggleFeaturedStatus(id: string): Promise<CategoryResponseDTO> {
    this.logger.info('Toggling featured status', { id });

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new ApiError(
        CATEGORY_CONSTANTS.HTTP_STATUS.NOT_FOUND,
        CATEGORY_CONSTANTS.ERRORS.CATEGORY_NOT_FOUND,
        CATEGORY_ERROR_CODES.CAT001
      );
    }

    const updated = await this.categoryRepository.update(id, {
      isFeatured: !category.isFeatured,
    });

    return CategoryMapper.toResponseDTO(updated);
  }

  async searchCategories(query: string): Promise<CategoryResponseDTO[]> {
    this.logger.info('Searching categories', { query });

    const categories = await this.categoryRepository.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      take: CATEGORY_CONSTANTS.SEARCH.MAX_RESULTS,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return CategoryMapper.toResponseDTOList(categories);
  }

  async getCategoryStatistics(): Promise<CategoryStatistics> {
    this.logger.info('Fetching category statistics');

    const [
      totalCategories,
      activeCategories,
      featuredCategories,
      kitchenCategories,
      bedroomCategories,
      categoriesWithProducts,
    ] = await Promise.all([
      this.categoryRepository.count({}),
      this.categoryRepository.count({ where: { isActive: true } }),
      this.categoryRepository.count({ where: { isFeatured: true } }),
      this.categoryRepository.count({ where: { type: 'KITCHEN' } }),
      this.categoryRepository.count({ where: { type: 'BEDROOM' } }),
      this.categoryRepository.countCategoriesWithProducts(),
    ]);

    return {
      totalCategories,
      activeCategories,
      featuredCategories,
      kitchenCategories,
      bedroomCategories,
      categoriesWithProducts,
    };
  }

  async reorderCategories(categoryOrders: Array<{ id: string; order: number }>): Promise<void> {
    this.logger.info('Reordering categories', { count: categoryOrders.length });

    await this.categoryRepository.reorderCategories(categoryOrders);

    this.logger.info('Categories reordered successfully');
  }

  async exportCategories(format?: string): Promise<unknown> {
    this.logger.info('Exporting categories', { format });

    const categories = await this.categoryRepository.findMany({
      include: {
        parent: true,
        _count: {
          select: { products: true },
        },
      },
    });

    return CategoryMapper.toExportDTOList(categories);
  }

  private buildOrderBy(sortBy?: string): Record<string, string> | Record<string, string>[] {
    switch (sortBy) {
      case CATEGORY_CONSTANTS.SORT_OPTIONS.NAME_ASC:
        return { name: 'asc' };
      case CATEGORY_CONSTANTS.SORT_OPTIONS.NAME_DESC:
        return { name: 'desc' };
      case CATEGORY_CONSTANTS.SORT_OPTIONS.NEWEST:
        return { createdAt: 'desc' };
      case CATEGORY_CONSTANTS.SORT_OPTIONS.OLDEST:
        return { createdAt: 'asc' };
      case CATEGORY_CONSTANTS.SORT_OPTIONS.ORDER:
      default:
        return { order: 'asc' };
    }
  }

  private async validateCategoryDepth(parentId: string): Promise<void> {
    const path = await this.categoryRepository.getCategoryPath(parentId);

    if (path.length >= CATEGORY_CONSTANTS.HIERARCHY.MAX_DEPTH) {
      throw new ApiError(
        CATEGORY_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
        CATEGORY_CONSTANTS.ERRORS.MAX_DEPTH_EXCEEDED,
        CATEGORY_ERROR_CODES.CAT015
      );
    }
  }

  private async validateCircularReference(categoryId: string, parentId: string): Promise<void> {
    let currentId: string | null = parentId;

    while (currentId) {
      if (currentId === categoryId) {
        throw new ApiError(
          CATEGORY_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
          CATEGORY_CONSTANTS.ERRORS.CIRCULAR_REFERENCE,
          CATEGORY_ERROR_CODES.CAT014
        );
      }

      const category = await this.categoryRepository.findById(currentId);
      currentId = category?.parentId || null;
    }
  }
}