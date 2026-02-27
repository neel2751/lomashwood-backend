import { Size, SizeResponse, SizeListResponse, SizeWithProducts, BulkCreateSizeResponse, BulkDeleteSizeResponse, CreateSizeDTO } from './size.types';

export class SizeMapper {
  static toResponse(size: Size): SizeResponse {
    return {
      id: size.id,
      name: size.name,
      title: size.title,
      description: size.description,
      image: size.image,
      width: size.width,
      height: size.height,
      depth: size.depth,
      unit: size.unit,
      category: size.category,
      isActive: size.isActive,
      sortOrder: size.sortOrder,
      metadata: size.metadata,
      createdAt: size.createdAt.toISOString(),
      updatedAt: size.updatedAt.toISOString()
    };
  }

  static toListResponse(
    sizes: Size[],
    total: number,
    page: number,
    limit: number
  ): SizeListResponse {
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: sizes.map(size => this.toResponse(size)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  static toResponseArray(sizes: Size[]): SizeResponse[] {
    return sizes.map(size => this.toResponse(size));
  }

  static toWithProducts(
    size: Size,
    productCount: number,
    products?: Array<{ id: string; title: string; category: string }>
  ): SizeWithProducts {
    return {
      ...this.toResponse(size),
      productCount,
      products
    };
  }

  static toBulkCreateResponse(
    created: Size[],
    failed: Array<{ size: CreateSizeDTO; error: string }>
  ): BulkCreateSizeResponse {
    return {
      created: this.toResponseArray(created),
      failed,
      summary: {
        total: created.length + failed.length,
        successful: created.length,
        failed: failed.length
      }
    };
  }

  static toBulkDeleteResponse(
    deleted: string[],
    failed: Array<{ id: string; error: string }>
  ): BulkDeleteSizeResponse {
    return {
      deleted,
      failed,
      summary: {
        total: deleted.length + failed.length,
        successful: deleted.length,
        failed: failed.length
      }
    };
  }

  static stripSensitiveData(size: SizeResponse): Omit<SizeResponse, 'metadata'> {
    const { metadata, ...publicData } = size;
    return publicData;
  }

  static toMinimalResponse(size: Size): Pick<SizeResponse, 'id' | 'name' | 'title'> {
    return {
      id: size.id,
      name: size.name,
      title: size.title
    };
  }

  static toMinimalResponseArray(sizes: Size[]): Array<Pick<SizeResponse, 'id' | 'name' | 'title'>> {
    return sizes.map(size => this.toMinimalResponse(size));
  }

  static mergePatchData<T extends Record<string, any>>(
    existing: T,
    updates: Partial<T>
  ): T {
    const merged = { ...existing };
    
    for (const key in updates) {
      if (updates[key] !== undefined) {
        merged[key] = updates[key] as T[Extract<keyof T, string>];
      }
    }
    
    return merged;
  }

  static extractChangedFields<T extends Record<string, any>>(
    original: T,
    updated: Partial<T>
  ): Partial<T> {
    const changes: Partial<T> = {};
    
    for (const key in updated) {
      if (updated[key] !== undefined && updated[key] !== original[key]) {
        changes[key] = updated[key];
      }
    }
    
    return changes;
  }

  static calculateVolume(size: Size): number | null {
    if (!size.width || !size.height || !size.depth) {
      return null;
    }
    return size.width * size.height * size.depth;
  }

  static formatDimensions(size: Size): string {
    const parts: string[] = [];
    
    if (size.width) {
      parts.push(`W: ${size.width}${size.unit || 'mm'}`);
    }
    
    if (size.height) {
      parts.push(`H: ${size.height}${size.unit || 'mm'}`);
    }
    
    if (size.depth) {
      parts.push(`D: ${size.depth}${size.unit || 'mm'}`);
    }
    
    return parts.length > 0 ? parts.join(' × ') : 'No dimensions';
  }

  static convertUnit(value: number, fromUnit: string, toUnit: string): number {
    const conversions: Record<string, number> = {
      'mm': 1,
      'cm': 10,
      'inch': 25.4,
      'feet': 304.8
    };

    const fromFactor = conversions[fromUnit] || 1;
    const toFactor = conversions[toUnit] || 1;

    return (value * fromFactor) / toFactor;
  }

  static normalizeDimensions(
    size: Size,
    targetUnit: string = 'mm'
  ): { width: number | null; height: number | null; depth: number | null } {
    const unit = size.unit || 'mm';

    return {
      width: size.width ? this.convertUnit(size.width, unit, targetUnit) : null,
      height: size.height ? this.convertUnit(size.height, unit, targetUnit) : null,
      depth: size.depth ? this.convertUnit(size.depth, unit, targetUnit) : null
    };
  }

  static sortByName(sizes: SizeResponse[], order: 'asc' | 'desc' = 'asc'): SizeResponse[] {
    return [...sizes].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return order === 'asc' ? comparison : -comparison;
    });
  }

