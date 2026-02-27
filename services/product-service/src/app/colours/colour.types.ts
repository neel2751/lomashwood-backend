import { Prisma } from '@prisma/client';

export enum ColourCategory {
  KITCHEN = 'KITCHEN',
  BEDROOM = 'BEDROOM',
  BOTH = 'BOTH'
}

export interface Colour {
  id: string;
  name: string;
  hexCode: string;
  description?: string | null;
  category: ColourCategory;
  isActive: boolean;
  sortOrder?: number | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type ColourWithRelations = Prisma.Colour & { _count?: { products: number } };

export interface ColourRepositoryOptions {
  where?: Prisma.ColourWhereInput;
  include?: Prisma.ColourInclude;
  skip?: number;
  take?: number;
  orderBy?: Prisma.ColourOrderByWithRelationInput;
}

export interface CreateColourDTO {
  name: string;
  hexCode: string;
  description?: string;
  category?: ColourCategory;
  isActive?: boolean;
  sortOrder?: number;
  metadata?: Record<string, any>;
}

export interface UpdateColourDTO {
  name?: string;
  hexCode?: string;
  description?: string;
  category?: ColourCategory;
  isActive?: boolean;
  sortOrder?: number;
  metadata?: Record<string, any>;
}

export interface ColourFilters {
  q?: string;
  category?: ColourCategory;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'sortOrder' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ColourResponse {
  id: string;
  name: string;
  hexCode: string;
  description?: string | null;
  category: ColourCategory;
  isActive: boolean;
  sortOrder?: number | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ColourListResponse {
  data: ColourResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BulkCreateColourDTO {
  colours: CreateColourDTO[];
}

export interface BulkDeleteColourDTO {
  ids: string[];
}

export interface BulkCreateColourResponse {
  created: ColourResponse[];
  failed: Array<{
    colour: CreateColourDTO;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface BulkDeleteColourResponse {
  deleted: string[];
  failed: Array<{
    id: string;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface UpdateColourStatusDTO {
  isActive: boolean;
}

export interface ColourProductCount {
  colourId: string;
  productCount: number;
}

export interface ColourWithProducts extends ColourResponse {
  productCount: number;
  products?: Array<{
    id: string;
    title: string;
    category: string;
  }>;
}

export interface ColourSearchResult {
  colour: ColourResponse;
  matchScore: number;
  matchedFields: string[];
}

export interface ColourAnalytics {
  totalColours: number;
  activeColours: number;
  inactiveColours: number;
  coloursByCategory: Record<ColourCategory, number>;
  mostUsedColours: Array<{
    colour: ColourResponse;
    usageCount: number;
  }>;
  recentlyAdded: ColourResponse[];
}

export interface ColourValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ColourError {
  code: string;
  message: string;
  details?: ColourValidationError[];
}