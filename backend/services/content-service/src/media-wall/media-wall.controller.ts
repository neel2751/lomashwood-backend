import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/common/decorators/current-user.decorator';
import { MediaWallService } from './media-wall.service';
import { CreateMediaItemDto } from './dto/create-media-item.dto';
import { UpdateMediaItemDto } from './dto/update-media-item.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('media-wall')
@Controller('media-wall')
@UseGuards(JwtAuthGuard)
export class MediaWallController {
  constructor(private readonly mediaWallService: MediaWallService) {}

  @Get()
  @ApiOperation({ summary: 'Get all media items' })
  @SwaggerApiResponse({ status: 200, description: 'Media items retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('featured') featured?: boolean,
    @Query('search') search?: string
  ): Promise<ApiResponse<any>> {
    const mediaItems = await this.mediaWallService.findAll({
      page,
      limit,
      type,
      category,
      tags,
      featured,
      search,
    });
    return {
      success: true,
      data: mediaItems,
    };
  }

  @Get('published')
  @ApiOperation({ summary: 'Get published media items' })
  @SwaggerApiResponse({ status: 200, description: 'Published media items retrieved successfully' })
  async findPublished(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('featured') featured?: boolean,
    @Query('search') search?: string
  ): Promise<ApiResponse<any>> {
    const mediaItems = await this.mediaWallService.findPublished({
      page,
      limit,
      type,
      category,
      tags,
      featured,
      search,
    });
    return {
      success: true,
      data: mediaItems,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media item by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Media item retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const mediaItem = await this.mediaWallService.findById(id);
    if (!mediaItem) {
      return {
        success: false,
        message: 'Media item not found',
        error: 'MEDIA_ITEM_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: mediaItem,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new media item' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Media item created successfully' })
  async create(@Body() createMediaItemDto: CreateMediaItemDto, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const mediaItem = await this.mediaWallService.create({
      ...createMediaItemDto,
      uploadedBy: user?.id,
    });
    return {
      success: true,
      data: mediaItem,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update media item' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Media item updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateMediaItemDto: UpdateMediaItemDto,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const mediaItem = await this.mediaWallService.update(id, {
      ...updateMediaItemDto,
      updatedBy: user?.id,
    });
    if (!mediaItem) {
      return {
        success: false,
        message: 'Media item not found or cannot be updated',
        error: 'MEDIA_ITEM_NOT_FOUND_OR_NOT_UPDATABLE',
      };
    }
    return {
      success: true,
      data: mediaItem,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete media item' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Media item deleted successfully' })
  async remove(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.mediaWallService.remove(id);
    if (!result) {
      return {
        success: false,
        message: 'Media item not found or cannot be deleted',
        error: 'MEDIA_ITEM_NOT_FOUND_OR_NOT_DELETABLE',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish media item' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Media item published successfully' })
  async publish(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const mediaItem = await this.mediaWallService.publish(id, user?.id);
    if (!mediaItem) {
      return {
        success: false,
        message: 'Media item not found or cannot be published',
        error: 'MEDIA_ITEM_NOT_FOUND_OR_NOT_PUBLISHABLE',
      };
    }
    return {
      success: true,
      data: mediaItem,
    };
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish media item' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Media item unpublished successfully' })
  async unpublish(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const mediaItem = await this.mediaWallService.unpublish(id, user?.id);
    if (!mediaItem) {
      return {
        success: false,
        message: 'Media item not found or cannot be unpublished',
        error: 'MEDIA_ITEM_NOT_FOUND_OR_NOT_UNPUBLISHABLE',
      };
    }
    return {
      success: true,
      data: mediaItem,
    };
  }

  @Post(':id/feature')
  @ApiOperation({ summary: 'Feature media item' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Media item featured successfully' })
  async feature(@Param('id') id: string, @Body() body: { featured: boolean }): Promise<ApiResponse<any>> {
    const mediaItem = await this.mediaWallService.feature(id, body.featured);
    if (!mediaItem) {
      return {
        success: false,
        message: 'Media item not found',
        error: 'MEDIA_ITEM_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: mediaItem,
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get media categories' })
  @SwaggerApiResponse({ status: 200, description: 'Media categories retrieved successfully' })
  async getCategories(): Promise<ApiResponse<any>> {
    const categories = await this.mediaWallService.getCategories();
    return {
      success: true,
      data: categories,
    };
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get media tags' })
  @SwaggerApiResponse({ status: 200, description: 'Media tags retrieved successfully' })
  async getTags(): Promise<ApiResponse<any>> {
    const tags = await this.mediaWallService.getTags();
    return {
      success: true,
      data: tags,
    };
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular media items' })
  @SwaggerApiResponse({ status: 200, description: 'Popular media items retrieved successfully' })
  async getPopular(
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
    @Query('category') category?: string
  ): Promise<ApiResponse<any>> {
    const mediaItems = await this.mediaWallService.getPopular(limit, type, category);
    return {
      success: true,
      data: mediaItems,
    };
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent media items' })
  @SwaggerApiResponse({ status: 200, description: 'Recent media items retrieved successfully' })
  async getRecent(
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
    @Query('category') category?: string
  ): Promise<ApiResponse<any>> {
    const mediaItems = await this.mediaWallService.getRecent(limit, type, category);
    return {
      success: true,
      data: mediaItems,
    };
  }

  @Get('related/:id')
  @ApiOperation({ summary: 'Get related media items' })
  @SwaggerApiResponse({ status: 200, description: 'Related media items retrieved successfully' })
  async getRelated(@Param('id') id: string, @Query('limit') limit: number = 5): Promise<ApiResponse<any>> {
    const mediaItems = await this.mediaWallService.getRelated(id, limit);
    return {
      success: true,
      data: mediaItems,
    };
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Increment media item view count' })
  @SwaggerApiResponse({ status: 200, description: 'Media item view count incremented successfully' })
  async incrementView(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.mediaWallService.incrementView(id);
    if (!result) {
      return {
        success: false,
        message: 'Media item not found',
        error: 'MEDIA_ITEM_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get media wall statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Media wall statistics retrieved successfully' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.mediaWallService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      type
    );
    return {
      success: true,
      data: stats,
    };
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update media items' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Media items bulk updated successfully' })
  async bulkUpdate(@Body() body: { mediaItemIds: string[]; updateData: UpdateMediaItemDto }): Promise<ApiResponse<any>> {
    const result = await this.mediaWallService.bulkUpdate(body.mediaItemIds, body.updateData);
    return {
      success: true,
      data: result,
    };
  }
}
