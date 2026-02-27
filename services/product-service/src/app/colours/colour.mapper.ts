import { Colour, ColourResponse, ColourListResponse, ColourWithProducts, BulkCreateColourResponse, BulkDeleteColourResponse, CreateColourDTO } from './colour.types';

export class ColourMapper {
  static toResponse(colour: Colour): ColourResponse {
    return {
      id: colour.id,
      name: colour.name,
      hexCode: colour.hexCode,
      description: colour.description,
      category: colour.category,
      isActive: colour.isActive,
      sortOrder: colour.sortOrder,
      metadata: colour.metadata,
      createdAt: colour.createdAt.toISOString(),
      updatedAt: colour.updatedAt.toISOString()
    };
  }

  static toListResponse(
    colours: Colour[],
    total: number,
    page: number,
    limit: number
  ): ColourListResponse {
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: colours.map(colour => this.toResponse(colour)),
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

  static toResponseArray(colours: Colour[]): ColourResponse[] {
    return colours.map(colour => this.toResponse(colour));
  }

  static toWithProducts(
    colour: Colour,
    productCount: number,
    products?: Array<{ id: string; title: string; category: string }>
  ): ColourWithProducts {
    return {
      ...this.toResponse(colour),
      productCount,
      products
    };
  }

  static toBulkCreateResponse(
    created: Colour[],
    failed: Array<{ colour: CreateColourDTO; error: string }>
  ): BulkCreateColourResponse {
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
  ): BulkDeleteColourResponse {
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

  static sanitizeHexCode(hexCode: string): string {
    let sanitized = hexCode.trim().toUpperCase();
    
    if (!sanitized.startsWith('#')) {
      sanitized = `#${sanitized}`;
    }
    
    if (sanitized.length === 4) {
      const r = sanitized[1];
      const g = sanitized[2];
      const b = sanitized[3];
      sanitized = `#${r}${r}${g}${g}${b}${b}`;
    }
    
    return sanitized;
  }

  static stripSensitiveData(colour: ColourResponse): Omit<ColourResponse, 'metadata'> {
    const { metadata, ...publicData } = colour;
    return publicData;
  }

  static toMinimalResponse(colour: Colour): Pick<ColourResponse, 'id' | 'name' | 'hexCode'> {
    return {
      id: colour.id,
      name: colour.name,
      hexCode: colour.hexCode
    };
  }

  static toMinimalResponseArray(colours: Colour[]): Array<Pick<ColourResponse, 'id' | 'name' | 'hexCode'>> {
    return colours.map(colour => this.toMinimalResponse(colour));
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

  static isValidHexCode(hexCode: string): boolean {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(hexCode);
  }

  static hexToRgb(hexCode: string): { r: number; g: number; b: number } | null {
    const sanitized = this.sanitizeHexCode(hexCode);
    
    if (!this.isValidHexCode(sanitized)) {
      return null;
    }
    
    const hex = sanitized.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
  }

  static rgbToHex(r: number, g: number, b: number): string {
    const toHex = (value: number): string => {
      const hex = Math.max(0, Math.min(255, Math.round(value))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  static calculateBrightness(hexCode: string): number {
    const rgb = this.hexToRgb(hexCode);
    if (!rgb) return 0;
    
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  }

  static isLightColor(hexCode: string): boolean {
    return this.calculateBrightness(hexCode) > 127.5;
  }

  static getContrastColor(hexCode: string): string {
    return this.isLightColor(hexCode) ? '#000000' : '#FFFFFF';
  }

  static sortByName(colours: ColourResponse[], order: 'asc' | 'desc' = 'asc'): ColourResponse[] {
    return [...colours].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return order === 'asc' ? comparison : -comparison;
    });
  }

  static sortBySortOrder(colours: ColourResponse[], order: 'asc' | 'desc' = 'asc'): ColourResponse[] {
    return [...colours].sort((a, b) => {
      const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const comparison = aOrder - bOrder;
      return order === 'asc' ? comparison : -comparison;
    });
  }

  static groupByCategory(colours: ColourResponse[]): Record<string, ColourResponse[]> {
    return colours.reduce((groups, colour) => {
      const category = colour.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(colour);
      return groups;
    }, {} as Record<string, ColourResponse[]>);
  }

  static filterActive(colours: ColourResponse[]): ColourResponse[] {
    return colours.filter(colour => colour.isActive);
  }

  static filterInactive(colours: ColourResponse[]): ColourResponse[] {
    return colours.filter(colour => !colour.isActive);
  }
}