import { createProductService } from '../utils/http';
import {
  Product,
  Category,
  Colour,
  Size,
  Inventory,
  Pricing,
  CreateProductRequest,
  UpdateProductRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateColourRequest,
  UpdateColourRequest,
  CreateSizeRequest,
  UpdateSizeRequest,
  CreateInventoryRequest,
  UpdateInventoryRequest,
  CreatePricingRequest,
  UpdatePricingRequest,
  FilterProductRequest,
} from '../types/product.types';
import { PaginatedResponse } from '../types/api.types';

class ProductService {
  private client = createProductService();

  // Category endpoints
  async getCategories(): Promise<Category[]> {
    return this.client.get<Category[]>('/categories');
  }

  async getCategoryById(id: string): Promise<Category> {
    return this.client.get<Category>(`/categories/${id}`);
  }

  async createCategory(categoryData: CreateCategoryRequest): Promise<Category> {
    return this.client.post<Category>('/categories', categoryData);
  }

  async updateCategory(id: string, categoryData: UpdateCategoryRequest): Promise<Category> {
    return this.client.put<Category>(`/categories/${id}`, categoryData);
  }

  async deleteCategory(id: string): Promise<void> {
    return this.client.delete<void>(`/categories/${id}`);
  }

  async toggleCategoryStatus(id: string): Promise<Category> {
    return this.client.patch<Category>(`/categories/${id}/toggle-status`);
  }

  // Colour endpoints
  async getColours(): Promise<Colour[]> {
    return this.client.get<Colour[]>('/colours');
  }

  async getColourById(id: string): Promise<Colour> {
    return this.client.get<Colour>(`/colours/${id}`);
  }

  async createColour(colourData: CreateColourRequest): Promise<Colour> {
    return this.client.post<Colour>('/colours', colourData);
  }

  async updateColour(id: string, colourData: UpdateColourRequest): Promise<Colour> {
    return this.client.put<Colour>(`/colours/${id}`, colourData);
  }

  async deleteColour(id: string): Promise<void> {
    return this.client.delete<void>(`/colours/${id}`);
  }

  async toggleColourStatus(id: string): Promise<Colour> {
    return this.client.patch<Colour>(`/colours/${id}/toggle-status`);
  }

  // Size endpoints
  async getSizes(): Promise<Size[]> {
    return this.client.get<Size[]>('/sizes');
  }

  async getSizeById(id: string): Promise<Size> {
    return this.client.get<Size>(`/sizes/${id}`);
  }

  async createSize(sizeData: CreateSizeRequest): Promise<Size> {
    return this.client.post<Size>('/sizes', sizeData);
  }

  async updateSize(id: string, sizeData: UpdateSizeRequest): Promise<Size> {
    return this.client.put<Size>(`/sizes/${id}`, sizeData);
  }

  async deleteSize(id: string): Promise<void> {
    return this.client.delete<void>(`/sizes/${id}`);
  }

  async toggleSizeStatus(id: string): Promise<Size> {
    return this.client.patch<Size>(`/sizes/${id}/toggle-status`);
  }

  // Product endpoints
  async getProducts(params?: FilterProductRequest): Promise<PaginatedResponse<Product>> {
    return this.client.get<PaginatedResponse<Product>>('/products', params);
  }

  async getProductById(id: string): Promise<Product> {
    return this.client.get<Product>(`/products/${id}`);
  }

  async getProductBySlug(slug: string): Promise<Product> {
    return this.client.get<Product>(`/products/slug/${slug}`);
  }

  async createProduct(productData: CreateProductRequest): Promise<Product> {
    return this.client.post<Product>('/products', productData);
  }

  async updateProduct(id: string, productData: UpdateProductRequest): Promise<Product> {
    return this.client.put<Product>(`/products/${id}`, productData);
  }

  async deleteProduct(id: string): Promise<void> {
    return this.client.delete<void>(`/products/${id}`);
  }

  async toggleProductStatus(id: string): Promise<Product> {
    return this.client.patch<Product>(`/products/${id}/toggle-status`);
  }

  async toggleFeaturedStatus(id: string): Promise<Product> {
    return this.client.patch<Product>(`/products/${id}/toggle-featured`);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return this.client.get<Product[]>('/products/featured');
  }

  async getRelatedProducts(productId: string): Promise<Product[]> {
    return this.client.get<Product[]>(`/products/${productId}/related`);
  }

  async searchProducts(query: string, params?: FilterProductRequest): Promise<PaginatedResponse<Product>> {
    return this.client.get<PaginatedResponse<Product>>('/products/search', { query, ...params });
  }

  // Inventory endpoints
  async getInventory(params?: {
    productId?: string;
    colourId?: string;
    sizeId?: string;
    lowStock?: boolean;
  }): Promise<Inventory[]> {
    return this.client.get<Inventory[]>('/inventory', params);
  }

  async getInventoryById(id: string): Promise<Inventory> {
    return this.client.get<Inventory>(`/inventory/${id}`);
  }

  async createInventory(inventoryData: CreateInventoryRequest): Promise<Inventory> {
    return this.client.post<Inventory>('/inventory', inventoryData);
  }

  async updateInventory(id: string, inventoryData: UpdateInventoryRequest): Promise<Inventory> {
    return this.client.put<Inventory>(`/inventory/${id}`, inventoryData);
  }

  async deleteInventory(id: string): Promise<void> {
    return this.client.delete<void>(`/inventory/${id}`);
  }

  async updateStockQuantity(id: string, quantity: number): Promise<Inventory> {
    return this.client.patch<Inventory>(`/inventory/${id}/quantity`, { quantity });
  }

  async getLowStockItems(): Promise<Inventory[]> {
    return this.client.get<Inventory[]>('/inventory/low-stock');
  }

  // Pricing endpoints
  async getPricing(params?: {
    productId?: string;
    colourId?: string;
    sizeId?: string;
    onSale?: boolean;
  }): Promise<Pricing[]> {
    return this.client.get<Pricing[]>('/pricing', params);
  }

  async getPricingById(id: string): Promise<Pricing> {
    return this.client.get<Pricing>(`/pricing/${id}`);
  }

  async createPricing(pricingData: CreatePricingRequest): Promise<Pricing> {
    return this.client.post<Pricing>('/pricing', pricingData);
  }

  async updatePricing(id: string, pricingData: UpdatePricingRequest): Promise<Pricing> {
    return this.client.put<Pricing>(`/pricing/${id}`, pricingData);
  }

  async deletePricing(id: string): Promise<void> {
    return this.client.delete<void>(`/pricing/${id}`);
  }

  async startSale(id: string, salePrice: number, saleStart: string, saleEnd?: string): Promise<Pricing> {
    return this.client.patch<Pricing>(`/pricing/${id}/start-sale`, {
      salePrice,
      saleStart,
      saleEnd,
    });
  }

  async endSale(id: string): Promise<Pricing> {
    return this.client.patch<Pricing>(`/pricing/${id}/end-sale`);
  }

  async getSaleItems(): Promise<Pricing[]> {
    return this.client.get<Pricing[]>('/pricing/sale');
  }

  // Bulk operations
  async bulkUpdateInventory(updates: Array<{ id: string; quantity: number }>): Promise<Inventory[]> {
    return this.client.post<Inventory[]>('/inventory/bulk-update', { updates });
  }

  async bulkUpdatePricing(updates: Array<{ id: string; basePrice: number; salePrice?: number }>): Promise<Pricing[]> {
    return this.client.post<Pricing[]>('/pricing/bulk-update', { updates });
  }
}

export const productService = new ProductService();
