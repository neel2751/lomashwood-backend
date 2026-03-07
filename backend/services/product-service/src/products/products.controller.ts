import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/common/decorators/current-user.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @SwaggerApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async findAll(@Query() filterDto: FilterProductDto): Promise<ApiResponse<any[]>> {
    const products = await this.productsService.findAll(filterDto);
    return {
      success: true,
      data: products,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @SwaggerApiResponse({ status: 200, description: 'Search results' })
  async search(@Query('q') query: string): Promise<ApiResponse<any[]>> {
    const products = await this.productsService.search(query);
    return {
      success: true,
      data: products,
    };
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @SwaggerApiResponse({ status: 200, description: 'Featured products retrieved successfully' })
  async getFeatured(): Promise<ApiResponse<any[]>> {
    const products = await this.productsService.getFeatured();
    return {
      success: true,
      data: products,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Product retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const product = await this.productsService.findById(id);
    if (!product) {
      return {
        success: false,
        message: 'Product not found',
        errors: [{ field: 'general', message: 'Product not found' }],
      };
    }
    return {
      success: true,
      data: product,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new product' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Product created successfully' })
  async create(@Body() createProductDto: CreateProductDto): Promise<ApiResponse<any>> {
    const product = await this.productsService.create(createProductDto);
    return {
      success: true,
      data: product,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Product updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto
  ): Promise<ApiResponse<any>> {
    const product = await this.productsService.update(id, updateProductDto);
    if (!product) {
      return {
        success: false,
        message: 'Product not found',
        errors: [{ field: 'general', message: 'Product not found' }],
      };
    }
    return {
      success: true,
      data: product,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @SwaggerApiResponse({ status: 200, description: 'Product deleted successfully' })
  async remove(@Param('id') id: string): Promise<ApiResponse<void>> {
    await this.productsService.remove(id);
    return {
      success: true,
      data: undefined,
      message: 'Product deleted successfully',
    };
  }

  @Post(':id/toggle-featured')
  @ApiOperation({ summary: 'Toggle product featured status' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Product featured status toggled' })
  async toggleFeatured(@Param('id') id: string): Promise<ApiResponse<any>> {
    const product = await this.productsService.toggleFeatured(id);
    return {
      success: true,
      data: product,
    };
  }

  @Post(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle product active status' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Product status toggled' })
  async toggleStatus(@Param('id') id: string): Promise<ApiResponse<any>> {
    const product = await this.productsService.toggleStatus(id);
    return {
      success: true,
      data: product,
    };
  }
}
