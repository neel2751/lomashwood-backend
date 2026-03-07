import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { ColoursService } from './colours.service';
import { CreateColourDto } from './dto/create-colour.dto';
import { UpdateColourDto } from './dto/update-colour.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('colours')
@Controller('colours')
@UseGuards(JwtAuthGuard)
export class ColoursController {
  constructor(private readonly coloursService: ColoursService) {}

  @Get()
  @ApiOperation({ summary: 'Get all colours' })
  @SwaggerApiResponse({ status: 200, description: 'Colours retrieved successfully' })
  async findAll(): Promise<ApiResponse<any[]>> {
    const colours = await this.coloursService.findAll();
    return {
      success: true,
      data: colours,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get colour by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Colour retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const colour = await this.coloursService.findById(id);
    if (!colour) {
      return {
        success: false,
        message: 'Colour not found',
        error: 'COLOUR_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: colour,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new colour' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Colour created successfully' })
  async create(@Body() createColourDto: CreateColourDto): Promise<ApiResponse<any>> {
    const colour = await this.coloursService.create(createColourDto);
    return {
      success: true,
      data: colour,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update colour' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Colour updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateColourDto: UpdateColourDto
  ): Promise<ApiResponse<any>> {
    const colour = await this.coloursService.update(id, updateColourDto);
    if (!colour) {
      return {
        success: false,
        message: 'Colour not found',
        error: 'COLOUR_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: colour,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete colour' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @SwaggerApiResponse({ status: 200, description: 'Colour deleted successfully' })
  async remove(@Param('id') id: string): Promise<ApiResponse<void>> {
    await this.coloursService.remove(id);
    return {
      success: true,
      data: undefined,
      message: 'Colour deleted successfully',
    };
  }
}
