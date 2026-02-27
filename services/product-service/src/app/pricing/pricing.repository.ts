import { PrismaClient, Pricing, Prisma } from '@prisma/client';
import { logger } from '../../shared/utils';

export class PricingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    data: Prisma.PricingCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Pricing> {
    try {
      const client = tx || this.prisma;
      return await client.pricing.create({
        data,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              sku: true,
              images: true
            }
          },
          variant: {
            select: {
              id: true,
              title: true,
              sku: true,
              colour: true,
              size: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error creating pricing in repository', { error, data });
      throw error;
    }
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<Pricing | null> {
    try {
      const client = tx || this.prisma;
      return await client.pricing.findUnique({
        where: { id },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              sku: true,
              images: true
            }
          },
          variant: {
            select: {
              id: true,
              title: true,
              sku: true,
              colour: {
                select: {
                  id: true,
                  name: true,
                  hexCode: true
                }
              },
              size: {
                select: {
                  id: true,
                  title: true,
                  description: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error finding pricing by id in repository', { error, id });
      throw error;
    }
  }

  async findByProduct(
    productId: string,
    tx?: Prisma.TransactionClient
  ): Promise<Pricing[]> {
    try {
      const client = tx || this.prisma;
      return await client.pricing.findMany({
        where: { 
          productId,
          deletedAt: null
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              sku: true,
              images: true
            }
          },
          variant: {
            select: {
              id: true,
              title: true,
              sku: true,
              colour: {
                select: {
                  id: true,
                  name: true,
                  hexCode: true
                }
              },
              size: {
                select: {
                  id: true,
                  title: true,
                  description: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      logger.error('Error finding pricing by product in repository', { 
        error, 
        productId 
      });
      throw error;
    }
  }

  async findByVariant(
    variantId: string,
    tx?: Prisma.TransactionClient
  ): Promise<Pricing | null> {
    try {
      const client = tx || this.prisma;
      return await client.pricing.findFirst({
        where: { 
          variantId,
          deletedAt: null
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              sku: true,
              images: true
            }
          },
          variant: {
            select: {
              id: true,
              title: true,
              sku: true,
              colour: {
                select: {
                  id: true,
                  name: true,
                  hexCode: true
                }
              },
              size: {
                select: {
                  id: true,
                  title: true,
                  description: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error finding pricing by variant in repository', { 
        error, 
        variantId 
      });
      throw error;
    }
  }

  async findByProductAndVariant(
    productId: string,
    variantId: string,
    tx?: Prisma.TransactionClient
  ): Promise<Pricing | null> {
    try {
      const client = tx || this.prisma;
      return await client.pricing.findFirst({
        where: {
          productId,
          variantId,
          deletedAt: null
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              sku: true
            }
          },
          variant: {
            select: {
              id: true,
              title: true,
              sku: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error finding pricing by product and variant in repository', { 
        error, 
        productId,
        variantId 
      });
      throw error;
    }
  }

  async findMany(
    params: {
      where?: Prisma.PricingWhereInput;
      skip?: number;
      take?: number;
      orderBy?: Prisma.PricingOrderByWithRelationInput;
    },
    tx?: Prisma.TransactionClient
  ): Promise<Pricing[]> {
    try {
      const client = tx || this.prisma;
      const { where, skip, take, orderBy } = params;

      return await client.pricing.findMany({
        where: {
          ...where,
          deletedAt: null
        },
        skip,
        take,
        orderBy,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              sku: true,
              images: true
            }
          },
          variant: {
            select: {
              id: true,
              title: true,
              sku: true,
              colour: {
                select: {
                  id: true,
                  name: true,
                  hexCode: true
                }
              },
              size: {
                select: {
                  id: true,
                  title: true,
                  description: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error finding many pricings in repository', { error, params });
      throw error;
    }
  }

  async count(
    where?: Prisma.PricingWhereInput,
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    try {
      const client = tx || this.prisma;
      return await client.pricing.count({ 
        where: {
          ...where,
          deletedAt: null
        }
      });
    } catch (error) {
      logger.error('Error counting pricings in repository', { error, where });
      throw error;
    }
  }

  async update(
    id: string,
    data: Prisma.PricingUpdateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Pricing> {
    try {
      const client = tx || this.prisma;
      return await client.pricing.update({
        where: { id },
        data,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              sku: true,
              images: true
            }
          },
          variant: {
            select: {
              id: true,
              title: true,
              sku: true,
              colour: {
                select: {
                  id: true,
                  name: true,
                  hexCode: true
                }
              },
              size: {
                select: {
                  id: true,
                  title: true,
                  description: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error updating pricing in repository', { error, id, data });
      throw error;
    }
  }

  async updateMany(
    where: Prisma.PricingWhereInput,
    data: Prisma.PricingUpdateManyMutationInput,
    tx?: Prisma.TransactionClient
  ): Promise<Prisma.BatchPayload> {
    try {
      const client = tx || this.prisma;
      return await client.pricing.updateMany({
        where: {
          ...where,
          deletedAt: null
        },
        data
      });
    } catch (error) {
      logger.error('Error updating many pricings in repository', { 
        error, 
        where, 
        data 
      });
      throw error;
    }
  }

  async delete(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<Pricing> {
    try {
      const client = tx || this.prisma;
      return await client.pricing.delete({
        where: { id }
      });
    } catch (error) {
      logger.error('Error deleting pricing in repository', { error, id });
      throw error;
    }
  }

  async softDelete(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<Pricing> {
    try {
      const client = tx || this.prisma;
      return await client.pricing.update({
        where: { id },
        data: {
          deletedAt: new Date()
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true
            }
          },
          variant: {
            select: {
              id: true,
              title: true,
              sku: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error soft deleting pricing in repository', { error, id });
      throw error;
    }
  }

  async findActiveSales(
    category?: 'KITCHEN' | 'BEDROOM',
    tx?: Prisma.TransactionClient
  ): Promise<Pricing[]> {
    try {
      const client = tx || this.prisma;
      const now = new Date();

      return await client.pricing.findMany({
        where: {
          isOnSale: true,
          deletedAt: null,
          ...(category && { product: { category } }),
          OR: [
            { saleStartDate: null, saleEndDate: null },
            { 
              saleStartDate: { lte: now },
              saleEndDate: { gte: now }
            },
            {
              saleStartDate: { lte: now },
              saleEndDate: null
            }
          ]
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              sku: true,
              images: true
            }
          },
          variant: {
            select: {
              id: true,
              title: true,
              sku: true,
              colour: {
                select: {
                  id: true,
                  name: true,
                  hexCode: true
                }
              },
              size: {
                select: {
                  id: true,
                  title: true,
                  description: true
                }
              }
            }
          }
        },
        orderBy: { discountPercentage: 'desc' }
      });
    } catch (error) {
      logger.error('Error finding active sales in repository', { error, category });
      throw error;
    }
  }

  async findPricingHistory(
    pricingId: string,
    tx?: Prisma.TransactionClient
  ): Promise<any[]> {
    try {
      const client = tx || this.prisma;
      return await client.pricingHistory.findMany({
        where: { pricingId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      logger.error('Error finding pricing history in repository', { error, pricingId });
      throw error;
    }
  }

  async createPricingHistory(
    data: Prisma.PricingHistoryCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<any> {
    try {
      const client = tx || this.prisma;
      return await client.pricingHistory.create({
        data
      });
    } catch (error) {
      logger.error('Error creating pricing history in repository', { error, data });
      throw error;
    }
  }

  async getPricingStats(tx?: Prisma.TransactionClient): Promise<{
    totalPricings: number;
    onSaleCount: number;
    averagePrice: number;
    averageDiscount: number;
    totalRevenue: number;
    kitchenCount: number;
    bedroomCount: number;
  }> {
    try {
      const client = tx || this.prisma;

      const [
        totalPricings,
        onSaleCount,
        aggregateData,
        kitchenCount,
        bedroomCount
      ] = await Promise.all([
        client.pricing.count({
          where: { deletedAt: null }
        }),
        client.pricing.count({
          where: { 
            isOnSale: true,
            deletedAt: null 
          }
        }),
        client.pricing.aggregate({
          where: { deletedAt: null },
          _avg: {
            finalPrice: true,
            discountPercentage: true
          }
        }),
        client.pricing.count({
          where: { 
            product: { category: 'KITCHEN' },
            deletedAt: null 
          }
        }),
        client.pricing.count({
          where: { 
            product: { category: 'BEDROOM' },
            deletedAt: null 
          }
        })
      ]);

      return {
        totalPricings,
        onSaleCount,
        averagePrice: aggregateData._avg.finalPrice || 0,
        averageDiscount: aggregateData._avg.discountPercentage || 0,
        totalRevenue: 0,
        kitchenCount,
        bedroomCount
      };
    } catch (error) {
      logger.error('Error getting pricing stats in repository', { error });
      throw error;
    }
  }

  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
    tx?: Prisma.TransactionClient
  ): Promise<Pricing[]> {
    try {
      const client = tx || this.prisma;
      return await client.pricing.findMany({
        where: {
          finalPrice: {
            gte: minPrice,
            lte: maxPrice
          },
          deletedAt: null
        },
        include: {
          product: true,
          variant: true
        },
        orderBy: { finalPrice: 'asc' }
      });
    } catch (error) {
      logger.error('Error finding pricing by price range in repository', { 
        error, 
        minPrice, 
        maxPrice 
      });
      throw error;
    }
  }

  async findExpiredSales(tx?: Prisma.TransactionClient): Promise<Pricing[]> {
    try {
      const client = tx || this.prisma;
      const now = new Date();

      return await client.pricing.findMany({
        where: {
          isOnSale: true,
          saleEndDate: { lt: now },
          deletedAt: null
        },
        include: {
          product: true,
          variant: true
        }
      });
    } catch (error) {
      logger.error('Error finding expired sales in repository', { error });
      throw error;
    }
  }

  async bulkCreate(
    data: Prisma.PricingCreateManyInput[],
    tx?: Prisma.TransactionClient
  ): Promise<Prisma.BatchPayload> {
    try {
      const client = tx || this.prisma;
      return await client.pricing.createMany({
        data,
        skipDuplicates: true
      });
    } catch (error) {
      logger.error('Error bulk creating pricing in repository', { error, data });
      throw error;
    }
  }

  async exists(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<boolean> {
    try {
      const client = tx || this.prisma;
      const count = await client.pricing.count({
        where: { 
          id,
          deletedAt: null
        }
      });
      return count > 0;
    } catch (error) {
      logger.error('Error checking pricing existence in repository', { error, id });
      throw error;
    }
  }

  async findLowestPrice(
    productId: string,
    tx?: Prisma.TransactionClient
  ): Promise<Pricing | null> {
    try {
      const client = tx || this.prisma;
      return await client.pricing.findFirst({
        where: { 
          productId,
          deletedAt: null
        },
        orderBy: { finalPrice: 'asc' },
        include: {
          product: true,
          variant: true
        }
      });
    } catch (error) {
      logger.error('Error finding lowest price in repository', { error, productId });
      throw error;
    }
  }

  async findHighestPrice(
    productId: string,
    tx?: Prisma.TransactionClient
  ): Promise<Pricing | null> {
    try {
      const client = tx || this.prisma;
      return await client.pricing.findFirst({
        where: { 
          productId,
          deletedAt: null
        },
        orderBy: { finalPrice: 'desc' },
        include: {
          product: true,
          variant: true
        }
      });
    } catch (error) {
      logger.error('Error finding highest price in repository', { error, productId });
      throw error;
    }
  }
}