import { Inventory } from '@prisma/client';
import { 
  InventoryResponseDto,
  ProductBasicInfo,
  VariantBasicInfo,
  ColourBasicInfo,
  SizeBasicInfo,
  InventoryStatsDto,
  LowStockAlertDto,
  InventoryHistoryDto,
  InventoryAvailabilityResponseDto,
  StockMovementDto,
  InventoryValuationDto
} from './inventory.types';

export class InventoryMapper {
  static toResponse(inventory: any): InventoryResponseDto {
    const availableQuantity = inventory.quantity - inventory.reservedQuantity;

    return {
      id: inventory.id,
      productId: inventory.productId,
      variantId: inventory.variantId,
      quantity: inventory.quantity,
      reservedQuantity: inventory.reservedQuantity,
      availableQuantity,
      lowStockThreshold: inventory.lowStockThreshold,
      warehouseLocation: inventory.warehouseLocation,
      sku: inventory.sku,
      status: inventory.status,
      product: inventory.product ? this.toProductBasicInfo(inventory.product) : undefined,
      variant: inventory.variant ? this.toVariantBasicInfo(inventory.variant) : undefined,
      createdAt: inventory.createdAt,
      updatedAt: inventory.updatedAt
    };
  }

  static toProductBasicInfo(product: any): ProductBasicInfo {
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      sku: product.sku,
      images: product.images || []
    };
  }

  static toVariantBasicInfo(variant: any): VariantBasicInfo {
    return {
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      price: variant.price,
      colour: variant.colour ? this.toColourBasicInfo(variant.colour) : undefined,
      size: variant.size ? this.toSizeBasicInfo(variant.size) : undefined
    };
  }

  static toColourBasicInfo(colour: any): ColourBasicInfo {
    return {
      id: colour.id,
      name: colour.name,
      hexCode: colour.hexCode
    };
  }

  static toSizeBasicInfo(size: any): SizeBasicInfo {
    return {
      id: size.id,
      title: size.title,
      description: size.description
    };
  }

  static toResponseList(inventories: any[]): InventoryResponseDto[] {
    return inventories.map(inventory => this.toResponse(inventory));
  }

  static toStatsResponse(stats: {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    inStockItems: number;
    totalQuantity: number;
    totalReserved: number;
  }): InventoryStatsDto {
    return {
      totalItems: stats.totalItems,
      lowStockItems: stats.lowStockItems,
      outOfStockItems: stats.outOfStockItems,
      inStockItems: stats.inStockItems,
      totalQuantity: stats.totalQuantity,
      totalReserved: stats.totalReserved,
      availableQuantity: stats.totalQuantity - stats.totalReserved
    };
  }

  static toLowStockAlert(inventory: any): LowStockAlertDto {
    const availableQuantity = inventory.quantity - inventory.reservedQuantity;

    return {
      inventoryId: inventory.id,
      productId: inventory.productId,
      productName: inventory.product?.name || 'Unknown Product',
      variantId: inventory.variantId,
      variantTitle: inventory.variant?.title || 'Unknown Variant',
      currentQuantity: inventory.quantity,
      lowStockThreshold: inventory.lowStockThreshold,
      availableQuantity,
      warehouseLocation: inventory.warehouseLocation,
      sku: inventory.sku,
      status: inventory.status
    };
  }

  static toLowStockAlertList(inventories: any[]): LowStockAlertDto[] {
    return inventories.map(inventory => this.toLowStockAlert(inventory));
  }

  static toAvailabilityResponse(
    available: boolean,
    requestedQuantity: number,
    availableQuantity: number,
    productId: string,
    variantId: string
  ): InventoryAvailabilityResponseDto {
    return {
      available,
      requestedQuantity,
      availableQuantity,
      productId,
      variantId
    };
  }

  static toHistoryDto(history: any): InventoryHistoryDto {
    return {
      id: history.id,
      inventoryId: history.inventoryId,
      actionType: history.actionType,
      previousQuantity: history.previousQuantity,
      newQuantity: history.newQuantity,
      previousReservedQuantity: history.previousReservedQuantity,
      newReservedQuantity: history.newReservedQuantity,
      reason: history.reason,
      performedBy: history.performedBy,
      metadata: history.metadata,
      createdAt: history.createdAt
    };
  }

  static toHistoryList(histories: any[]): InventoryHistoryDto[] {
    return histories.map(history => this.toHistoryDto(history));
  }

  static toStockMovement(movement: any): StockMovementDto {
    return {
      inventoryId: movement.inventoryId,
      productId: movement.productId,
      variantId: movement.variantId,
      movementType: movement.movementType,
      quantity: movement.quantity,
      fromLocation: movement.fromLocation,
      toLocation: movement.toLocation,
      reference: movement.reference,
      reason: movement.reason,
      performedBy: movement.performedBy,
      timestamp: movement.timestamp
    };
  }

  static toStockMovementList(movements: any[]): StockMovementDto[] {
    return movements.map(movement => this.toStockMovement(movement));
  }

  static toValuationDto(data: {
    totalValue: number;
    totalQuantity: number;
    breakdown: any[];
  }): InventoryValuationDto {
    return {
      totalValue: data.totalValue,
      totalQuantity: data.totalQuantity,
      averageValue: data.totalQuantity > 0 ? data.totalValue / data.totalQuantity : 0,
      breakdown: data.breakdown.map(item => ({
        category: item.category,
        quantity: item.quantity,
        value: item.value
      }))
    };
  }

  static toPaginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ): {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } {
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static toMinimalResponse(inventory: any): {
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    availableQuantity: number;
    status: string;
  } {
    return {
      id: inventory.id,
      productId: inventory.productId,
      variantId: inventory.variantId,
      quantity: inventory.quantity,
      availableQuantity: inventory.quantity - inventory.reservedQuantity,
      status: inventory.status
    };
  }

  static toMinimalResponseList(inventories: any[]): {
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    availableQuantity: number;
    status: string;
  }[] {
    return inventories.map(inventory => this.toMinimalResponse(inventory));
  }

  static toDetailedResponse(inventory: any): InventoryResponseDto & {
    productDetails?: any;
    variantDetails?: any;
    movementHistory?: any[];
    lastRestocked?: Date;
    lastSold?: Date;
  } {
    const baseResponse = this.toResponse(inventory);

    return {
      ...baseResponse,
      productDetails: inventory.product,
      variantDetails: inventory.variant,
      movementHistory: inventory.movementHistory || [],
      lastRestocked: inventory.lastRestocked,
      lastSold: inventory.lastSold
    };
  }

  static toExportFormat(inventories: any[]): any[] {
    return inventories.map(inventory => ({
      'Inventory ID': inventory.id,
      'Product ID': inventory.productId,
      'Product Name': inventory.product?.name || 'N/A',
      'Variant ID': inventory.variantId,
      'Variant Title': inventory.variant?.title || 'N/A',
      'SKU': inventory.sku || 'N/A',
      'Quantity': inventory.quantity,
      'Reserved': inventory.reservedQuantity,
      'Available': inventory.quantity - inventory.reservedQuantity,
      'Low Stock Threshold': inventory.lowStockThreshold,
      'Warehouse': inventory.warehouseLocation || 'N/A',
      'Status': inventory.status,
      'Category': inventory.product?.category || 'N/A',
      'Created At': inventory.createdAt.toISOString(),
      'Updated At': inventory.updatedAt.toISOString()
    }));
  }

  static toCSVFormat(inventories: any[]): string {
    const headers = [
      'Inventory ID',
      'Product ID',
      'Product Name',
      'Variant ID',
      'Variant Title',
      'SKU',
      'Quantity',
      'Reserved',
      'Available',
      'Low Stock Threshold',
      'Warehouse',
      'Status',
      'Category',
      'Created At',
      'Updated At'
    ];

    const rows = inventories.map(inventory => [
      inventory.id,
      inventory.productId,
      inventory.product?.name || 'N/A',
      inventory.variantId,
      inventory.variant?.title || 'N/A',
      inventory.sku || 'N/A',
      inventory.quantity,
      inventory.reservedQuantity,
      inventory.quantity - inventory.reservedQuantity,
      inventory.lowStockThreshold,
      inventory.warehouseLocation || 'N/A',
      inventory.status,
      inventory.product?.category || 'N/A',
      inventory.createdAt.toISOString(),
      inventory.updatedAt.toISOString()
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }
}