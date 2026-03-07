import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { ProductService } from '../products/product.service';
import { ApiResponse } from '../../../../packages/api-client/src/types/api.types';

export class ProductController {
  private productService = new ProductService();

  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        category,
        search,
        minPrice,
        maxPrice,
        colours,
        sizes,
        styles,
        finishes,
        range,
        featured,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        category: category as string,
        search: search as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        colours: colours ? (colours as string).split(',') : undefined,
        sizes: sizes ? (sizes as string).split(',') : undefined,
        styles: styles ? (styles as string).split(',') : undefined,
        finishes: finishes ? (finishes as string).split(',') : undefined,
        range: range as string,
        featured: featured === 'true',
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await this.productService.getProducts({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters,
      });

      res.json(result);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.productService.getProduct(id);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        } as ApiResponse);
        return;
      }

      const productData = req.body;
      const result = await this.productService.createProduct(productData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        } as ApiResponse);
        return;
      }

      const { id } = req.params;
      const productData = req.body;
      const result = await this.productService.updateProduct(id, productData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.productService.deleteProduct(id);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.productService.getCategories();
      res.json(result);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getColours(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.productService.getColours();
      res.json(result);
    } catch (error) {
      console.error('Get colours error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getSizes(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.productService.getSizes();
      res.json(result);
    } catch (error) {
      console.error('Get sizes error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getInventory(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const result = await this.productService.getInventory(productId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get inventory error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async updateInventory(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        } as ApiResponse);
        return;
      }

      const { productId } = req.params;
      const inventoryData = req.body;
      const result = await this.productService.updateInventory(productId, inventoryData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Update inventory error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async getFeaturedProducts(req: Request, res: Response): Promise<void> {
    try {
      const { limit = '10' } = req.query;
      const result = await this.productService.getFeaturedProducts(parseInt(limit as string));
      res.json(result);
    } catch (error) {
      console.error('Get featured products error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }

  async searchProducts(req: Request, res: Response): Promise<void> {
    try {
      const {
        q: query,
        page = '1',
        limit = '20',
        category,
        minPrice,
        maxPrice,
        sortBy = 'relevance',
        sortOrder = 'desc',
      } = req.query;

      if (!query) {
        res.status(400).json({
          success: false,
          message: 'Search query is required',
          error: 'SEARCH_QUERY_REQUIRED',
        } as ApiResponse);
        return;
      }

      const searchFilters = {
        query: query as string,
        category: category as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await this.productService.searchProducts({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        searchFilters,
      });

      res.json(result);
    } catch (error) {
      console.error('Search products error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse);
    }
  }
}
