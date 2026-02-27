import { PrismaClient, Pricing, Prisma } from '@prisma/client';
import { PricingRepository } from './pricing.repository';
import { 
  CreatePricingDto, 
  UpdatePricingDto, 
  PricingQueryDto,
  PricingResponseDto,
  BulkUpdatePricingDto,
  CalculatePriceDto,
  PriceCalculationResponseDto,
  BulkUpdateResultDto,
  PricingStatsDto,
  PriceComparisonDto,
  PricingHistoryDto
} from './pricing.types';
import { PricingMapper } from './pricing.mapper';
import { 
  NotFoundError, 
  BadRequestError, 
  ConflictError 
} from '../../shared/errors';
import { EventProducer } from '../../infrastructure/messaging/event-producer';
import { PRICING_EVENTS } from './pricing.constants';
import { logger } from '../../shared/utils';

export class PricingService {
  constructor(
    private readonly repository: PricingRepository,
    private readonly eventProducer: EventProducer,
    private readonly prisma: PrismaClient
  ) {}

  async createPricing(dto: CreatePricingDto): Promise<PricingResponseDto> {
    try {
      const existingPricing = await this.repository.findByProductAndVariant(
        dto.productId,
        dto.variantId
      );

      if (existingPricing) {
        throw new ConflictError('Pricing already exists for this product variant');
      }

      if (dto.salePrice && dto.salePrice >= dto.basePrice) {
        throw new BadRequestError('Sale price must be less than base price');
      }

      const finalPrice = dto.salePrice || dto.basePrice;
      const discountAmount = dto.salePrice 
        ? dto.basePrice - dto.salePrice 
        : 0;
      const discountPercentage = dto.salePrice 
        ? ((dto.basePrice - dto.salePrice) / dto.basePrice) * 100 
        : 0;

      const pricing = await this.repository.create({
        productId: dto.productId,
        variantId: dto.variantId,
        basePrice: dto.basePrice,
        salePrice: dto.salePrice,
        costPrice: dto.costPrice,
        finalPrice,
        discountAmount,
        discountPercentage,
        currency: dto.currency || 'GBP',
        taxRate: dto.taxRate || 20,
        isOnSale: !!dto.salePrice,
        saleStartDate: dto.saleStartDate,
        saleEndDate: dto.saleEndDate,
        minOrderQuantity: dto.minOrderQuantity || 1,
        maxOrderQuantity: dto.maxOrderQuantity
      });

      await this.eventProducer.publish(PRICING_EVENTS.CREATED, {
        pricingId: pricing.id,
        productId: pricing.productId,
        variantId: pricing.variantId,
        basePrice: pricing.basePrice,
        finalPrice: pricing.finalPrice,
        timestamp: new Date().toISOString()
      });

      logger.info('Pricing created successfully', { pricingId: pricing.id });

      return PricingMapper.toResponse(pricing);
    } catch (error) {
      logger.error('Error creating pricing', { error, dto });
      throw error;
    }
  }

  async updatePricing(
    id: string, 
    dto: UpdatePricingDto
  ): Promise<PricingResponseDto> {
    try {
      const existing = await this.repository.findById(id);
      
      if (!existing) {
        throw new NotFoundError('Pricing not found');
      }

      if (dto.salePrice && dto.basePrice && dto.salePrice >= dto.basePrice) {
        throw new BadRequestError('Sale price must be less than base price');
      }

      const basePrice = dto.basePrice ?? existing.basePrice;
      const salePrice = dto.salePrice ?? existing.salePrice;
      const finalPrice = salePrice || basePrice;
      const discountAmount = salePrice ? basePrice - salePrice : 0;
      const discountPercentage = salePrice 
        ? ((basePrice - salePrice) / basePrice) * 100 
        : 0;

      const updateData: Prisma.PricingUpdateInput = {
        ...(dto.basePrice !== undefined && { basePrice: dto.basePrice }),
        ...(dto.salePrice !== undefined && { salePrice: dto.salePrice }),
        ...(dto.costPrice !== undefined && { costPrice: dto.costPrice }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.taxRate !== undefined && { taxRate: dto.taxRate }),
        ...(dto.minOrderQuantity !== undefined && { minOrderQuantity: dto.minOrderQuantity }),
        ...(dto.maxOrderQuantity !== undefined && { maxOrderQuantity: dto.maxOrderQuantity }),
        ...(dto.saleStartDate !== undefined && { saleStartDate: dto.saleStartDate }),
        ...(dto.saleEndDate !== undefined && { saleEndDate: dto.saleEndDate }),
        finalPrice,
        discountAmount,
        discountPercentage,
        isOnSale: !!salePrice
      };

      const updated = await this.repository.update(id, updateData);

      await this.eventProducer.publish(PRICING_EVENTS.UPDATED, {
        pricingId: updated.id,
        productId: updated.productId,
        variantId: updated.variantId,
        previousPrice: existing.finalPrice,
        newPrice: updated.finalPrice,
        timestamp: new Date().toISOString()
      });

      logger.info('Pricing updated successfully', { pricingId: id });

      return PricingMapper.toResponse(updated);
    } catch (error) {
      logger.error('Error updating pricing', { error, id, dto });
      throw error;
    }
  }

