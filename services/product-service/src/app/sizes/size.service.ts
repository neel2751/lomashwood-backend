import { SizeRepository } from './size.repository';
import { 
  Size, 
  CreateSizeDTO, 
  UpdateSizeDTO, 
  SizeFilters, 
  SizeListResponse, 
  SizeWithProducts,
  SizeCategory 
} from './size.types';
import { SizeMapper } from './size.mapper';
import { SIZE_CONSTANTS } from './size.constants';
import { AppError } from '../../shared/errors';

export class SizeService {
  constructor(private readonly sizeRepository: SizeRepository) {}

  async findAll(filters: SizeFilters): Promise<SizeListResponse> {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const [sizes, total] = await Promise.all([
      this.sizeRepository.findMany(filters, skip, limit),
      this.sizeRepository.count(filters)
    ]);

    return SizeMapper.toListResponse(sizes, total, page, limit);
  }

  async findById(id: string): Promise<Size | null> {
    return await this.sizeRepository.findById(id);
  }

  async findByIdWithProducts(id: string): Promise<SizeWithProducts | null> {
    const size = await this.sizeRepository.findById(id);
    
    if (!size) {
      return null;
    }

    const products = await this.sizeRepository.findProductsBySize(id);
    const productCount = products.length;

    return SizeMapper.toWithProducts(size, productCount, products);
  }

  async create(data: CreateSizeDTO): Promise<Size> {
    await this.validateUniqueName(data.name);

    const sizeData = {
      ...data,
      category: data.category || SIZE_CONSTANTS.DEFAULT_VALUES.CATEGORY,
      isActive: data.isActive ?? SIZE_CONSTANTS.DEFAULT_VALUES.IS_ACTIVE,
      sortOrder: data.sortOrder ?? SIZE_CONSTANTS.DEFAULT_VALUES.SORT_ORDER
    };

    return await this.sizeRepository.create(sizeData);
  }

  async update(id: string, data: UpdateSizeDTO): Promise<Size | null> {
    const existingSize = await this.sizeRepository.findById(id);

    if (!existingSize) {
      return null;
    }

    if (data.name && data.name !== existingSize.name) {
      await this.validateUniqueName(data.name, id);
    }

    return await this.sizeRepository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    const size = await this.sizeRepository.findById(id);

    if (!size) {
      return false;
    }

    const productCount = await this.sizeRepository.countProductsBySize(id);

    if (productCount > 0) {
      throw new AppError(
        SIZE_CONSTANTS.ERROR_MESSAGES.SIZE_IN_USE,
        400,
        SIZE_CONSTANTS.ERROR_CODES.SIZE_IN_USE
      );
    }

    return await this.sizeRepository.delete(id);
  }

  async search(filters: SizeFilters): Promise<SizeListResponse> {
    return await this.findAll(filters);
  }

  async updateStatus(id: string, isActive: boolean): Promise<Size | null> {
    const size = await this.sizeRepository.findById(id);

    if (!size) {
      return null;
    }

    return await this.sizeRepository.update(id, { isActive });
  }

