import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @SwaggerApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const orders = await this.ordersService.findAll({ page, limit, status, userId, user });
    return {
      success: true,
      data: orders,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Order retrieved successfully' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const order = await this.ordersService.findById(id, user);
    if (!order) {
      return {
        success: false,
        message: 'Order not found',
        error: 'ORDER_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: order,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new order' })
  @SwaggerApiResponse({ status: 201, description: 'Order created successfully' })
  async create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const order = await this.ordersService.create(createOrderDto, user);
    return {
      success: true,
      data: order,
    };
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Order status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto
  ): Promise<ApiResponse<any>> {
    const order = await this.ordersService.updateStatus(id, updateStatusDto);
    if (!order) {
      return {
        success: false,
        message: 'Order not found',
        error: 'ORDER_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: order,
    };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @SwaggerApiResponse({ status: 200, description: 'Order cancelled successfully' })
  async cancel(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const order = await this.ordersService.cancel(id, user);
    if (!order) {
      return {
        success: false,
        message: 'Order not found or cannot be cancelled',
        error: 'ORDER_NOT_FOUND_OR_NOT_CANCELLABLE',
      };
    }
    return {
      success: true,
      data: order,
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get orders by user ID' })
  @SwaggerApiResponse({ status: 200, description: 'User orders retrieved successfully' })
  async findByUser(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const orders = await this.ordersService.findByUser(userId, { page, limit }, user);
    return {
      success: true,
      data: orders,
    };
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get order tracking information' })
  @SwaggerApiResponse({ status: 200, description: 'Order tracking retrieved successfully' })
  async getTracking(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const tracking = await this.ordersService.getTracking(id, user);
    if (!tracking) {
      return {
        success: false,
        message: 'Order not found',
        error: 'ORDER_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: tracking,
    };
  }
}
