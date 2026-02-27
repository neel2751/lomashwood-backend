import { PrismaClient, Prisma, ProductStatus, ProductCategory, StyleType, FinishType } from '@prisma/client';
import { prisma } from '../../infrastructure/db/prisma.client';

// ─── Filter & Pagination interfaces ──────────────────────────────────────────

export interface ProductFilters {
  category?: ProductCategory;
  colourIds?: string[];
  style?: StyleType;
  finish?: FinishType;
  range?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  status?: ProductStatus;
  featured?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Default include (matches actual schema relations) ────────────────────────

const productInclude = {
  images: {
    orderBy: { order: 'asc' as const },
    select: { id: true, url: true, altText: true, order: true },
  },
  colours: {
    select: {
      colour: {
        select: { id: true, name: true, hexCode: true },
      },
    },
  },
  units: {
    orderBy: { order: 'asc' as const },
    select: { id: true, image: true, title: true, description: true, order: true },
  },
  sales: {
    select: {
      sale: {
        select: { id: true, title: true, description: true, image: true },
      },
    },
  },
  inventory: true,
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

// ─── Repository ───────────────────────────────────────────────────────────────

export class ProductRepository {
  private db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  // ── Create ──────────────────────────────────────────────────────────────────

  async create(
    data: Omit<Prisma.ProductCreateInput, 'colours' | 'units' | 'sales' | 'images'> & {
      colourIds?: string[];
      units?: Array<{ image?: string; title: string; description?: string; order?: number }>;
      saleIds?: string[];
      images?: Array<{ url: string; altText?: string; order?: number }>;
    }
  ): Promise<ProductWithRelations> {
    const { colourIds, units, saleIds, images, ...productData } = data;

    return await this.db.product.create({
      data: {
        ...productData,
        images: images
          ? { create: images.map((img, i) => ({ ...img, order: img.order ?? i })) }
          : undefined,
        colours: colourIds
          ? { create: colourIds.map((colourId) => ({ colourId })) }
          : undefined,
        units: units
          ? { create: units.map((u, i) => ({ ...u, order: u.order ?? i })) }
          : undefined,
        sales: saleIds
          ? { create: saleIds.map((saleId) => ({ saleId })) }
          : undefined,
      },
      include: productInclude,
    });
  }

  // ── Read ────────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<ProductWithRelations | null> {
    return await this.db.product.findUnique({
      where: { id, deletedAt: null },
      include: productInclude,
    });
  }

  async findBySlug(slug: string): Promise<ProductWithRelations | null> {
    return await this.db.product.findUnique({
      where: { slug, deletedAt: null },
      include: productInclude,
    });
  }

  async findAll(
    filters: ProductFilters,
    pagination: PaginationOptions
  ): Promise<{ products: ProductWithRelations[]; total: number }> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(filters);

    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    const [products, total] = await Promise.all([
      this.db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: productInclude,
      }),
      this.db.product.count({ where }),
    ]);

    return { products, total };
  }

  async findFeatured(
    limit: number = 8,
    category?: ProductCategory
  ): Promise<ProductWithRelations[]> {
    return await this.db.product.findMany({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        featured: true,
        ...(category ? { category } : {}),
      },
      take: limit,
      orderBy: { sortOrder: 'asc' },
      include: productInclude,
    });
  }

  async findRelated(
    productId: string,
    limit: number = 4
  ): Promise<ProductWithRelations[]> {
    const product = await this.db.product.findUnique({
      where: { id: productId },
      select: { category: true, style: true, rangeName: true },
    });

    if (!product) return [];

    return await this.db.product.findMany({
      where: {
        id: { not: productId },
        deletedAt: null,
        status: 'PUBLISHED',
        OR: [
          { category: product.category },
          ...(product.style ? [{ style: product.style }] : []),
          ...(product.rangeName ? [{ rangeName: product.rangeName }] : []),
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: productInclude,
    });
  }

  async findPopular(
    limit: number = 10,
    category?: ProductCategory
  ): Promise<ProductWithRelations[]> {
    return await this.db.product.findMany({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        ...(category ? { category } : {}),
      },
      take: limit,
      orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
      include: productInclude,
    });
  }

  async findByIds(ids: string[]): Promise<ProductWithRelations[]> {
    return await this.db.product.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: productInclude,
    });
  }

  async search(
    query: string,
    category?: ProductCategory,
    limit: number = 20
  ): Promise<ProductWithRelations[]> {
    return await this.db.product.findMany({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        ...(category ? { category } : {}),
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { rangeName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { viewCount: 'desc' },
      include: productInclude,
    });
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  async update(
    id: string,
    data: Omit<Prisma.ProductUpdateInput, 'colours' | 'units' | 'sales' | 'images'> & {
      colourIds?: string[];
      units?: Array<{ image?: string; title: string; description?: string; order?: number }>;
      saleIds?: string[];
      images?: Array<{ url: string; altText?: string; order?: number }>;
    }
  ): Promise<ProductWithRelations> {
    const { colourIds, units, saleIds, images, ...productData } = data;

    return await this.db.product.update({
      where: { id },
      data: {
        ...productData,
        updatedAt: new Date(),
        // Replace images if provided
        ...(images !== undefined
          ? {
              images: {
                deleteMany: {},
                create: images.map((img, i) => ({ ...img, order: img.order ?? i })),
              },
            }
          : {}),
        // Sync colours if provided
        ...(colourIds !== undefined
          ? {
              colours: {
                deleteMany: {},
                create: colourIds.map((colourId) => ({ colourId })),
              },
            }
          : {}),
        // Replace units if provided
        ...(units !== undefined
          ? {
              units: {
                deleteMany: {},
                create: units.map((u, i) => ({ ...u, order: u.order ?? i })),
              },
            }
          : {}),
        // Sync sales if provided
        ...(saleIds !== undefined
          ? {
              sales: {
                deleteMany: {},
                create: saleIds.map((saleId) => ({ saleId })),
              },
            }
          : {}),
      },
      include: productInclude,
    });
  }

  async updateStatus(id: string, status: ProductStatus): Promise<ProductWithRelations> {
    return await this.db.product.update({
      where: { id },
      data: { status, updatedAt: new Date() },
      include: productInclude,
    });
  }

  async toggleFeatured(id: string, featured: boolean): Promise<ProductWithRelations> {
    return await this.db.product.update({
      where: { id },
      data: { featured, updatedAt: new Date() },
      include: productInclude,
    });
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.db.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async softDelete(id: string): Promise<void> {
    await this.db.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
        updatedAt: new Date(),
      },
    });
  }

  async hardDelete(id: string): Promise<void> {
    await this.db.product.delete({ where: { id } });
  }

  async bulkSoftDelete(ids: string[]): Promise<Prisma.BatchPayload> {
    return await this.db.product.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date(), status: 'ARCHIVED', updatedAt: new Date() },
    });
  }

  // ── Existence checks ────────────────────────────────────────────────────────

  async exists(id: string): Promise<boolean> {
    const count = await this.db.product.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const count = await this.db.product.count({
      where: {
        slug,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  // ── Distinct filter values ──────────────────────────────────────────────────

  async getDistinctRanges(): Promise<string[]> {
    const products = await this.db.product.findMany({
      where: { deletedAt: null, status: 'PUBLISHED', rangeName: { not: null } },
      select: { rangeName: true },
      distinct: ['rangeName'],
      orderBy: { rangeName: 'asc' },
    });
    return products.map((p) => p.rangeName).filter((r): r is string => r !== null);
  }

  async getDistinctStyles(): Promise<StyleType[]> {
    const products = await this.db.product.findMany({
      where: { deletedAt: null, status: 'PUBLISHED', style: { not: null } },
      select: { style: true },
      distinct: ['style'],
    });
    return products.map((p) => p.style).filter((s): s is StyleType => s !== null);
  }

  async getDistinctFinishes(): Promise<FinishType[]> {
    const products = await this.db.product.findMany({
      where: { deletedAt: null, status: 'PUBLISHED', finish: { not: null } },
      select: { finish: true },
      distinct: ['finish'],
    });
    return products.map((p) => p.finish).filter((f): f is FinishType => f !== null);
  }

  // ── Colour relations ────────────────────────────────────────────────────────

  async syncColours(productId: string, colourIds: string[]): Promise<void> {
    await this.db.$transaction([
      this.db.productColour.deleteMany({ where: { productId } }),
      this.db.productColour.createMany({
        data: colourIds.map((colourId) => ({ productId, colourId })),
      }),
    ]);
  }

  // ── Statistics ──────────────────────────────────────────────────────────────

  async getStatistics() {
    const [total, published, draft, archived, featured, kitchen, bedroom, inSales] =
      await Promise.all([
        this.db.product.count({ where: { deletedAt: null } }),
        this.db.product.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
        this.db.product.count({ where: { deletedAt: null, status: 'DRAFT' } }),
        this.db.product.count({ where: { deletedAt: null, status: 'ARCHIVED' } }),
        this.db.product.count({ where: { deletedAt: null, featured: true } }),
        this.db.product.count({ where: { deletedAt: null, category: 'KITCHEN' } }),
        this.db.product.count({ where: { deletedAt: null, category: 'BEDROOM' } }),
        this.db.saleProduct.groupBy({ by: ['productId'], _count: true }).then((r) => r.length),
      ]);

    const priceAgg = await this.db.product.aggregate({
      where: { deletedAt: null, price: { not: null } },
      _avg: { price: true },
    });

    return {
      totalProducts: total,
      publishedProducts: published,
      draftProducts: draft,
      archivedProducts: archived,
      featuredProducts: featured,
      kitchenProducts: kitchen,
      bedroomProducts: bedroom,
      averagePrice: priceAgg._avg.price ? Number(priceAgg._avg.price) : null,
      productsInSales: inSales,
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private buildWhereClause(filters: ProductFilters): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = { deletedAt: null };

    if (filters.status) where.status = filters.status;
    else where.status = 'PUBLISHED'; // default to published

    if (filters.category) where.category = filters.category;
    if (filters.style) where.style = filters.style;
    if (filters.finish) where.finish = filters.finish;
    if (filters.range) where.rangeName = filters.range;
    if (filters.featured !== undefined) where.featured = filters.featured;

    if (filters.colourIds && filters.colourIds.length > 0) {
      where.colours = {
        some: { colourId: { in: filters.colourIds } },
      };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {
        ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
        ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
      };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { rangeName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildOrderBy(
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] {
    switch (sortBy) {
      case 'price_asc':
        return { price: 'asc' };
      case 'price_desc':
        return { price: 'desc' };
      case 'popularity':
        return [{ viewCount: 'desc' }, { createdAt: 'desc' }];
      case 'newest':
        return { createdAt: 'desc' };
      case 'title_asc':
        return { title: 'asc' };
      case 'title_desc':
        return { title: 'desc' };
      default:
        return { [sortBy]: sortOrder };
    }
  }
}

export const productRepository = new ProductRepository();