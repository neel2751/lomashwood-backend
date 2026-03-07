import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all inventory records' })
  @SwaggerApiResponse({ status: 200, description: 'Inventory records retrieved successfully' })
  async findAll(@Query('productId') productId?: string): Promise<ApiResponse<any[]>> {
    const inventory = await this.inventoryService.findAll(productId);
    return {
      success: true,
      data: inventory,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory record by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Inventory record retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const inventory = await this.inventoryService.findById(id);
    if (!inventory) {
      return {
        success: false,
        message: 'Inventory record not found',
        error: 'INVENTORY_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: inventory,
    };
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get inventory by product ID' })
  @SwaggerApiResponse({ status: 200, description: 'Product inventory retrieved successfully' })
  async findByProduct(@Param('productId') productId: string): Promise<ApiResponse<any[]>> {
    const inventory = await this.inventoryService.findByProduct(productId);
    return {
      success: true,
      data: inventory,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new inventory record' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Inventory record created successfully' })
  async create(@Body() createInventoryDto: CreateInventoryDto): Promise<ApiResponse<any>> {
    const inventory = await this.inventoryService.create(createInventoryDto);
    return {
      success: true,
      data: inventory,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update inventory record' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Inventory record updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto
  ): Promise<ApiResponse<any>> {
    const inventory = await this.inventoryService.update(id, updateInventoryDto);
    if (!inventory) {
      return {
        success: false,
        message: 'Inventory record not found',
        error: 'INVENTORY_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: inventory,
    };
  }

  @Post(':id/adjust')
  @ApiOperation({ summary: 'Adjust inventory quantity' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Inventory adjusted successfully' })
  async adjust(
    @Param('id') id: string,
    @Body() body: { quantity: number; reason: string }
  ): Promise<ApiResponse<any>> {
    const inventory = await this.inventoryService.adjustQuantity(id, body.quantity, body.reason);
    if (!inventory) {
      return {
        success: false,
        message: 'Inventory record not found',
        error: 'INVENTORY_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: inventory,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete inventory record' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @SwaggerApiResponse({ status: 200, description: 'Inventory record deleted successfully' })
  async remove(@Param('id') id: string): Promise<ApiResponse<void>> {
    await this.inventoryService.remove(id);
    return {
      success: true,
      data: undefined,
      message: 'Inventory record deleted successfully',
    };
  }
}
