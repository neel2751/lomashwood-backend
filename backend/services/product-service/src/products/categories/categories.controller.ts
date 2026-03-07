import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @SwaggerApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async findAll(): Promise<ApiResponse<any[]>> {
    const categories = await this.categoriesService.findAll();
    return {
      success: true,
      data: categories,
    };
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get category tree' })
  @SwaggerApiResponse({ status: 200, description: 'Category tree retrieved successfully' })
  async getTree(): Promise<ApiResponse<any[]>> {
    const tree = await this.categoriesService.getTree();
    return {
      success: true,
      data: tree,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Category retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const category = await this.categoriesService.findById(id);
    if (!category) {
      return {
        success: false,
        message: 'Category not found',
        error: 'CATEGORY_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: category,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new category' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Category created successfully' })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<ApiResponse<any>> {
    const category = await this.categoriesService.create(createCategoryDto);
    return {
      success: true,
      data: category,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Category updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ): Promise<ApiResponse<any>> {
    const category = await this.categoriesService.update(id, updateCategoryDto);
    if (!category) {
      return {
        success: false,
        message: 'Category not found',
        error: 'CATEGORY_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: category,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @SwaggerApiResponse({ status: 200, description: 'Category deleted successfully' })
  async remove(@Param('id') id: string): Promise<ApiResponse<void>> {
    await this.categoriesService.remove(id);
    return {
      success: true,
      data: undefined,
      message: 'Category deleted successfully',
    };
  }
}
