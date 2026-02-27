import { PrismaClient, Inventory, Prisma } from '@prisma/client';
import { InventoryRepository } from './inventory.repository';
import { 
  CreateInventoryDto, 
  UpdateInventoryDto, 
  InventoryQueryDto,
  InventoryResponseDto,
  ReserveInventoryDto,
  AdjustInventoryDto,
  InventoryStatsDto
} from './inventory.types';
import { InventoryMapper } from './inventory.mapper';
import { 
  NotFoundError, 
  BadRequestError, 
  ConflictError 
} from '../../shared/errors';
import { EventProducer } from '../../infrastructure/messaging/event-producer';
import { INVENTORY_EVENTS } from './inventory.constants';
import { logger } from '../../shared/utils';

export class InventoryService {
  constructor(
    private readonly repository: InventoryRepository,
    private readonly eventProducer: EventProducer,
    private readonly prisma: PrismaClient
  ) {}

  async createInventory(dto: CreateInventoryDto): Promise<InventoryResponseDto> {
    try {
      const existingInventory = await this.repository.findByProductAndVariant(
        dto.productId,
        dto.variantId
      );

      if (existingInventory) {
        throw new ConflictError('Inventory already exists for this product variant');
      }

      const inventory = await this.repository.create({
        productId: dto.productId,
        variantId: dto.variantId,
        quantity: dto.quantity,
        reservedQuantity: 0,
        lowStockThreshold: dto.lowStockThreshold || 10,
        warehouseLocation: dto.warehouseLocation,
        sku: dto.sku,
        status: this.calculateInventoryStatus(dto.quantity, dto.lowStockThreshold || 10)
      });

      await this.eventProducer.publish(INVENTORY_EVENTS.CREATED, {
        inventoryId: inventory.id,
        productId: inventory.productId,
        variantId: inventory.variantId,
        quantity: inventory.quantity,
        timestamp: new Date().toISOString()
      });

      logger.info('Inventory created successfully', { inventoryId: inventory.id });

      return InventoryMapper.toResponse(inventory);
    } catch (error) {
      logger.error('Error creating inventory', { error, dto });
      throw error;
    }
  }