  async getPricingById(id: string): Promise<PricingResponseDto> {
    try {
      const pricing = await this.repository.findById(id);
      
      if (!pricing) {
        throw new NotFoundError('Pricing not found');
      }

      return PricingMapper.toResponse(pricing);
    } catch (error) {
      logger.error('Error fetching pricing', { error, id });
      throw error;
    }
  }

  async getPricingByProduct(productId: string): Promise<PricingResponseDto[]> {
    try {
      const pricings = await this.repository.findByProduct(productId);
      return pricings.map(PricingMapper.toResponse);
    } catch (error) {
      logger.error('Error fetching pricing by product', { error, productId });
      throw error;
    }
  }

  async getPricingByVariant(variantId: string): Promise<PricingResponseDto | null> {
    try {
      const pricing = await this.repository.findByVariant(variantId);
      
      if (!pricing) {
        return null;
      }

      return PricingMapper.toResponse(pricing);
    } catch (error) {
      logger.error('Error fetching pricing by variant', { error, variantId });
      throw error;
    }
  }

  async getAllPricing(query: PricingQueryDto): Promise<{
    data: PricingResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;

      const where: Prisma.PricingWhereInput = {
        deletedAt: null,
        ...(query.productId && { productId: query.productId }),
        ...(query.variantId && { variantId: query.variantId }),
        ...(query.category && { 
          product: { category: query.category } 
        }),
        ...(query.isOnSale !== undefined && { isOnSale: query.isOnSale }),
        ...(query.minPrice !== undefined || query.maxPrice !== undefined) && {
          finalPrice: {
            ...(query.minPrice !== undefined && { gte: query.minPrice }),
            ...(query.maxPrice !== undefined && { lte: query.maxPrice })
          }
        },
        ...(query.search && {
          OR: [
            { product: { name: { contains: query.search, mode: 'insensitive' } } },
            { variant: { title: { contains: query.search, mode: 'insensitive' } } }
          ]
        })
      };

      const [pricings, total] = await Promise.all([
        this.repository.findMany({
          where,
          skip,
          take: limit,
          orderBy: query.sortBy 
            ? { [query.sortBy]: query.sortOrder || 'desc' }
            : { createdAt: 'desc' }
        }),
        this.repository.count(where)
      ]);

      return {
        data: pricings.map(PricingMapper.toResponse),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching all pricing', { error, query });
      throw error;
    }
  }

  async calculatePrice(dto: CalculatePriceDto): Promise<PriceCalculationResponseDto> {
    try {
      const pricing = await this.repository.findByProductAndVariant(
        dto.productId,
        dto.variantId
      );

      if (!pricing) {
        throw new NotFoundError('Pricing not found for product variant');
      }

      const quantity = dto.quantity || 1;
      const subtotal = pricing.finalPrice * quantity;
      const taxAmount = subtotal * (pricing.taxRate / 100);
      const total = subtotal + taxAmount;
      const savings = pricing.isOnSale 
        ? (pricing.basePrice - pricing.finalPrice) * quantity 
        : 0;

      return {
        productId: dto.productId,
        variantId: dto.variantId,
        quantity,
        basePrice: pricing.basePrice,
        finalPrice: pricing.finalPrice,
        subtotal,
        taxRate: pricing.taxRate,
        taxAmount,
        total,
        currency: pricing.currency,
        isOnSale: pricing.isOnSale,
        discountAmount: pricing.discountAmount,
        discountPercentage: pricing.discountPercentage,
        savings
      };
    } catch (error) {
      logger.error('Error calculating price', { error, dto });
      throw error;
    }
  }

