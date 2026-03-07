import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth-service/src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth-service/src/auth/guards/roles.guard';
import { Roles } from '../../../auth-service/src/auth/common/decorators/roles.decorator';
import { SizesService } from './sizes.service';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('sizes')
@Controller('sizes')
@UseGuards(JwtAuthGuard)
export class SizesController {
  constructor(private readonly sizesService: SizesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all sizes' })
  @SwaggerApiResponse({ status: 200, description: 'Sizes retrieved successfully' })
  async findAll(): Promise<ApiResponse<any[]>> {
    const sizes = await this.sizesService.findAll();
    return {
      success: true,
      data: sizes,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get size by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Size retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const size = await this.sizesService.findById(id);
    if (!size) {
      return {
        success: false,
        message: 'Size not found',
        errors: [{ field: 'general', message: 'Size not found' }],
      };
    }
    return {
      success: true,
      data: size,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new size' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Size created successfully' })
  async create(@Body() createSizeDto: CreateSizeDto): Promise<ApiResponse<any>> {
    const size = await this.sizesService.create(createSizeDto);
    return {
      success: true,
      data: size,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update size' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Size updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateSizeDto: UpdateSizeDto
  ): Promise<ApiResponse<any>> {
    const size = await this.sizesService.update(id, updateSizeDto);
    if (!size) {
      return {
        success: false,
        message: 'Size not found',
        errors: [{ field: 'general', message: 'Size not found' }],
      };
    }
    return {
      success: true,
      data: size,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete size' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @SwaggerApiResponse({ status: 200, description: 'Size deleted successfully' })
  async remove(@Param('id') id: string): Promise<ApiResponse<void>> {
    await this.sizesService.remove(id);
    return {
      success: true,
      data: undefined,
      message: 'Size deleted successfully',
    };
  }
}
