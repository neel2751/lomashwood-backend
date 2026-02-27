import {
  ProductResponseDTO,
  ProductWithRelations,
  PaginatedProductsResponseDTO,
  PaginationMetaDTO,
  ProductColourDTO,
  ProductSaleDTO,
  ProductUnitDTO,
  ProductImageDTO,
  ProductExportDTO,
  ProductsByCategory,
  ProductCategory,
} from './product.types';

export class ProductMapper {
  // ── Single product → Response DTO ──────────────────────────────────────────

  static toResponseDTO(product: ProductWithRelations): ProductResponseDTO {
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price ? Number(product.price) : null,
      category: product.category as ProductCategory,
      rangeName: product.rangeName,
      status: product.status,
      style: product.style,
      finish: product.finish,
      slug: product.slug,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      featured: product.featured,
      viewCount: product.viewCount,
      sortOrder: product.sortOrder,
      images: this.mapImages(product.images),
      colours: this.mapColours(product.colours),
      units: this.mapUnits(product.units),
      sales: this.mapSales(product.sales),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  static toResponseDTOList(products: ProductWithRelations[]): ProductResponseDTO[] {
    return products.map((p) => this.toResponseDTO(p));
  }

  // ── Paginated response ─────────────────────────────────────────────────────

  static toPaginatedResponse(
    products: ProductWithRelations[],
    total: number,
    page: number,
    limit: number
  ): PaginatedProductsResponseDTO {
    const totalPages = Math.ceil(total / limit);

    const meta: PaginationMetaDTO = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return {
      data: this.toResponseDTOList(products),
      meta,
    };
  }

  // ── Relation mappers ───────────────────────────────────────────────────────

  static mapImages(images: ProductWithRelations['images']): ProductImageDTO[] {
    return images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      order: img.order,
    }));
  }

  // colours come through junction table: [{ colour: { id, name, hexCode } }]
  static mapColours(
    colours: ProductWithRelations['colours']
  ): ProductColourDTO[] {
    return colours.map(({ colour }) => ({
      id: colour.id,
      name: colour.name,
      hexCode: colour.hexCode,
    }));
  }

  // units = ProductUnit[] (stored as "units" in schema)
  static mapUnits(units: ProductWithRelations['units']): ProductUnitDTO[] {
    return units.map((unit) => ({
      id: unit.id,
      image: unit.image,
      title: unit.title,
      description: unit.description,
      order: unit.order,
    }));
  }

  // sales come through junction table: [{ sale: { id, title, description, image } }]
  static mapSales(
    sales: ProductWithRelations['sales']
  ): ProductSaleDTO[] {
    return sales.map(({ sale }) => ({
      id: sale.id,
      title: sale.title,
      description: sale.description,
      image: sale.image,
    }));
  }

  // ── Specialised view DTOs ──────────────────────────────────────────────────

  static toCardDTO(product: ProductWithRelations) {
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      rangeName: product.rangeName,
      slug: product.slug,
      primaryImage: product.images[0] ?? null,
      category: product.category,
      price: product.price ? Number(product.price) : null,
      colourCount: product.colours.length,
      status: product.status,
      featured: product.featured,
    };
  }

  static toCardDTOList(products: ProductWithRelations[]) {
    return products.map((p) => this.toCardDTO(p));
  }

  static toSimplifiedDTO(product: ProductWithRelations) {
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price ? Number(product.price) : null,
      category: product.category,
      rangeName: product.rangeName,
      slug: product.slug,
      images: this.mapImages(product.images),
      colours: this.mapColours(product.colours),
    };
  }

  static toSimplifiedDTOList(products: ProductWithRelations[]) {
    return products.map((p) => this.toSimplifiedDTO(p));
  }

  static toMetadataDTO(product: ProductWithRelations) {
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      category: product.category,
      rangeName: product.rangeName,
      status: product.status,
      featured: product.featured,
      slug: product.slug,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  static toSEODTO(product: ProductWithRelations) {
    return {
      title: product.metaTitle ?? product.title,
      description: product.metaDescription ?? product.description,
      keywords: [
        product.category.toLowerCase(),
        product.rangeName?.toLowerCase(),
        ...this.mapColours(product.colours).map((c) => c.name.toLowerCase()),
      ]
        .filter(Boolean)
        .join(', '),
      image: product.images[0]?.url ?? null,
      url: `/products/${product.slug}`,
    };
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  static toExportDTO(product: ProductWithRelations): ProductExportDTO {
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price ? Number(product.price) : null,
      category: product.category,
      rangeName: product.rangeName,
      status: product.status,
      style: product.style,
      finish: product.finish,
      slug: product.slug,
      featured: product.featured,
      imageCount: product.images.length,
      colourCount: product.colours.length,
      unitCount: product.units.length,
      saleCount: product.sales.length,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  static toExportDTOList(products: ProductWithRelations[]): ProductExportDTO[] {
    return products.map((p) => this.toExportDTO(p));
  }

  // ── Grouping helpers ───────────────────────────────────────────────────────

  static toProductsByCategory(products: ProductWithRelations[]): ProductsByCategory {
    return {
      kitchen: products
        .filter((p) => p.category === ProductCategory.KITCHEN)
        .map((p) => this.toResponseDTO(p)),
      bedroom: products
        .filter((p) => p.category === ProductCategory.BEDROOM)
        .map((p) => this.toResponseDTO(p)),
    };
  }

  static groupByCategory(
    products: ProductWithRelations[]
  ): Record<string, ProductResponseDTO[]> {
    const grouped: Record<string, ProductResponseDTO[]> = { KITCHEN: [], BEDROOM: [] };
    products.forEach((p) => {
      const dto = this.toResponseDTO(p);
      grouped[p.category]?.push(dto);
    });
    return grouped;
  }

  static groupByRange(
    products: ProductWithRelations[]
  ): Record<string, ProductResponseDTO[]> {
    const grouped: Record<string, ProductResponseDTO[]> = {};
    products.forEach((p) => {
      const key = p.rangeName ?? 'uncategorised';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(this.toResponseDTO(p));
    });
    return grouped;
  }

  // ── Unique value extractors ────────────────────────────────────────────────

  static extractUniqueRanges(products: ProductWithRelations[]): string[] {
    return Array.from(
      new Set(products.map((p) => p.rangeName).filter((r): r is string => r !== null))
    ).sort();
  }

  static extractUniqueColours(products: ProductWithRelations[]): ProductColourDTO[] {
    const colourMap = new Map<string, ProductColourDTO>();
    products.forEach((p) =>
      this.mapColours(p.colours).forEach((c) => {
        if (!colourMap.has(c.id)) colourMap.set(c.id, c);
      })
    );
    return Array.from(colourMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  // ── Cache helpers ──────────────────────────────────────────────────────────

  static sanitizeForCache(product: ProductWithRelations): Record<string, unknown> {
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price ? Number(product.price) : null,
      category: product.category,
      rangeName: product.rangeName,
      status: product.status,
      style: product.style,
      finish: product.finish,
      slug: product.slug,
      featured: product.featured,
      images: this.mapImages(product.images),
      colours: this.mapColours(product.colours),
      units: this.mapUnits(product.units),
      sales: this.mapSales(product.sales),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  static fromCache(cached: Record<string, unknown>): ProductResponseDTO {
    return {
      id: cached.id as string,
      title: cached.title as string,
      description: cached.description as string,
      price: cached.price as number | null,
      category: cached.category as ProductCategory,
      rangeName: cached.rangeName as string | null,
      status: cached.status as ProductResponseDTO['status'],
      style: cached.style as ProductResponseDTO['style'],
      finish: cached.finish as ProductResponseDTO['finish'],
      slug: cached.slug as string,
      metaTitle: (cached.metaTitle as string | null) ?? null,
      metaDescription: (cached.metaDescription as string | null) ?? null,
      featured: cached.featured as boolean,
      viewCount: cached.viewCount as number,
      sortOrder: cached.sortOrder as number,
      images: cached.images as ProductImageDTO[],
      colours: cached.colours as ProductColourDTO[],
      units: cached.units as ProductUnitDTO[],
      sales: cached.sales as ProductSaleDTO[],
      createdAt: new Date(cached.createdAt as string),
      updatedAt: new Date(cached.updatedAt as string),
    };
  }
}