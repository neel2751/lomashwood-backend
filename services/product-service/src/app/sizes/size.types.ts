
export enum SizeUnit {
  MM   = 'MM',    
  CM   = 'CM',    
  INCH = 'INCH',  
  FT   = 'FT',    
}

export enum SizeCategory {
  FURNITURE  = 'FURNITURE',
  PANEL      = 'PANEL',
  FLOORING   = 'FLOORING',
  MOULDING   = 'MOULDING',
  DOOR       = 'DOOR',
  WINDOW     = 'WINDOW',
  CUSTOM     = 'CUSTOM',
}

export enum SizeStatus {
  ACTIVE   = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}



export interface Size {
  id:          string;
  name:        string;           
  label:       string;           
  slug:        string;           
  description: string | null;

  
  length:      number | null;
  width:       number | null;
  height:      number | null;
  thickness:   number | null;
  unit:        SizeUnit;

  
  dimensionString: string | null; 

  category:    SizeCategory;
  status:      SizeStatus;
  sortOrder:   number;

  
  productCount: number;          

  
  createdAt:   Date;
  updatedAt:   Date;
  deletedAt:   Date | null;
}



export interface CreateSizeDto {
  name:        string;
  label:       string;
  slug?:       string;           
  description?: string;

  length?:     number;
  width?:      number;
  height?:     number;
  thickness?:  number;
  unit?:       SizeUnit;         

  category?:   SizeCategory;    
  sortOrder?:  number;          
}



export interface UpdateSizeDto {
  name?:        string;
  label?:       string;
  slug?:        string;
  description?: string;

  length?:      number | null;
  width?:       number | null;
  height?:      number | null;
  thickness?:   number | null;
  unit?:        SizeUnit;

  category?:    SizeCategory;
  status?:      SizeStatus;
  sortOrder?:   number;
}



export interface SizeResponseDto {
  id:              string;
  name:            string;
  label:           string;
  slug:            string;
  description:     string | null;
  dimensionString: string | null;
  length:          number | null;
  width:           number | null;
  height:          number | null;
  thickness:       number | null;
  unit:            SizeUnit;
  category:        SizeCategory;
  status:          SizeStatus;
  sortOrder:       number;
  productCount:    number;
  createdAt:       string;  
  updatedAt:       string;
}

export interface SizeSummaryDto {
  id:    string;
  name:  string;
  label: string;
  slug:  string;
  unit:  SizeUnit;
}



export interface SizeFilterParams {
  search?:    string;           
  category?:  SizeCategory;
  status?:    SizeStatus;
  unit?:      SizeUnit;
  page?:      number;
  limit?:     number;
  sortBy?:    SizeSortField;
  sortOrder?: 'asc' | 'desc';
}

export type SizeSortField = 'name' | 'label' | 'sortOrder' | 'createdAt' | 'productCount';



export interface PaginatedSizesResponse {
  data:       SizeResponseDto[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}



export interface ISizeRepository {
  findAll(filters: SizeFilterParams): Promise<[Size[], number]>;
  findById(id: string): Promise<Size | null>;
  findBySlug(slug: string): Promise<Size | null>;
  findByName(name: string): Promise<Size | null>;
  findByIds(ids: string[]): Promise<Size[]>;
  create(data: CreateSizeDto): Promise<Size>;
  update(id: string, data: UpdateSizeDto): Promise<Size>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<Size>;
  countProductsBySize(sizeId: string): Promise<number>;
}



export interface ISizeService {
  getAllSizes(filters: SizeFilterParams): Promise<PaginatedSizesResponse>;
  getSizeById(id: string): Promise<SizeResponseDto>;
  getSizeBySlug(slug: string): Promise<SizeResponseDto>;
  createSize(dto: CreateSizeDto): Promise<SizeResponseDto>;
  updateSize(id: string, dto: UpdateSizeDto): Promise<SizeResponseDto>;
  deleteSize(id: string): Promise<void>;
  restoreSize(id: string): Promise<SizeResponseDto>;
}



export interface ISizeMapper {
  toResponseDto(size: Size): SizeResponseDto;
  toSummaryDto(size: Size): SizeSummaryDto;
  toDomainFromCreate(dto: CreateSizeDto): Partial<Size>;
  toDomainFromUpdate(dto: UpdateSizeDto): Partial<Size>;
}



export interface SizeCreatedEventPayload {
  sizeId:    string;
  name:      string;
  label:     string;
  category:  SizeCategory;
  createdAt: string;
}

export interface SizeUpdatedEventPayload {
  sizeId:    string;
  changes:   Partial<UpdateSizeDto>;
  updatedAt: string;
}

export interface SizeDeletedEventPayload {
  sizeId:    string;
  deletedAt: string;
}