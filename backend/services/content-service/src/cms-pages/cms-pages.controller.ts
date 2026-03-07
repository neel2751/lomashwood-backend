import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/common/decorators/current-user.decorator';
import { CmsPagesService } from './cms-pages.service';
import { CreateCmsPageDto } from './dto/create-cms-page.dto';
import { UpdateCmsPageDto } from './dto/update-cms-page.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('cms-pages')
@Controller('cms-pages')
@UseGuards(JwtAuthGuard)
export class CmsPagesController {
  constructor(private readonly cmsPagesService: CmsPagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all CMS pages' })
  @SwaggerApiResponse({ status: 200, description: 'CMS pages retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string
  ): Promise<ApiResponse<any>> {
    const pages = await this.cmsPagesService.findAll({
      page,
      limit,
      status,
      type,
      search,
    });
    return {
      success: true,
      data: pages,
    };
  }

  @Get('published')
  @ApiOperation({ summary: 'Get published CMS pages' })
  @SwaggerApiResponse({ status: 200, description: 'Published CMS pages retrieved successfully' })
  async findPublished(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
    @Query('search') search?: string
  ): Promise<ApiResponse<any>> {
    const pages = await this.cmsPagesService.findPublished({
      page,
      limit,
      type,
      search,
    });
    return {
      success: true,
      data: pages,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get CMS page by ID' })
  @SwaggerApiResponse({ status: 200, description: 'CMS page retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const page = await this.cmsPagesService.findById(id);
    if (!page) {
      return {
        success: false,
        message: 'CMS page not found',
        error: 'CMS_PAGE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: page,
    };
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get CMS page by slug' })
  @SwaggerApiResponse({ status: 200, description: 'CMS page retrieved successfully' })
  async findBySlug(@Param('slug') slug: string): Promise<ApiResponse<any>> {
    const page = await this.cmsPagesService.findBySlug(slug);
    if (!page) {
      return {
        success: false,
        message: 'CMS page not found',
        error: 'CMS_PAGE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: page,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new CMS page' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'CMS page created successfully' })
  async create(@Body() createCmsPageDto: CreateCmsPageDto, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const page = await this.cmsPagesService.create({
      ...createCmsPageDto,
      createdBy: user?.id,
    });
    return {
      success: true,
      data: page,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update CMS page' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'CMS page updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateCmsPageDto: UpdateCmsPageDto,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const page = await this.cmsPagesService.update(id, {
      ...updateCmsPageDto,
      updatedBy: user?.id,
    });
    if (!page) {
      return {
        success: false,
        message: 'CMS page not found or cannot be updated',
        error: 'CMS_PAGE_NOT_FOUND_OR_NOT_UPDATABLE',
      };
    }
    return {
      success: true,
      data: page,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete CMS page' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'CMS page deleted successfully' })
  async remove(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.cmsPagesService.remove(id);
    if (!result) {
      return {
        success: false,
        message: 'CMS page not found or cannot be deleted',
        error: 'CMS_PAGE_NOT_FOUND_OR_NOT_DELETABLE',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish CMS page' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'CMS page published successfully' })
  async publish(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const page = await this.cmsPagesService.publish(id, user?.id);
    if (!page) {
      return {
        success: false,
        message: 'CMS page not found or cannot be published',
        error: 'CMS_PAGE_NOT_FOUND_OR_NOT_PUBLISHABLE',
      };
    }
    return {
      success: true,
      data: page,
    };
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish CMS page' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'CMS page unpublished successfully' })
  async unpublish(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const page = await this.cmsPagesService.unpublish(id, user?.id);
    if (!page) {
      return {
        success: false,
        message: 'CMS page not found or cannot be unpublished',
        error: 'CMS_PAGE_NOT_FOUND_OR_NOT_UNPUBLISHABLE',
      };
    }
    return {
      success: true,
      data: page,
    };
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate CMS page' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'CMS page duplicated successfully' })
  async duplicate(
    @Param('id') id: string,
    @Body() body: { title?: string; slug?: string },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const page = await this.cmsPagesService.duplicate(id, {
      ...body,
      duplicatedBy: user?.id,
    });
    if (!page) {
      return {
        success: false,
        message: 'CMS page not found or cannot be duplicated',
        error: 'CMS_PAGE_NOT_FOUND_OR_NOT_DUPLICATABLE',
      };
    }
    return {
      success: true,
      data: page,
    };
  }

  @Get('types')
  @ApiOperation({ summary: 'Get CMS page types' })
  @SwaggerApiResponse({ status: 200, description: 'CMS page types retrieved successfully' })
  async getTypes(): Promise<ApiResponse<any>> {
    const types = await this.cmsPagesService.getTypes();
    return {
      success: true,
      data: types,
    };
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get CMS page templates' })
  @SwaggerApiResponse({ status: 200, description: 'CMS page templates retrieved successfully' })
  async getTemplates(): Promise<ApiResponse<any>> {
    const templates = await this.cmsPagesService.getTemplates();
    return {
      success: true,
      data: templates,
    };
  }

  @Get('navigation')
  @ApiOperation({ summary: 'Get navigation structure' })
  @SwaggerApiResponse({ status: 200, description: 'Navigation structure retrieved successfully' })
  async getNavigation(): Promise<ApiResponse<any>> {
    const navigation = await this.cmsPagesService.getNavigation();
    return {
      success: true,
      data: navigation,
    };
  }

  @Get('sitemap')
  @ApiOperation({ summary: 'Get sitemap' })
  @SwaggerApiResponse({ status: 200, description: 'Sitemap retrieved successfully' })
  async getSitemap(): Promise<ApiResponse<any>> {
    const sitemap = await this.cmsPagesService.getSitemap();
    return {
      success: true,
      data: sitemap,
    };
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Increment CMS page view count' })
  @SwaggerApiResponse({ status: 200, description: 'CMS page view count incremented successfully' })
  async incrementView(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.cmsPagesService.incrementView(id);
    if (!result) {
      return {
        success: false,
        message: 'CMS page not found',
        error: 'CMS_PAGE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get CMS page statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'CMS page statistics retrieved successfully' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.cmsPagesService.getStats(
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
  @ApiOperation({ summary: 'Bulk update CMS pages' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'CMS pages bulk updated successfully' })
  async bulkUpdate(@Body() body: { pageIds: string[]; updateData: UpdateCmsPageDto }): Promise<ApiResponse<any>> {
    const result = await this.cmsPagesService.bulkUpdate(body.pageIds, body.updateData);
    return {
      success: true,
      data: result,
    };
  }

  @Post('bulk-publish')
  @ApiOperation({ summary: 'Bulk publish CMS pages' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'CMS pages bulk published successfully' })
  async bulkPublish(@Body() body: { pageIds: string[] }, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const result = await this.cmsPagesService.bulkPublish(body.pageIds, user?.id);
    return {
      success: true,
      data: result,
    };
  }

  @Post('bulk-unpublish')
  @ApiOperation({ summary: 'Bulk unpublish CMS pages' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'CMS pages bulk unpublished successfully' })
  async bulkUnpublish(@Body() body: { pageIds: string[] }, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const result = await this.cmsPagesService.bulkUnpublish(body.pageIds, user?.id);
    return {
      success: true,
      data: result,
    };
  }
}
