import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { PricingService } from './pricing.service';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('pricing')
@Controller('pricing')
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  @ApiOperation({ summary: 'Get all pricing records' })
  @SwaggerApiResponse({ status: 200, description: 'Pricing records retrieved successfully' })
  async findAll(@Query('productId') productId?: string): Promise<ApiResponse<any[]>> {
    const pricing = await this.pricingService.findAll(productId);
    return {
      success: true,
      data: pricing,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pricing record by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Pricing record retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const pricing = await this.pricingService.findById(id);
    if (!pricing) {
      return {
        success: false,
        message: 'Pricing record not found',
        error: 'PRICING_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: pricing,
    };
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get pricing by product ID' })
  @SwaggerApiResponse({ status: 200, description: 'Product pricing retrieved successfully' })
  async findByProduct(@Param('productId') productId: string): Promise<ApiResponse<any[]>> {
    const pricing = await this.pricingService.findByProduct(productId);
    return {
      success: true,
      data: pricing,
    };
  }

  @Get('product/:productId/current')
  @ApiOperation({ summary: 'Get current pricing for product' })
  @SwaggerApiResponse({ status: 200, description: 'Current pricing retrieved successfully' })
  async getCurrentPricing(@Param('productId') productId: string): Promise<ApiResponse<any>> {
    const pricing = await this.pricingService.getCurrentPricing(productId);
    if (!pricing) {
      return {
        success: false,
        message: 'No pricing found for product',
        error: 'NO_PRICING_FOUND',
      };
    }
    return {
      success: true,
      data: pricing,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new pricing record' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Pricing record created successfully' })
  async create(@Body() createPricingDto: CreatePricingDto): Promise<ApiResponse<any>> {
    const pricing = await this.pricingService.create(createPricingDto);
    return {
      success: true,
      data: pricing,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update pricing record' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Pricing record updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updatePricingDto: UpdatePricingDto
  ): Promise<ApiResponse<any>> {
    const pricing = await this.pricingService.update(id, updatePricingDto);
    if (!pricing) {
      return {
        success: false,
        message: 'Pricing record not found',
        error: 'PRICING_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: pricing,
    };
  }

  @Post(':id/bulk-update')
  @ApiOperation({ summary: 'Bulk update pricing' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Pricing updated successfully' })
  async bulkUpdate(
    @Param('id') id: string,
    @Body() body: { price: number; salePrice?: number; reason: string }
  ): Promise<ApiResponse<any>> {
    const pricing = await this.pricingService.bulkUpdate(id, body.price, body.salePrice, body.reason);
    if (!pricing) {
      return {
        success: false,
        message: 'Pricing record not found',
        error: 'PRICING_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: pricing,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete pricing record' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @SwaggerApiResponse({ status: 200, description: 'Pricing record deleted successfully' })
  async remove(@Param('id') id: string): Promise<ApiResponse<void>> {
    await this.pricingService.remove(id);
    return {
      success: true,
      data: undefined,
      message: 'Pricing record deleted successfully',
    };
  }
}