  async updateInventory(
    id: string, 
    dto: UpdateInventoryDto
  ): Promise<InventoryResponseDto> {
    try {
      const existing = await this.repository.findById(id);
      
      if (!existing) {
        throw new NotFoundError('Inventory not found');
      }

      const updateData: Prisma.InventoryUpdateInput = {
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.lowStockThreshold !== undefined && { 
          lowStockThreshold: dto.lowStockThreshold 
        }),
        ...(dto.warehouseLocation && { warehouseLocation: dto.warehouseLocation }),
        ...(dto.sku && { sku: dto.sku })
      };

      if (dto.quantity !== undefined) {
        updateData.status = this.calculateInventoryStatus(
          dto.quantity,
          dto.lowStockThreshold || existing.lowStockThreshold
        );
      }

      const updated = await this.repository.update(id, updateData);

      await this.eventProducer.publish(INVENTORY_EVENTS.UPDATED, {
        inventoryId: updated.id,
        productId: updated.productId,
        variantId: updated.variantId,
        previousQuantity: existing.quantity,
        newQuantity: updated.quantity,
        timestamp: new Date().toISOString()
      });

      logger.info('Inventory updated successfully', { inventoryId: id });

      return InventoryMapper.toResponse(updated);
    } catch (error) {
      logger.error('Error updating inventory', { error, id, dto });
      throw error;
    }
  }

  async getInventoryById(id: string): Promise<InventoryResponseDto> {
    try {
      const inventory = await this.repository.findById(id);
      
      if (!inventory) {
        throw new NotFoundError('Inventory not found');
      }

      return InventoryMapper.toResponse(inventory);
    } catch (error) {
      logger.error('Error fetching inventory', { error, id });
      throw error;
    }
  }

  async getInventoryByProduct(productId: string): Promise<InventoryResponseDto[]> {
    try {
      const inventories = await this.repository.findByProduct(productId);
      return inventories.map(InventoryMapper.toResponse);
    } catch (error) {
      logger.error('Error fetching inventory by product', { error, productId });
      throw error;
    }
  }

  async getInventoryBySku(sku: string): Promise<InventoryResponseDto> {
    try {
      const inventory = await this.repository.findBySku(sku);
      
      if (!inventory) {
        throw new NotFoundError('Inventory not found for SKU');
      }

      return InventoryMapper.toResponse(inventory);
    } catch (error) {
      logger.error('Error fetching inventory by SKU', { error, sku });
      throw error;
    }
  }

  async getInventoryByWarehouse(location: string): Promise<InventoryResponseDto[]> {
    try {
      const inventories = await this.repository.findByWarehouse(location);
      return inventories.map(InventoryMapper.toResponse);
    } catch (error) {
      logger.error('Error fetching inventory by warehouse', { error, location });
      throw error;
    }
  }

  async getAllInventory(query: InventoryQueryDto): Promise<{
    data: InventoryResponseDto[];
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

      const where: Prisma.InventoryWhereInput = {
        deletedAt: null,
        ...(query.status && { status: query.status }),
        ...(query.productId && { productId: query.productId }),
        ...(query.warehouseLocation && { 
          warehouseLocation: { contains: query.warehouseLocation, mode: 'insensitive' } 
        }),
        ...(query.search && {
          OR: [
            { sku: { contains: query.search, mode: 'insensitive' } },
            { warehouseLocation: { contains: query.search, mode: 'insensitive' } },
            { product: { name: { contains: query.search, mode: 'insensitive' } } }
          ]
        })
      };

      const [inventories, total] = await Promise.all([
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
        data: inventories.map(InventoryMapper.toResponse),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching all inventory', { error, query });
      throw error;
    }
  }

  async reserveInventory(dto: ReserveInventoryDto): Promise<InventoryResponseDto> {
    try {
      const inventory = await this.repository.findByProductAndVariant(
        dto.productId,
        dto.variantId
      );

      if (!inventory) {
        throw new NotFoundError('Inventory not found for product variant');
      }

      const availableQuantity = inventory.quantity - inventory.reservedQuantity;

      if (availableQuantity < dto.quantity) {
        throw new BadRequestError(
          `Insufficient inventory. Available: ${availableQuantity}, Requested: ${dto.quantity}`
        );
      }

      const updated = await this.repository.update(inventory.id, {
        reservedQuantity: inventory.reservedQuantity + dto.quantity
      });

      await this.eventProducer.publish(INVENTORY_EVENTS.RESERVED, {
        inventoryId: updated.id,
        productId: updated.productId,
        variantId: updated.variantId,
        quantity: dto.quantity,
        orderId: dto.orderId,
        timestamp: new Date().toISOString()
      });

      logger.info('Inventory reserved successfully', { 
        inventoryId: inventory.id, 
        quantity: dto.quantity,
        orderId: dto.orderId
      });

      return InventoryMapper.toResponse(updated);
    } catch (error) {
      logger.error('Error reserving inventory', { error, dto });
      throw error;
    }
  }

  async releaseInventory(dto: ReserveInventoryDto): Promise<InventoryResponseDto> {
    try {
      const inventory = await this.repository.findByProductAndVariant(
        dto.productId,
        dto.variantId
      );

      if (!inventory) {
        throw new NotFoundError('Inventory not found for product variant');
      }

      if (inventory.reservedQuantity < dto.quantity) {
        throw new BadRequestError(
          `Cannot release more than reserved. Reserved: ${inventory.reservedQuantity}, Requested: ${dto.quantity}`
        );
      }

      const updated = await this.repository.update(inventory.id, {
        reservedQuantity: inventory.reservedQuantity - dto.quantity
      });

      await this.eventProducer.publish(INVENTORY_EVENTS.RELEASED, {
        inventoryId: updated.id,
        productId: updated.productId,
        variantId: updated.variantId,
        quantity: dto.quantity,
        orderId: dto.orderId,
        timestamp: new Date().toISOString()
      });

      logger.info('Inventory released successfully', { 
        inventoryId: inventory.id, 
        quantity: dto.quantity,
        orderId: dto.orderId
      });

      return InventoryMapper.toResponse(updated);
    } catch (error) {
      logger.error('Error releasing inventory', { error, dto });
      throw error;
    }
  }

  async decrementInventory(dto: AdjustInventoryDto): Promise<InventoryResponseDto> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const inventory = await this.repository.findByProductAndVariant(
          dto.productId,
          dto.variantId,
          tx
        );

        if (!inventory) {
          throw new NotFoundError('Inventory not found for product variant');
        }

        if (inventory.quantity < dto.quantity) {
          throw new BadRequestError(
            `Insufficient inventory. Available: ${inventory.quantity}, Requested: ${dto.quantity}`
          );
        }

        const newQuantity = inventory.quantity - dto.quantity;
        const newReservedQuantity = Math.max(0, inventory.reservedQuantity - dto.quantity);

        const updated = await this.repository.update(
          inventory.id,
          {
            quantity: newQuantity,
            reservedQuantity: newReservedQuantity,
            status: this.calculateInventoryStatus(newQuantity, inventory.lowStockThreshold)
          },
          tx
        );

        await this.eventProducer.publish(INVENTORY_EVENTS.DECREMENTED, {
          inventoryId: updated.id,
          productId: updated.productId,
          variantId: updated.variantId,
          quantity: dto.quantity,
          newQuantity: updated.quantity,
          reason: dto.reason,
          timestamp: new Date().toISOString()
        });

        logger.info('Inventory decremented successfully', { 
          inventoryId: inventory.id, 
          quantity: dto.quantity,
          reason: dto.reason
        });

        return InventoryMapper.toResponse(updated);
      });
    } catch (error) {
      logger.error('Error decrementing inventory', { error, dto });
      throw error;
    }
  }

  async incrementInventory(dto: AdjustInventoryDto): Promise<InventoryResponseDto> {
    try {
      const inventory = await this.repository.findByProductAndVariant(
        dto.productId,
        dto.variantId
      );

      if (!inventory) {
        throw new NotFoundError('Inventory not found for product variant');
      }

      const newQuantity = inventory.quantity + dto.quantity;

      const updated = await this.repository.update(inventory.id, {
        quantity: newQuantity,
        status: this.calculateInventoryStatus(newQuantity, inventory.lowStockThreshold)
      });

      await this.eventProducer.publish(INVENTORY_EVENTS.INCREMENTED, {
        inventoryId: updated.id,
        productId: updated.productId,
        variantId: updated.variantId,
        quantity: dto.quantity,
        newQuantity: updated.quantity,
        reason: dto.reason,
        timestamp: new Date().toISOString()
      });

      logger.info('Inventory incremented successfully', { 
        inventoryId: inventory.id, 
        quantity: dto.quantity,
        reason: dto.reason
      });

      return InventoryMapper.toResponse(updated);
    } catch (error) {
      logger.error('Error incrementing inventory', { error, dto });
      throw error;
    }
  }

  async getLowStockItems(): Promise<InventoryResponseDto[]> {
    try {
      const inventories = await this.repository.findLowStock();
      return inventories.map(InventoryMapper.toResponse);
    } catch (error) {
      logger.error('Error fetching low stock items', { error });
      throw error;
    }
  }

  async getOutOfStockItems(): Promise<InventoryResponseDto[]> {
    try {
      const inventories = await this.repository.findOutOfStock();
      return inventories.map(InventoryMapper.toResponse);
    } catch (error) {
      logger.error('Error fetching out of stock items', { error });
      throw error;
    }
  }

  async getReservedItems(): Promise<InventoryResponseDto[]> {
    try {
      const inventories = await this.repository.findReservedItems();
      return inventories.map(InventoryMapper.toResponse);
    } catch (error) {
      logger.error('Error fetching reserved items', { error });
      throw error;
    }
  }

  async getInventoryStats(): Promise<InventoryStatsDto> {
    try {
      const stats = await this.repository.getInventoryStats();
      
      return {
        totalItems: stats.totalItems,
        lowStockItems: stats.lowStockItems,
        outOfStockItems: stats.outOfStockItems,
        inStockItems: stats.inStockItems,
        totalQuantity: stats.totalQuantity,
        totalReserved: stats.totalReserved,
        availableQuantity: stats.totalQuantity - stats.totalReserved
      };
    } catch (error) {
      logger.error('Error fetching inventory stats', { error });
      throw error;
    }
  }

  async deleteInventory(id: string): Promise<void> {
    try {
      const existing = await this.repository.findById(id);
      
      if (!existing) {
        throw new NotFoundError('Inventory not found');
      }

      if (existing.reservedQuantity > 0) {
        throw new BadRequestError('Cannot delete inventory with reserved items');
      }

      await this.repository.softDelete(id);

      await this.eventProducer.publish(INVENTORY_EVENTS.DELETED, {
        inventoryId: id,
        productId: existing.productId,
        variantId: existing.variantId,
        timestamp: new Date().toISOString()
      });

      logger.info('Inventory deleted successfully', { inventoryId: id });
    } catch (error) {
      logger.error('Error deleting inventory', { error, id });
      throw error;
    }
  }

  private calculateInventoryStatus(
    quantity: number, 
    lowStockThreshold: number
  ): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
    if (quantity === 0) return 'OUT_OF_STOCK';
    if (quantity <= lowStockThreshold) return 'LOW_STOCK';
    return 'IN_STOCK';
  }
}