  async bulkCreate(sizes: CreateSizeDTO[]): Promise<{
    created: Size[];
    failed: Array<{ size: CreateSizeDTO; error: string }>;
  }> {
    const created: Size[] = [];
    const failed: Array<{ size: CreateSizeDTO; error: string }> = [];

    for (const sizeData of sizes) {
      try {
        const size = await this.create(sizeData);
        created.push(size);
      } catch (error) {
        failed.push({
          size: sizeData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { created, failed };
  }

  async bulkDelete(ids: string[]): Promise<{
    deleted: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const deleted: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        const success = await this.delete(id);
        if (success) {
          deleted.push(id);
        } else {
          failed.push({
            id,
            error: SIZE_CONSTANTS.ERROR_MESSAGES.SIZE_NOT_FOUND
          });
        }
      } catch (error) {
        failed.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { deleted, failed };
  }

  async findByCategory(
    category: SizeCategory,
    isActive?: boolean,
    page: number = 1,
    limit: number = 20
  ): Promise<SizeListResponse> {
    const filters: SizeFilters = {
      category,
      isActive,
      page,
      limit,
      sortBy: 'sortOrder',
      sortOrder: 'asc'
    };

    return await this.findAll(filters);
  }

  async findByDimensions(
    width?: number,
    height?: number,
    depth?: number,
    tolerance: number = 0
  ): Promise<Size[]> {
    return await this.sizeRepository.findByDimensions(width, height, depth, tolerance);
  }

  async validateUniqueName(name: string, excludeId?: string): Promise<void> {
    const existingSize = await this.sizeRepository.findByName(name);

    if (existingSize && existingSize.id !== excludeId) {
      throw new AppError(
        SIZE_CONSTANTS.ERROR_MESSAGES.DUPLICATE_SIZE_NAME,
        400,
        SIZE_CONSTANTS.ERROR_CODES.DUPLICATE_SIZE_NAME
      );
    }
  }

  async getSizeAnalytics(): Promise<{
    totalSizes: number;
    activeSizes: number;
    inactiveSizes: number;
    sizesByCategory: Record<SizeCategory, number>;
  }> {
    const [total, active, inactive] = await Promise.all([
      this.sizeRepository.count({}),
      this.sizeRepository.count({ isActive: true }),
      this.sizeRepository.count({ isActive: false })
    ]);

    const sizesByCategory = await this.getSizeCountByCategory();

    return {
      totalSizes: total,
      activeSizes: active,
      inactiveSizes: inactive,
      sizesByCategory
    };
  }

  async getSizeCountByCategory(): Promise<Record<SizeCategory, number>> {
    const categories: SizeCategory[] = ['KITCHEN', 'BEDROOM', 'BOTH'];
    const counts = await Promise.all(
      categories.map(category => 
        this.sizeRepository.count({ category })
      )
    );

    return categories.reduce((acc, category, index) => {
      acc[category] = counts[index];
      return acc;
    }, {} as Record<SizeCategory, number>);
  }

  async getMostUsedSizes(limit: number = 10): Promise<Array<{
    size: Size;
    usageCount: number;
  }>> {
    const sizes = await this.sizeRepository.findMostUsed(limit);
    
    return Promise.all(
      sizes.map(async (size) => ({
        size,
        usageCount: await this.sizeRepository.countProductsBySize(size.id)
      }))
    );
  }

  async getRecentlyAdded(limit: number = 10): Promise<Size[]> {
    return await this.sizeRepository.findRecent(limit);
  }

  async validateDimensions(width?: number, height?: number, depth?: number): boolean {
    if (width !== undefined && (width <= 0 || !isFinite(width))) {
      throw new AppError(
        'Invalid width dimension',
        400,
        SIZE_CONSTANTS.ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (height !== undefined && (height <= 0 || !isFinite(height))) {
      throw new AppError(
        'Invalid height dimension',
        400,
        SIZE_CONSTANTS.ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (depth !== undefined && (depth <= 0 || !isFinite(depth))) {
      throw new AppError(
        'Invalid depth dimension',
        400,
        SIZE_CONSTANTS.ERROR_CODES.VALIDATION_ERROR
      );
    }

    return true;
  }

  async calculateVolume(id: string): Promise<number | null> {
    const size = await this.sizeRepository.findById(id);

    if (!size || !size.width || !size.height || !size.depth) {
      return null;
    }

    return size.width * size.height * size.depth;
  }

  async findSimilarSizes(id: string, tolerance: number = 10): Promise<Size[]> {
    const size = await this.sizeRepository.findById(id);

    if (!size) {
      return [];
    }

    return await this.sizeRepository.findByDimensions(
      size.width || undefined,
      size.height || undefined,
      size.depth || undefined,
      tolerance
    );
  }

  async updateSortOrders(updates: Array<{ id: string; sortOrder: number }>): Promise<void> {
    await Promise.all(
      updates.map(({ id, sortOrder }) =>
        this.sizeRepository.update(id, { sortOrder })
      )
    );
  }

  async cloneSize(id: string, newName: string): Promise<Size> {
    const originalSize = await this.sizeRepository.findById(id);

    if (!originalSize) {
      throw new AppError(
        SIZE_CONSTANTS.ERROR_MESSAGES.SIZE_NOT_FOUND,
        404,
        SIZE_CONSTANTS.ERROR_CODES.SIZE_NOT_FOUND
      );
    }

    await this.validateUniqueName(newName);

    const cloneData: CreateSizeDTO = {
      name: newName,
      title: originalSize.title,
      description: originalSize.description,
      image: originalSize.image,
      width: originalSize.width,
      height: originalSize.height,
      depth: originalSize.depth,
      unit: originalSize.unit,
      category: originalSize.category,
      isActive: originalSize.isActive,
      sortOrder: originalSize.sortOrder,
      metadata: originalSize.metadata
    };

    return await this.create(cloneData);
  }
}