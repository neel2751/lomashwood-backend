import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/common/decorators/current-user.decorator';
import { SavedDesignsService } from './saved-designs.service';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('saved-designs')
@Controller('saved-designs')
@UseGuards(JwtAuthGuard)
export class SavedDesignsController {
  constructor(private readonly savedDesignsService: SavedDesignsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all saved designs' })
  @SwaggerApiResponse({ status: 200, description: 'Saved designs retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('customerId') customerId?: string,
    @Query('category') category?: string,
    @Query('style') style?: string,
    @Query('room') room?: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const designs = await this.savedDesignsService.findAll({
      page,
      limit,
      customerId,
      category,
      style,
      room,
      user,
    });
    return {
      success: true,
      data: designs,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get saved design by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Saved design retrieved successfully' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const design = await this.savedDesignsService.findById(id, user);
    if (!design) {
      return {
        success: false,
        message: 'Saved design not found',
        error: 'SAVED_DESIGN_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: design,
    };
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get customer saved designs' })
  @SwaggerApiResponse({ status: 200, description: 'Customer saved designs retrieved successfully' })
  async findByCustomer(
    @Param('customerId') customerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('style') style?: string,
    @Query('room') room?: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const designs = await this.savedDesignsService.findByCustomer(customerId, {
      page,
      limit,
      category,
      style,
      room,
    }, user);
    return {
      success: true,
      data: designs,
    };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user saved designs' })
  @SwaggerApiResponse({ status: 200, description: 'User saved designs retrieved successfully' })
  async getProfile(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('style') style?: string,
    @Query('room') room?: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const designs = await this.savedDesignsService.findByCustomer(user?.id, {
      page,
      limit,
      category,
      style,
      room,
    }, user);
    return {
      success: true,
      data: designs,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new saved design' })
  @SwaggerApiResponse({ status: 201, description: 'Saved design created successfully' })
  async create(
    @Body() createData: {
      name: string;
      description?: string;
      category?: string;
      style?: string;
      room?: string;
      designData: any;
      thumbnail?: string;
      images?: string[];
      tags?: string[];
      isPublic?: boolean;
    },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const design = await this.savedDesignsService.create({
      ...createData,
      customerId: user?.id,
    });
    return {
      success: true,
      data: design,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update saved design' })
  @SwaggerApiResponse({ status: 200, description: 'Saved design updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateData: any,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const design = await this.savedDesignsService.update(id, updateData, user);
    if (!design) {
      return {
        success: false,
        message: 'Saved design not found or cannot be updated',
        error: 'SAVED_DESIGN_NOT_FOUND_OR_NOT_UPDATABLE',
      };
    }
    return {
      success: true,
      data: design,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete saved design' })
  @SwaggerApiResponse({ status: 200, description: 'Saved design deleted successfully' })
  async remove(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const result = await this.savedDesignsService.remove(id, user);
    if (!result) {
      return {
        success: false,
        message: 'Saved design not found or cannot be deleted',
        error: 'SAVED_DESIGN_NOT_FOUND_OR_NOT_DELETABLE',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate saved design' })
  @SwaggerApiResponse({ status: 201, description: 'Saved design duplicated successfully' })
  async duplicate(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const result = await this.savedDesignsService.duplicate(id, {
      ...body,
      duplicatedBy: user?.id,
    }, user);
    if (!result) {
      return {
        success: false,
        message: 'Saved design not found or cannot be duplicated',
        error: 'SAVED_DESIGN_NOT_FOUND_OR_NOT_DUPLICATABLE',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share saved design' })
  @SwaggerApiResponse({ status: 200, description: 'Saved design shared successfully' })
  async share(
    @Param('id') id: string,
    @Body() body: {
      emails: string[];
      message?: string;
      expiresIn?: number;
    },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const result = await this.savedDesignsService.share(id, {
      ...body,
      sharedBy: user?.id,
    }, user);
    if (!result) {
      return {
        success: false,
        message: 'Saved design not found or cannot be shared',
        error: 'SAVED_DESIGN_NOT_FOUND_OR_NOT_SHAREABLE',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Get('public/:shareToken')
  @ApiOperation({ summary: 'Get public saved design by share token' })
  @SwaggerApiResponse({ status: 200, description: 'Public saved design retrieved successfully' })
  async getPublicDesign(@Param('shareToken') shareToken: string): Promise<ApiResponse<any>> {
    const design = await this.savedDesignsService.findByShareToken(shareToken);
    if (!design) {
      return {
        success: false,
        message: 'Public saved design not found or expired',
        error: 'PUBLIC_SAVED_DESIGN_NOT_FOUND_OR_EXPIRED',
      };
    }
    return {
      success: true,
      data: design,
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get design categories' })
  @SwaggerApiResponse({ status: 200, description: 'Design categories retrieved successfully' })
  async getCategories(): Promise<ApiResponse<any>> {
    const categories = await this.savedDesignsService.getCategories();
    return {
      success: true,
      data: categories,
    };
  }

  @Get('styles')
  @ApiOperation({ summary: 'Get design styles' })
  @SwaggerApiResponse({ status: 200, description: 'Design styles retrieved successfully' })
  async getStyles(): Promise<ApiResponse<any>> {
    const styles = await this.savedDesignsService.getStyles();
    return {
      success: true,
      data: styles,
    };
  }

  @Get('rooms')
  @ApiOperation({ summary: 'Get room types' })
  @SwaggerApiResponse({ status: 200, description: 'Room types retrieved successfully' })
  async getRooms(): Promise<ApiResponse<any>> {
    const rooms = await this.savedDesignsService.getRooms();
    return {
      success: true,
      data: rooms,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search saved designs' })
  @SwaggerApiResponse({ status: 200, description: 'Saved designs searched successfully' })
  async search(
    @Query('q') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('style') style?: string,
    @Query('room') room?: string,
    @Query('isPublic') isPublic?: boolean,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const designs = await this.savedDesignsService.search({
      query,
      page,
      limit,
      category,
      style,
      room,
      isPublic,
      user,
    });
    return {
      success: true,
      data: designs,
    };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get saved design statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Saved design statistics retrieved successfully' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('customerId') customerId?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.savedDesignsService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      customerId
    );
    return {
      success: true,
      data: stats,
    };
  }

  @Post('bulk-export')
  @ApiOperation({ summary: 'Bulk export saved designs' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Saved designs exported successfully' })
  async bulkExport(
    @Body() body: {
      designIds: string[];
      format?: string;
      includeImages?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    const result = await this.savedDesignsService.bulkExport(body.designIds, {
      format: body.format || 'JSON',
      includeImages: body.includeImages || false,
    });
    return {
      success: true,
      data: result,
    };
  }
}
