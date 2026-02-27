import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import { 
  CreateInventoryDto, 
  UpdateInventoryDto, 
  InventoryQueryDto,
  ReserveInventoryDto,
  AdjustInventoryDto
} from './inventory.types';
import { 
  successResponse, 
  createdResponse, 
  noContentResponse 
} from '../../utils/response';
import { logger } from '../../shared/utils';

export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  async createInventory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto: CreateInventoryDto = req.body;
      
      const inventory = await this.service.createInventory(dto);
      
      createdResponse(res, inventory, 'Inventory created successfully');
    } catch (error) {
      logger.error('Error in createInventory controller', { error, body: req.body });
      next(error);
    }
  }

  async updateInventory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdateInventoryDto = req.body;
      
      const inventory = await this.service.updateInventory(id, dto);
      
      successResponse(res, inventory, 'Inventory updated successfully');
    } catch (error) {
      logger.error('Error in updateInventory controller', { 
        error, 
        id: req.params.id, 
        body: req.body 
      });
      next(error);
    }
  }

  async getInventoryById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      
      const inventory = await this.service.getInventoryById(id);
      
      successResponse(res, inventory, 'Inventory retrieved successfully');
    } catch (error) {
      logger.error('Error in getInventoryById controller', { 
        error, 
        id: req.params.id 
      });
      next(error);
    }
  }

  async getInventoryByProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { productId } = req.params;
      
      const inventories = await this.service.getInventoryByProduct(productId);
      
      successResponse(
        res, 
        inventories, 
        'Product inventory retrieved successfully'
      );
    } catch (error) {
      logger.error('Error in getInventoryByProduct controller', { 
        error, 
        productId: req.params.productId 
      });
      next(error);
    }
  }

  async getInventoryBySku(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { sku } = req.params;
      
      const inventory = await this.service.getInventoryBySku(sku);
      
      successResponse(res, inventory, 'Inventory retrieved successfully');
    } catch (error) {
      logger.error('Error in getInventoryBySku controller', { 
        error, 
        sku: req.params.sku 
      });
      next(error);
    }
  }

  async getInventoryByWarehouse(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { location } = req.params;
      
      const inventories = await this.service.getInventoryByWarehouse(location);
      
      successResponse(
        res, 
        inventories, 
        'Warehouse inventory retrieved successfully'
      );
    } catch (error) {
      logger.error('Error in getInventoryByWarehouse controller', { 
        error, 
        location: req.params.location 
      });
      next(error);
    }
  }

  async getAllInventory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query: InventoryQueryDto = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        status: req.query.status as any,
        productId: req.query.productId as string,
        warehouseLocation: req.query.warehouseLocation as string,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      };
      
      const result = await this.service.getAllInventory(query);
      
      successResponse(res, result, 'Inventory list retrieved successfully');
    } catch (error) {
      logger.error('Error in getAllInventory controller', { 
        error, 
        query: req.query 
      });
      next(error);
    }
  }

  async reserveInventory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto: ReserveInventoryDto = req.body;
      
      const inventory = await this.service.reserveInventory(dto);
      
      successResponse(res, inventory, 'Inventory reserved successfully');
    } catch (error) {
      logger.error('Error in reserveInventory controller', { 
        error, 
        body: req.body 
      });
      next(error);
    }
  }

  async releaseInventory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto: ReserveInventoryDto = req.body;
      
      const inventory = await this.service.releaseInventory(dto);
      
      successResponse(res, inventory, 'Inventory released successfully');
    } catch (error) {
      logger.error('Error in releaseInventory controller', { 
        error, 
        body: req.body 
      });
      next(error);
    }
  }

  async incrementInventory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto: AdjustInventoryDto = req.body;
      
      const inventory = await this.service.incrementInventory(dto);
      
      successResponse(res, inventory, 'Inventory incremented successfully');
    } catch (error) {
      logger.error('Error in incrementInventory controller', { 
        error, 
        body: req.body 
      });
      next(error);
    }
  }

  async decrementInventory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto: AdjustInventoryDto = req.body;
      
      const inventory = await this.service.decrementInventory(dto);
      
      successResponse(res, inventory, 'Inventory decremented successfully');
    } catch (error) {
      logger.error('Error in decrementInventory controller', { 
        error, 
        body: req.body 
      });
      next(error);
    }
  }

  async getLowStockItems(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const inventories = await this.service.getLowStockItems();
      
      successResponse(res, inventories, 'Low stock items retrieved successfully');
    } catch (error) {
      logger.error('Error in getLowStockItems controller', { error });
      next(error);
    }
  }

  async getOutOfStockItems(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const inventories = await this.service.getOutOfStockItems();
      
      successResponse(res, inventories, 'Out of stock items retrieved successfully');
    } catch (error) {
      logger.error('Error in getOutOfStockItems controller', { error });
      next(error);
    }
  }

  async getReservedItems(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const inventories = await this.service.getReservedItems();
      
      successResponse(res, inventories, 'Reserved items retrieved successfully');
    } catch (error) {
      logger.error('Error in getReservedItems controller', { error });
      next(error);
    }
  }

  async getInventoryStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await this.service.getInventoryStats();
      
      successResponse(res, stats, 'Inventory stats retrieved successfully');
    } catch (error) {
      logger.error('Error in getInventoryStats controller', { error });
      next(error);
    }
  }

  async deleteInventory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      
      await this.service.deleteInventory(id);
      
      noContentResponse(res);
    } catch (error) {
      logger.error('Error in deleteInventory controller', { 
        error, 
        id: req.params.id 
      });
      next(error);
    }
  }
}