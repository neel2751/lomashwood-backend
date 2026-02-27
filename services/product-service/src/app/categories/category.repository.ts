import { PrismaClient, Prisma, Category } from '@prisma/client';
import {
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryWithRelations,
  CategoryRepositoryOptions,
} from './category.types';
import { Logger } from '../../shared/utils';

export class CategoryRepository {
  private readonly logger: Logger;

  constructor(private readonly prisma: PrismaClient) {
    this.logger = new Logger('CategoryRepository');
  }

  async create(data: CreateCategoryDTO): Promise<CategoryWithRelations> {
    this.logger.info('Creating category in database', { name: data.name });

    return await this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        type: data.type,
        image: data.image,
        icon: data.icon,
        parentId: data.parentId,
        order: data.order || 0,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findById(
    id: string,
    options?: CategoryRepositoryOptions
  ): Promise<CategoryWithRelations | null> {
    this.logger.info('Finding category by ID', { id });

    return await this.prisma.category.findUnique({
      where: { id },
      include: options?.include || {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findBySlug(
    slug: string,
    options?: CategoryRepositoryOptions
  ): Promise<CategoryWithRelations | null> {
    this.logger.info('Finding category by slug', { slug });

    return await this.prisma.category.findUnique({
      where: { slug },
      include: options?.include || {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findMany(options?: CategoryRepositoryOptions): Promise<CategoryWithRelations[]> {
    this.logger.info('Finding multiple categories', { options });

    return await this.prisma.category.findMany({
      where: options?.where,
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { order: 'asc' },
      include: options?.include || {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findAll(): Promise<CategoryWithRelations[]> {
    this.logger.info('Finding all categories');

    return await this.prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateCategoryDTO): Promise<CategoryWithRelations> {
    this.logger.info('Updating category', { id });

    return await this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        type: data.type,
        image: data.image,
        icon: data.icon,
        parentId: data.parentId,
        order: data.order,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    this.logger.info('Deleting category', { id });

    await this.prisma.category.delete({
      where: { id },
    });
  }

  async count(options?: { where?: Prisma.CategoryWhereInput }): Promise<number> {
    this.logger.info('Counting categories', { options });

    return await this.prisma.category.count({
      where: options?.where,
    });
  }

  async exists(id: string): Promise<boolean> {
    this.logger.info('Checking if category exists', { id });

    const count = await this.prisma.category.count({
      where: { id },
    });

    return count > 0;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    this.logger.info('Checking if category exists by slug', { slug });

    const count = await this.prisma.category.count({
      where: { slug },
    });

    return count > 0;
  }

  async findByType(type: string): Promise<CategoryWithRelations[]> {
    this.logger.info('Finding categories by type', { type });

    return await this.prisma.category.findMany({
      where: { type },
      orderBy: { order: 'asc' },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findActive(): Promise<CategoryWithRelations[]> {
    this.logger.info('Finding active categories');

    return await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findFeatured(limit?: number): Promise<CategoryWithRelations[]> {
    this.logger.info('Finding featured categories', { limit });

    return await this.prisma.category.findMany({
      where: { isFeatured: true, isActive: true },
      take: limit,
      orderBy: { order: 'asc' },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findRootCategories(): Promise<CategoryWithRelations[]> {
    this.logger.info('Finding root categories');

    return await this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { order: 'asc' },
      include: {
        children: {
          orderBy: { order: 'asc' },
          include: {
            children: {
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
  }

  async findChildren(parentId: string): Promise<CategoryWithRelations[]> {
    this.logger.info('Finding child categories', { parentId });

    return await this.prisma.category.findMany({
      where: { parentId },
      orderBy: { order: 'asc' },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findProductsByCategory(
    categoryId: string,
    skip: number,
    take: number
  ): Promise<unknown[]> {
    this.logger.info('Finding products by category', { categoryId, skip, take });

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        products: {
          skip,
          take,
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          include: {
            colours: true,
          },
        },
      },
    });

    return category?.products || [];
  }

  async countProductsByCategory(categoryId: string): Promise<number> {
    this.logger.info('Counting products by category', { categoryId });

    return await this.prisma.product.count({
      where: {
        categoryId,
        isActive: true,
      },
    });
  }

  async countCategoriesWithProducts(): Promise<number> {
    this.logger.info('Counting categories with products');

    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return categories.filter((cat) => cat._count.products > 0).length;
  }

  async search(query: string, limit?: number): Promise<CategoryWithRelations[]> {
    this.logger.info('Searching categories', { query, limit });

    return await this.prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { order: 'asc' },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async bulkDelete(ids: string[]): Promise<Prisma.BatchPayload> {
    this.logger.info('Bulk deleting categories', { count: ids.length });

    return await this.prisma.category.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }

  async reorderCategories(categoryOrders: Array<{ id: string; order: number }>): Promise<void> {
    this.logger.info('Reordering categories', { count: categoryOrders.length });

    await this.prisma.$transaction(
      categoryOrders.map(({ id, order }) =>
        this.prisma.category.update({
          where: { id },
          data: { order },
        })
      )
    );
  }

  async getCategoryPath(categoryId: string): Promise<CategoryWithRelations[]> {
    this.logger.info('Getting category path', { categoryId });

    const path: CategoryWithRelations[] = [];
    let currentId: string | null = categoryId;

    while (currentId) {
      const category = await this.prisma.category.findUnique({
        where: { id: currentId },
        include: {
          parent: true,
          children: true,
          _count: {
            select: { products: true },
          },
        },
      });

      if (!category) break;

      path.unshift(category);
      currentId = category.parentId;
    }

    return path;
  }

  async findCategoriesWithNoProducts(): Promise<CategoryWithRelations[]> {
    this.logger.info('Finding categories with no products');

    const categories = await this.prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    return categories.filter((cat) => cat._count.products === 0);
  }

  async toggleActive(id: string): Promise<CategoryWithRelations> {
    this.logger.info('Toggling category active status', { id });

    const category = await this.findById(id);
    if (!category) {
      throw new Error('Category not found');
    }

    return await this.update(id, { isActive: !category.isActive });
  }

  async toggleFeatured(id: string): Promise<CategoryWithRelations> {
    this.logger.info('Toggling category featured status', { id });

    const category = await this.findById(id);
    if (!category) {
      throw new Error('Category not found');
    }

    return await this.update(id, { isFeatured: !category.isFeatured });
  }

  async getMaxOrder(): Promise<number> {
    this.logger.info('Getting max category order');

    const result = await this.prisma.category.aggregate({
      _max: {
        order: true,
      },
    });

    return result._max.order || 0;
  }

  async findWithProductCount(): Promise<CategoryWithRelations[]> {
    this.logger.info('Finding categories with product count');

    return await this.prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async softDelete(id: string): Promise<CategoryWithRelations> {
    this.logger.info('Soft deleting category', { id });

    return await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async restore(id: string): Promise<CategoryWithRelations> {
    this.logger.info('Restoring category', { id });

    return await this.prisma.category.update({
      where: { id },
      data: { isActive: true },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findByParentId(parentId: string | null): Promise<CategoryWithRelations[]> {
    this.logger.info('Finding categories by parent ID', { parentId });

    return await this.prisma.category.findMany({
      where: { parentId },
      orderBy: { order: 'asc' },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async updateOrder(id: string, order: number): Promise<CategoryWithRelations> {
    this.logger.info('Updating category order', { id, order });

    return await this.prisma.category.update({
      where: { id },
      data: { order },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findSiblings(categoryId: string): Promise<CategoryWithRelations[]> {
    this.logger.info('Finding sibling categories', { categoryId });

    const category = await this.findById(categoryId);
    if (!category) {
      return [];
    }

    return await this.prisma.category.findMany({
      where: {
        parentId: category.parentId,
        id: { not: categoryId },
      },
      orderBy: { order: 'asc' },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async getDepth(categoryId: string): Promise<number> {
    this.logger.info('Getting category depth', { categoryId });

    const path = await this.getCategoryPath(categoryId);
    return path.length - 1;
  }

  async hasChildren(categoryId: string): Promise<boolean> {
    this.logger.info('Checking if category has children', { categoryId });

    const count = await this.prisma.category.count({
      where: { parentId: categoryId },
    });

    return count > 0;
  }

  async hasProducts(categoryId: string): Promise<boolean> {
    this.logger.info('Checking if category has products', { categoryId });

    const count = await this.prisma.product.count({
      where: { categoryId },
    });

    return count > 0;
  }
}