  async bulkUpdatePricing(dto: BulkUpdatePricingDto): Promise<BulkUpdateResultDto> {
    try {
      const results = await this.prisma.$transaction(async (tx) => {
        const updated: string[] = [];
        const failed: Array<{ id: string; error: string }> = [];

        for (const update of dto.updates) {
          try {
            const pricing = await this.repository.findById(update.id, tx);
            
            if (!pricing) {
              failed.push({ id: update.id, error: 'Pricing not found' });
              continue;
            }

            const basePrice = update.basePrice ?? pricing.basePrice;
            const salePrice = update.salePrice ?? pricing.salePrice;
            
            if (salePrice && salePrice >= basePrice) {
              failed.push({ id: update.id, error: 'Sale price must be less than base price' });
              continue;
            }

            const finalPrice = salePrice || basePrice;
            const discountAmount = salePrice ? basePrice - salePrice : 0;
            const discountPercentage = salePrice 
              ? ((basePrice - salePrice) / basePrice) * 100 
              : 0;

            await this.repository.update(
              update.id,
              {
                ...(update.basePrice !== undefined && { basePrice: update.basePrice }),
                ...(update.salePrice !== undefined && { salePrice: update.salePrice }),
                finalPrice,
                discountAmount,
                discountPercentage,
                isOnSale: !!salePrice
              },
              tx
            );

            updated.push(update.id);
          } catch (error) {
            failed.push({ 
              id: update.id, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        }

        return { updated, failed };
      });

      await this.eventProducer.publish(PRICING_EVENTS.BULK_UPDATED, {
        updatedCount: results.updated.length,
        failedCount: results.failed.length,
        timestamp: new Date().toISOString()
      });

      logger.info('Bulk pricing update completed', { 
        updated: results.updated.length, 
        failed: results.failed.length 
      });

      return {
        updatedCount: results.updated.length,
        failedCount: results.failed.length,
        updated: results.updated,
        failed: results.failed
      };
    } catch (error) {
      logger.error('Error in bulk update pricing', { error, dto });
      throw error;
    }
  }

  async applyDiscount(
    id: string,
    discountPercentage?: number,
    discountAmount?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<PricingResponseDto> {
    try {
      const pricing = await this.repository.findById(id);
      
      if (!pricing) {
        throw new NotFoundError('Pricing not found');
      }

      let salePrice: number;

      if (discountPercentage) {
        salePrice = pricing.basePrice * (1 - discountPercentage / 100);
      } else if (discountAmount) {
        salePrice = pricing.basePrice - discountAmount;
      } else {
        throw new BadRequestError('Either discount percentage or discount amount must be provided');
      }

      if (salePrice <= 0 || salePrice >= pricing.basePrice) {
        throw new BadRequestError('Invalid discount calculation');
      }

      const finalPrice = salePrice;
      const calculatedDiscountAmount = pricing.basePrice - salePrice;
      const calculatedDiscountPercentage = (calculatedDiscountAmount / pricing.basePrice) * 100;

      const updated = await this.repository.update(id, {
        salePrice,
        finalPrice,
        discountAmount: calculatedDiscountAmount,
        discountPercentage: calculatedDiscountPercentage,
        isOnSale: true,
        saleStartDate: startDate,
        saleEndDate: endDate
      });

      await this.eventProducer.publish(PRICING_EVENTS.DISCOUNT_APPLIED, {
        pricingId: updated.id,
        productId: updated.productId,
        variantId: updated.variantId,
        discountPercentage: calculatedDiscountPercentage,
        timestamp: new Date().toISOString()
      });

      logger.info('Discount applied successfully', { pricingId: id });

      return PricingMapper.toResponse(updated);
    } catch (error) {
      logger.error('Error applying discount', { error, id });
      throw error;
    }
  }

  async removeDiscount(id: string): Promise<PricingResponseDto> {
    try {
      const pricing = await this.repository.findById(id);
      
      if (!pricing) {
        throw new NotFoundError('Pricing not found');
      }

      const updated = await this.repository.update(id, {
        salePrice: null,
        finalPrice: pricing.basePrice,
        discountAmount: 0,
        discountPercentage: 0,
        isOnSale: false,
        saleStartDate: null,
        saleEndDate: null
      });

      await this.eventProducer.publish(PRICING_EVENTS.DISCOUNT_REMOVED, {
        pricingId: updated.id,
        productId: updated.productId,
        variantId: updated.variantId,
        timestamp: new Date().toISOString()
      });

      logger.info('Discount removed successfully', { pricingId: id });

      return PricingMapper.toResponse(updated);
    } catch (error) {
      logger.error('Error removing discount', { error, id });
      throw error;
    }
  }

  async getActiveSales(category?: 'KITCHEN' | 'BEDROOM'): Promise<PricingResponseDto[]> {
    try {
      const pricings = await this.repository.findActiveSales(category);
      return pricings.map(PricingMapper.toResponse);
    } catch (error) {
      logger.error('Error fetching active sales', { error, category });
      throw error;
    }
  }

  async getPricingHistory(id: string): Promise<PricingHistoryDto[]> {
    try {
      const history = await this.repository.findPricingHistory(id);
      return PricingMapper.toHistoryList(history);
    } catch (error) {
      logger.error('Error fetching pricing history', { error, id });
      throw error;
    }
  }

  async getPriceComparison(productId: string): Promise<PriceComparisonDto> {
    try {
      const pricings = await this.repository.findByProduct(productId);

      if (pricings.length === 0) {
        throw new NotFoundError('No pricing found for product');
      }

      const prices = pricings.map(p => p.finalPrice);
      const lowestPrice = Math.min(...prices);
      const highestPrice = Math.max(...prices);
      const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

      return {
        productId,
        lowestPrice,
        highestPrice,
        averagePrice,
        variantCount: pricings.length,
        onSaleCount: pricings.filter(p => p.isOnSale).length
      };
    } catch (error) {
      logger.error('Error getting price comparison', { error, productId });
      throw error;
    }
  }

  async getPricingStats(): Promise<PricingStatsDto> {
    try {
      const stats = await this.repository.getPricingStats();
      return stats;
    } catch (error) {
      logger.error('Error fetching pricing stats', { error });
      throw error;
    }
  }

  async deletePricing(id: string): Promise<void> {
    try {
      const existing = await this.repository.findById(id);
      
      if (!existing) {
        throw new NotFoundError('Pricing not found');
      }

      await this.repository.softDelete(id);

      await this.eventProducer.publish(PRICING_EVENTS.DELETED, {
        pricingId: id,
        productId: existing.productId,
        variantId: existing.variantId,
        timestamp: new Date().toISOString()
      });

      logger.info('Pricing deleted successfully', { pricingId: id });
    } catch (error) {
      logger.error('Error deleting pricing', { error, id });
      throw error;
    }
  }

  async duplicatePricing(
    id: string,
    targetProductId: string,
    targetVariantId: string
  ): Promise<PricingResponseDto> {
    try {
      const source = await this.repository.findById(id);
      
      if (!source) {
        throw new NotFoundError('Source pricing not found');
      }

      const existing = await this.repository.findByProductAndVariant(
        targetProductId,
        targetVariantId
      );

      if (existing) {
        throw new ConflictError('Pricing already exists for target product variant');
      }

      const duplicated = await this.repository.create({
        productId: targetProductId,
        variantId: targetVariantId,
        basePrice: source.basePrice,
        salePrice: source.salePrice,
        costPrice: source.costPrice,
        finalPrice: source.finalPrice,
        discountAmount: source.discountAmount,
        discountPercentage: source.discountPercentage,
        currency: source.currency,
        taxRate: source.taxRate,
        isOnSale: source.isOnSale,
        saleStartDate: source.saleStartDate,
        saleEndDate: source.saleEndDate,
        minOrderQuantity: source.minOrderQuantity,
        maxOrderQuantity: source.maxOrderQuantity
      });

      logger.info('Pricing duplicated successfully', { 
        sourceId: id, 
        duplicatedId: duplicated.id 
      });

      return PricingMapper.toResponse(duplicated);
    } catch (error) {
      logger.error('Error duplicating pricing', { error, id });
      throw error;
    }
  }

  async exportPricing(
    filters: PricingQueryDto,
    format: 'JSON' | 'CSV' | 'EXCEL'
  ): Promise<any> {
    try {
      const where: Prisma.PricingWhereInput = {
        deletedAt: null,
        ...(filters.category && { product: { category: filters.category } }),
        ...(filters.productId && { productId: filters.productId }),
        ...(filters.isOnSale !== undefined && { isOnSale: filters.isOnSale })
      };

      const pricings = await this.repository.findMany({ where });

      if (format === 'CSV') {
        return PricingMapper.toCSVFormat(pricings);
      }

      return PricingMapper.toExportFormat(pricings);
    } catch (error) {
      logger.error('Error exporting pricing', { error, filters, format });
      throw error;
    }
  }
}