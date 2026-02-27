import { Request, Response, NextFunction } from 'express';
import { PricingService } from './pricing.service';
import { 
  CreatePricingDto, 
  UpdatePricingDto, 
  PricingQueryDto,
  BulkUpdatePricingDto,
  CalculatePriceDto
} from './pricing.types';
import { 
  successResponse, 
  createdResponse, 
  noContentResponse 
} from '../../utils/response';
import { logger } from '../../shared/utils';

export class PricingController {
  constructor(private readonly service: PricingService) {}

  async createPricing(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto: CreatePricingDto = req.body;
      
      const pricing = await this.service.createPricing(dto);
      
      createdResponse(res, pricing, 'Pricing created successfully');
    } catch (error) {
      logger.error('Error in createPricing controller', { error, body: req.body });
      next(error);
    }
  }

  async updatePricing(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdatePricingDto = req.body;
      
      const pricing = await this.service.updatePricing(id, dto);
      
      successResponse(res, pricing, 'Pricing updated successfully');
    } catch (error) {
      logger.error('Error in updatePricing controller', { 
        error, 
        id: req.params.id, 
        body: req.body 
      });
      next(error);
    }
  }

  async getPricingById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      
      const pricing = await this.service.getPricingById(id);
      
      successResponse(res, pricing, 'Pricing retrieved successfully');
    } catch (error) {
      logger.error('Error in getPricingById controller', { 
        error, 
        id: req.params.id 
      });
      next(error);
    }
  }

  async getPricingByProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { productId } = req.params;
      
      const pricing = await this.service.getPricingByProduct(productId);
      
      successResponse(
        res, 
        pricing, 
        'Product pricing retrieved successfully'
      );
    } catch (error) {
      logger.error('Error in getPricingByProduct controller', { 
        error, 
        productId: req.params.productId 
      });
      next(error);
    }
  }

  async getPricingByVariant(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { variantId } = req.params;
      
      const pricing = await this.service.getPricingByVariant(variantId);
      
      successResponse(
        res, 
        pricing, 
        'Variant pricing retrieved successfully'
      );
    } catch (error) {
      logger.error('Error in getPricingByVariant controller', { 
        error, 
        variantId: req.params.variantId 
      });
      next(error);
    }
  }

  async getAllPricing(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query: PricingQueryDto = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        productId: req.query.productId as string,
        variantId: req.query.variantId as string,
        category: req.query.category as any,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        isOnSale: req.query.isOnSale === 'true' ? true : req.query.isOnSale === 'false' ? false : undefined,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      };
      
      const result = await this.service.getAllPricing(query);
      
      successResponse(res, result, 'Pricing list retrieved successfully');
    } catch (error) {
      logger.error('Error in getAllPricing controller', { 
        error, 
        query: req.query 
      });
      next(error);
    }
  }

  async calculatePrice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto: CalculatePriceDto = req.body;
      
      const calculation = await this.service.calculatePrice(dto);
      
      successResponse(res, calculation, 'Price calculated successfully');
    } catch (error) {
      logger.error('Error in calculatePrice controller', { 
        error, 
        body: req.body 
      });
      next(error);
    }
  }

  async bulkUpdatePricing(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto: BulkUpdatePricingDto = req.body;
      
      const result = await this.service.bulkUpdatePricing(dto);
      
      successResponse(res, result, 'Bulk pricing update completed successfully');
    } catch (error) {
      logger.error('Error in bulkUpdatePricing controller', { 
        error, 
        body: req.body 
      });
      next(error);
    }
  }

  async applyDiscount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { discountPercentage, discountAmount, startDate, endDate } = req.body;
      
      const pricing = await this.service.applyDiscount(
        id,
        discountPercentage,
        discountAmount,
        startDate,
        endDate
      );
      
      successResponse(res, pricing, 'Discount applied successfully');
    } catch (error) {
      logger.error('Error in applyDiscount controller', { 
        error, 
        id: req.params.id, 
        body: req.body 
      });
      next(error);
    }
  }

  async removeDiscount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      
      const pricing = await this.service.removeDiscount(id);
      
      successResponse(res, pricing, 'Discount removed successfully');
    } catch (error) {
      logger.error('Error in removeDiscount controller', { 
        error, 
        id: req.params.id 
      });
      next(error);
    }
  }

  async getActiveSales(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { category } = req.query;
      
      const sales = await this.service.getActiveSales(category as any);
      
      successResponse(res, sales, 'Active sales retrieved successfully');
    } catch (error) {
      logger.error('Error in getActiveSales controller', { 
        error, 
        query: req.query 
      });
      next(error);
    }
  }

  async getPricingHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      
      const history = await this.service.getPricingHistory(id);
      
      successResponse(res, history, 'Pricing history retrieved successfully');
    } catch (error) {
      logger.error('Error in getPricingHistory controller', { 
        error, 
        id: req.params.id 
      });
      next(error);
    }
  }

  async getPriceComparison(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { productId } = req.params;
      
      const comparison = await this.service.getPriceComparison(productId);
      
      successResponse(res, comparison, 'Price comparison retrieved successfully');
    } catch (error) {
      logger.error('Error in getPriceComparison controller', { 
        error, 
        productId: req.params.productId 
      });
      next(error);
    }
  }

  async getPricingStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await this.service.getPricingStats();
      
      successResponse(res, stats, 'Pricing stats retrieved successfully');
    } catch (error) {
      logger.error('Error in getPricingStats controller', { error });
      next(error);
    }
  }

  async deletePricing(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      
      await this.service.deletePricing(id);
      
      noContentResponse(res);
    } catch (error) {
      logger.error('Error in deletePricing controller', { 
        error, 
        id: req.params.id 
      });
      next(error);
    }
  }

  async duplicatePricing(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { targetProductId, targetVariantId } = req.body;
      
      const pricing = await this.service.duplicatePricing(
        id,
        targetProductId,
        targetVariantId
      );
      
      createdResponse(res, pricing, 'Pricing duplicated successfully');
    } catch (error) {
      logger.error('Error in duplicatePricing controller', { 
        error, 
        id: req.params.id, 
        body: req.body 
      });
      next(error);
    }
  }

  async exportPricing(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { format } = req.query;
      const filters: PricingQueryDto = {
        category: req.query.category as any,
        productId: req.query.productId as string,
        isOnSale: req.query.isOnSale === 'true' ? true : req.query.isOnSale === 'false' ? false : undefined
      };
      
      const exportData = await this.service.exportPricing(
        filters,
        format as 'JSON' | 'CSV' | 'EXCEL'
      );
      
      successResponse(res, exportData, 'Pricing data exported successfully');
    } catch (error) {
      logger.error('Error in exportPricing controller', { 
        error, 
        query: req.query 
      });
      next(error);
    }
  }
}