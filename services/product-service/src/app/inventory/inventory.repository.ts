import { PrismaClient, Inventory, Prisma } from '@prisma/client';
import { logger } from '../../shared/utils';

export class InventoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    data: Prisma.InventoryCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Inventory> {
    try {
      const client = tx || this.prisma;
      return await client.inventory.create({
        data,
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
      logger.error('Error creating inventory in repository', { error, data });
      throw error;
    }
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<Inventory | null> {
    try {
      const client = tx || this.prisma;
      return await client.inventory.findUnique({
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
              price: true,
              colour: true,
              size: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error finding inventory by id in repository', { error, id });
      throw error;
    }
  }

  async findByProduct(
    productId: string,
    tx?: Prisma.TransactionClient
  ): Promise<Inventory[]> {
    try {
      const client = tx || this.prisma;
      return await client.inventory.findMany({
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
              sku: true
            }
          },
          variant: {
            select: {
              id: true,
              title: true,
              sku: true,
              price: true,
              colour: true,
              size: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      logger.error('Error finding inventory by product in repository', { 
        error, 
        productId 
      });
      throw error;
    }
  }

  async findByProductAndVariant(
    productId: string,
    variantId: string,
    tx?: Prisma.TransactionClient
  ): Promise<Inventory | null> {
    try {
      const client = tx || this.prisma;
      return await client.inventory.findFirst({
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
              sku: true,
              price: true,
              colour: true,
              size: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error finding inventory by product and variant in repository', { 
        error, 
        productId,
        variantId 
      });
      throw error;
    }
  }

  async findMany(
    params: {
      where?: Prisma.InventoryWhereInput;
      skip?: number;
      take?: number;
      orderBy?: Prisma.InventoryOrderByWithRelationInput;
    },
    tx?: Prisma.TransactionClient
  ): Promise<Inventory[]> {
    try {
      const client = tx || this.prisma;
      const { where, skip, take, orderBy } = params;

      return await client.inventory.findMany({
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
              price: true,
              colour: true,
              size: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error finding many inventories in repository', { error, params });
      throw error;
    }
  }

  async count(
    where?: Prisma.InventoryWhereInput,
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    try {
      const client = tx || this.prisma;
      return await client.inventory.count({ 
        where: {
          ...where,
          deletedAt: null
        }
      });
    } catch (error) {
      logger.error('Error counting inventories in repository', { error, where });
      throw error;
    }
  }

  async update(
    id: string,
    data: Prisma.InventoryUpdateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Inventory> {
    try {
      const client = tx || this.prisma;
      return await client.inventory.update({
        where: { id },
        data,
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
              sku: true,
              price: true,
              colour: true,
              size: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error updating inventory in repository', { error, id, data });
      throw error;
    }
  }

  async updateMany(
    where: Prisma.InventoryWhereInput,
    data: Prisma.InventoryUpdateManyMutationInput,
    tx?: Prisma.TransactionClient
  ): Promise<Prisma.BatchPayload> {
    try {
      const client = tx || this.prisma;
      return await client.inventory.updateMany({
        where: {
          ...where,
          deletedAt: null
        },
        data
      });
    } catch (error) {
      logger.error('Error updating many inventories in repository', { 
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
  ): Promise<Inventory> {
    try {
      const client = tx || this.prisma;
      return await client.inventory.delete({
        where: { id }
      });
    } catch (error) {
      logger.error('Error deleting inventory in repository', { error, id });
      throw error;
    }
  }

  async softDelete(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<Inventory> {
    try {
      const client = tx || this.prisma;
      return await client.inventory.update({
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
      logger.error('Error soft deleting inventory in repository', { error, id });
      throw error;
    }
  }

  async findLowStock(tx?: Prisma.TransactionClient): Promise<Inventory[]> {
    try {
      const client = tx || this.prisma;
      return await client.inventory.findMany({
        where: {
          status: 'LOW_STOCK',
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
              price: true,
              colour: true,
              size: true
            }
          }
        },
        orderBy: { quantity: 'asc' }
      });
    } catch (error) {
      logger.error('Error finding low stock items in repository', { error });
      throw error;
    }
  }

  async findOutOfStock(tx?: Prisma.TransactionClient): Promise<Inventory[]> {
    try {
      const client = tx || this.prisma;
      return await client.inventory.findMany({
        where: {
          status: 'OUT_OF_STOCK',
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
              price: true,
              colour: true,
              size: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
    } catch (error) {
      logger.error('Error finding out of stock items in repository', { error });
      throw error;
    }
  }

  async findByWarehouse(
    warehouseLocation: string,
    tx?: Prisma.TransactionClient
  ): Promise<Inventory[]> {
    try {
      const client = tx || this.prisma;
      return await client.inventory.findMany({
        where: {
          warehouseLocation,
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
              price: true,
              colour: true,
              size: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      logger.error('Error finding inventory by warehouse in repository', { 
        error, 
        warehouseLocation 
      });
      throw error;
    }
  }

  async findBySku(
    sku: string,
    tx?: Prisma.TransactionClient
  ): Promise<Inventory | null> {
    try {
      const client = tx || this.prisma;
      return await client.inventory.findFirst({
        where: { 
          sku,
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
              price: true,
              colour: true,
              size: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error finding inventory by SKU in repository', { error, sku });
      throw error;
    }
  }

  async bulkCreate(
    data: Prisma.InventoryCreateManyInput[],
    tx?: Prisma.TransactionClient
  ): Promise<Prisma.BatchPayload> {
    try {
      const client = tx || this.prisma;
      return await client.inventory.createMany({
        data,
        skipDuplicates: true
      });
    } catch (error) {
      logger.error('Error bulk creating inventory in repository', { error, data });
      throw error;
    }
  }

  async getTotalInventoryValue(tx?: Prisma.TransactionClient): Promise<number> {
    try {
      const client = tx || this.prisma;
      const result = await client.inventory.aggregate({
        where: {
          deletedAt: null
        },
        _sum: {
          quantity: true
        }
      });

      return result._sum.quantity || 0;
    } catch (error) {
      logger.error('Error getting total inventory value in repository', { error });
      throw error;
    }
  }

  async getInventoryStats(tx?: Prisma.TransactionClient): Promise<{
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    inStockItems: number;
    totalQuantity: number;
    totalReserved: number;
  }> {
    try {
      const client = tx || this.prisma;

      const [
        totalItems,
        lowStockItems,
        outOfStockItems,
        inStockItems,
        aggregateData
      ] = await Promise.all([
        client.inventory.count({
          where: { deletedAt: null }
        }),
        client.inventory.count({
          where: { 
            status: 'LOW_STOCK',
            deletedAt: null 
          }
        }),
        client.inventory.count({
          where: { 
            status: 'OUT_OF_STOCK',
            deletedAt: null 
          }
        }),
        client.inventory.count({
          where: { 
            status: 'IN_STOCK',
            deletedAt: null 
          }
        }),
        client.inventory.aggregate({
          where: { deletedAt: null },
          _sum: {
            quantity: true,
            reservedQuantity: true
          }
        })
      ]);

      return {
        totalItems,
        lowStockItems,
        outOfStockItems,
        inStockItems,
        totalQuantity: aggregateData._sum.quantity || 0,
        totalReserved: aggregateData._sum.reservedQuantity || 0
      };
    } catch (error) {
      logger.error('Error getting inventory stats in repository', { error });
      throw error;
    }
  }

  async findReservedItems(tx?: Prisma.TransactionClient): Promise<Inventory[]> {
    try {
      const client = tx || this.prisma;
      return await client.inventory.findMany({
        where: {
          reservedQuantity: {
            gt: 0
          },
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
              price: true,
              colour: true,
              size: true
            }
          }
        },
        orderBy: { reservedQuantity: 'desc' }
      });
    } catch (error) {
      logger.error('Error finding reserved items in repository', { error });
      throw error;
    }
  }

  async exists(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<boolean> {
    try {
      const client = tx || this.prisma;
      const count = await client.inventory.count({
        where: { 
          id,
          deletedAt: null
        }
      });
      return count > 0;
    } catch (error) {
      logger.error('Error checking inventory existence in repository', { error, id });
      throw error;
    }
  }

  async checkAvailability(
    productId: string,
    variantId: string,
    quantity: number,
    tx?: Prisma.TransactionClient
  ): Promise<boolean> {
    try {
      const client = tx || this.prisma;
      const inventory = await client.inventory.findFirst({
        where: {
          productId,
          variantId,
          deletedAt: null
        }
      });

      if (!inventory) return false;

      const availableQuantity = inventory.quantity - inventory.reservedQuantity;
      return availableQuantity >= quantity;
    } catch (error) {
      logger.error('Error checking inventory availability in repository', { 
        error, 
        productId, 
        variantId, 
        quantity 
      });
      throw error;
    }
  }
}