  static sortBySortOrder(sizes: SizeResponse[], order: 'asc' | 'desc' = 'asc'): SizeResponse[] {
    return [...sizes].sort((a, b) => {
      const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const comparison = aOrder - bOrder;
      return order === 'asc' ? comparison : -comparison;
    });
  }

  static sortByVolume(sizes: Size[], order: 'asc' | 'desc' = 'asc'): Size[] {
    return [...sizes].sort((a, b) => {
      const volumeA = this.calculateVolume(a) || 0;
      const volumeB = this.calculateVolume(b) || 0;
      const comparison = volumeA - volumeB;
      return order === 'asc' ? comparison : -comparison;
    });
  }

  static groupByCategory(sizes: SizeResponse[]): Record<string, SizeResponse[]> {
    return sizes.reduce((groups, size) => {
      const category = size.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(size);
      return groups;
    }, {} as Record<string, SizeResponse[]>);
  }

  static groupByUnit(sizes: SizeResponse[]): Record<string, SizeResponse[]> {
    return sizes.reduce((groups, size) => {
      const unit = size.unit || 'mm';
      if (!groups[unit]) {
        groups[unit] = [];
      }
      groups[unit].push(size);
      return groups;
    }, {} as Record<string, SizeResponse[]>);
  }

  static filterActive(sizes: SizeResponse[]): SizeResponse[] {
    return sizes.filter(size => size.isActive);
  }

  static filterInactive(sizes: SizeResponse[]): SizeResponse[] {
    return sizes.filter(size => !size.isActive);
  }

  static filterByDimensionRange(
    sizes: Size[],
    minWidth?: number,
    maxWidth?: number,
    minHeight?: number,
    maxHeight?: number,
    minDepth?: number,
    maxDepth?: number
  ): Size[] {
    return sizes.filter(size => {
      if (minWidth !== undefined && size.width && size.width < minWidth) return false;
      if (maxWidth !== undefined && size.width && size.width > maxWidth) return false;
      if (minHeight !== undefined && size.height && size.height < minHeight) return false;
      if (maxHeight !== undefined && size.height && size.height > maxHeight) return false;
      if (minDepth !== undefined && size.depth && size.depth < minDepth) return false;
      if (maxDepth !== undefined && size.depth && size.depth > maxDepth) return false;
      return true;
    });
  }

  static toSummary(size: Size): {
    id: string;
    name: string;
    dimensions: string;
    volume: number | null;
    category: string;
  } {
    return {
      id: size.id,
      name: size.name,
      dimensions: this.formatDimensions(size),
      volume: this.calculateVolume(size),
      category: size.category
    };
  }

  static toDetailedResponse(size: Size, includeCalculated: boolean = true): SizeResponse & {
    volume?: number | null;
    formattedDimensions?: string;
  } {
    const response = this.toResponse(size);
    
    if (includeCalculated) {
      return {
        ...response,
        volume: this.calculateVolume(size),
        formattedDimensions: this.formatDimensions(size)
      };
    }
    
    return response;
  }
}