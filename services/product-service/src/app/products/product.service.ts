import { ProductRepository } from './product.repository';
import { ProductMapper } from './product.mapper';
import {
  CreateProductDTO,
  UpdateProductDTO,
  ProductQueryDTO,
  ProductCategory,
  ProductStatus,
  PaginatedProductsResponseDTO,
  ProductResponseDTO,
  ProductStatistics,
} from './product.types';
import { AppError } from '../../shared/errors';
import { EventProducer } from '../../infrastructure/messaging/event-producer';
import { PRODUCT_EVENTS } from './product.constants';

export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly eventProducer: EventProducer
  ) {}

  // ── Create ──────────────────────────────────────────────────────────────────

  async create(data: CreateProductDTO): Promise<ProductResponseDTO> {
    // Slug uniqueness check
    const slugExists = await this.productRepository.existsBySlug(data.slug);
    if (slugExists) {
      throw new AppError('A product with this slug already exists', 409);
    }

    const product = await this.productRepository.create({
      title: data.title,
      description: data.description,
      price: data.price,
      category: data.category,
      rangeName: data.rangeName,
      status: data.status ?? 'DRAFT',
      style: data.style,
      finish: data.finish,
      slug: data.slug,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      featured: data.featured ?? false,
      sortOrder: data.sortOrder ?? 0,
      images: data.images,
      colourIds: data.colourIds,
      units: data.units,
      saleIds: data.saleIds,
    });

    await this.eventProducer.publish(PRODUCT_EVENTS.PRODUCT_CREATED, {
      productId: product.id,
      category: product.category,
      title: product.title,
      createdAt: product.createdAt,
    });

    return ProductMapper.toResponseDTO(product);
  }

  // ── Read: list ──────────────────────────────────────────────────────────────

  async findAll(query: ProductQueryDTO): Promise<PaginatedProductsResponseDTO> {
    const { page = 1, limit = 20, sortBy, ...filters } = query;

    // Map sortBy string → { sortBy, sortOrder } for repository
    const { repoSortBy, sortOrder } = this.parseSortBy(sortBy);

    const { products, total } = await this.productRepository.findAll(
      {
        category: filters.category,
        colourIds: filters.colours,
        style: filters.style,
        finish: filters.finish,
        range: filters.range,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        search: filters.search,
        featured: filters.featured,
        status: filters.status,
      },
      { page, limit, sortBy: repoSortBy, sortOrder }
    );

    return ProductMapper.toPaginatedResponse(products, total, page, limit);
  }

  // ── Read: single ────────────────────────────────────────────────────────────

  async findById(id: string): Promise<ProductResponseDTO> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Fire-and-forget view count increment
    this.productRepository.incrementViewCount(id).catch(() => {});

    return ProductMapper.toResponseDTO(product);
  }

  async findBySlug(slug: string): Promise<ProductResponseDTO> {
    const product = await this.productRepository.findBySlug(slug);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    this.productRepository.incrementViewCount(product.id).catch(() => {});

    return ProductMapper.toResponseDTO(product);
  }

  // ── Read: featured ──────────────────────────────────────────────────────────

  async getFeatured(limit: number = 8, category?: ProductCategory): Promise<ProductResponseDTO[]> {
    const products = await this.productRepository.findFeatured(limit, category);
    return ProductMapper.toResponseDTOList(products);
  }

  // ── Read: related ───────────────────────────────────────────────────────────

  async getRelated(productId: string, limit: number = 4): Promise<ProductResponseDTO[]> {
    const exists = await this.productRepository.exists(productId);
    if (!exists) {
      throw new AppError('Product not found', 404);
    }

    const products = await this.productRepository.findRelated(productId, limit);
    return ProductMapper.toResponseDTOList(products);
  }

  // ── Read: popular ───────────────────────────────────────────────────────────

  async getPopular(limit: number = 10, category?: ProductCategory): Promise<ProductResponseDTO[]> {
    const products = await this.productRepository.findPopular(limit, category);
    return ProductMapper.toResponseDTOList(products);
  }

  // ── Read: search ────────────────────────────────────────────────────────────

  async search(
    query: string,
    category?: ProductCategory,
    limit: number = 20
  ): Promise<ProductResponseDTO[]> {
    if (!query?.trim()) {
      throw new AppError('Search query is required', 400);
    }

    const products = await this.productRepository.search(query.trim(), category, limit);
    return ProductMapper.toResponseDTOList(products);
  }

  // ── Read: filter options ────────────────────────────────────────────────────

  async getFilterOptions(category?: ProductCategory) {
    const [ranges, styles, finishes] = await Promise.all([
      this.productRepository.getDistinctRanges(),
      this.productRepository.getDistinctStyles(),
      this.productRepository.getDistinctFinishes(),
    ]);

    return { ranges, styles, finishes };
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  async update(id: string, data: UpdateProductDTO): Promise<ProductResponseDTO> {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    // Slug uniqueness check (only if slug is changing)
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await this.productRepository.existsBySlug(data.slug, id);
      if (slugExists) {
        throw new AppError('A product with this slug already exists', 409);
      }
    }

    const product = await this.productRepository.update(id, {
      title: data.title,
      description: data.description,
      price: data.price,
      category: data.category,
      rangeName: data.rangeName,
      status: data.status,
      style: data.style,
      finish: data.finish,
      slug: data.slug,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      featured: data.featured,
      sortOrder: data.sortOrder,
      images: data.images,
      colourIds: data.colourIds,
      units: data.units,
      saleIds: data.saleIds,
    });

    await this.eventProducer.publish(PRODUCT_EVENTS.PRODUCT_UPDATED, {
      productId: product.id,
      category: product.category,
      title: product.title,
      updatedAt: product.updatedAt,
    });

    return ProductMapper.toResponseDTO(product);
  }

  // ── Update: status ──────────────────────────────────────────────────────────

  async updateStatus(id: string, status: ProductStatus): Promise<ProductResponseDTO> {
    const exists = await this.productRepository.exists(id);
    if (!exists) {
      throw new AppError('Product not found', 404);
    }

    const product = await this.productRepository.updateStatus(id, status);
    return ProductMapper.toResponseDTO(product);
  }

  // ── Update: featured toggle ─────────────────────────────────────────────────

  async toggleFeatured(id: string, featured: boolean): Promise<ProductResponseDTO> {
    const exists = await this.productRepository.exists(id);
    if (!exists) {
      throw new AppError('Product not found', 404);
    }

    const product = await this.productRepository.toggleFeatured(id, featured);
    return ProductMapper.toResponseDTO(product);
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async delete(id: string): Promise<{ success: boolean }> {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    await this.productRepository.softDelete(id);

    await this.eventProducer.publish(PRODUCT_EVENTS.PRODUCT_DELETED, {
      productId: id,
      category: existing.category,
      title: existing.title,
      deletedAt: new Date(),
    });

    return { success: true };
  }

  // ── Bulk delete ─────────────────────────────────────────────────────────────

  async bulkDelete(ids: string[]): Promise<{ success: boolean; count: number }> {
    const result = await this.productRepository.bulkSoftDelete(ids);
    return { success: true, count: result.count };
  }

  // ── Statistics ──────────────────────────────────────────────────────────────

  async getStatistics(): Promise<ProductStatistics> {
    return await this.productRepository.getStatistics();
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private parseSortBy(sortBy?: string): {
    repoSortBy: string;
    sortOrder: 'asc' | 'desc';
  } {
    switch (sortBy) {
      case 'price_asc':
        return { repoSortBy: 'price_asc', sortOrder: 'asc' };
      case 'price_desc':
        return { repoSortBy: 'price_desc', sortOrder: 'desc' };
      case 'popularity':
        return { repoSortBy: 'popularity', sortOrder: 'desc' };
      case 'title_asc':
        return { repoSortBy: 'title_asc', sortOrder: 'asc' };
      case 'title_desc':
        return { repoSortBy: 'title_desc', sortOrder: 'desc' };
      case 'newest':
      default:
        return { repoSortBy: 'newest', sortOrder: 'desc' };
    }
  }
}