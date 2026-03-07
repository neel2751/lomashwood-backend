import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/common/decorators/current-user.decorator';
import { LandingPagesService } from './landing-pages.service';
import { CreateLandingPageDto } from './dto/create-landing-page.dto';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('landing-pages')
@Controller('landing-pages')
@UseGuards(JwtAuthGuard)
export class LandingPagesController {
  constructor(private readonly landingPagesService: LandingPagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all landing pages' })
  @SwaggerApiResponse({ status: 200, description: 'Landing pages retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('campaign') campaign?: string,
    @Query('search') search?: string
  ): Promise<ApiResponse<any>> {
    const landingPages = await this.landingPagesService.findAll({
      page,
      limit,
      status,
      campaign,
      search,
    });
    return {
      success: true,
      data: landingPages,
    };
  }

  @Get('published')
  @ApiOperation({ summary: 'Get published landing pages' })
  @SwaggerApiResponse({ status: 200, description: 'Published landing pages retrieved successfully' })
  async findPublished(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('campaign') campaign?: string,
    @Query('search') search?: string
  ): Promise<ApiResponse<any>> {
    const landingPages = await this.landingPagesService.findPublished({
      page,
      limit,
      campaign,
      search,
    });
    return {
      success: true,
      data: landingPages,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get landing page by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Landing page retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const landingPage = await this.landingPagesService.findById(id);
    if (!landingPage) {
      return {
        success: false,
        message: 'Landing page not found',
        error: 'LANDING_PAGE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: landingPage,
    };
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get landing page by slug' })
  @SwaggerApiResponse({ status: 200, description: 'Landing page retrieved successfully' })
  async findBySlug(@Param('slug') slug: string): Promise<ApiResponse<any>> {
    const landingPage = await this.landingPagesService.findBySlug(slug);
    if (!landingPage) {
      return {
        success: false,
        message: 'Landing page not found',
        error: 'LANDING_PAGE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: landingPage,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new landing page' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Landing page created successfully' })
  async create(@Body() createLandingPageDto: CreateLandingPageDto, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const landingPage = await this.landingPagesService.create({
      ...createLandingPageDto,
      createdBy: user?.id,
    });
    return {
      success: true,
      data: landingPage,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update landing page' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Landing page updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateLandingPageDto: UpdateLandingPageDto,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const landingPage = await this.landingPagesService.update(id, {
      ...updateLandingPageDto,
      updatedBy: user?.id,
    });
    if (!landingPage) {
      return {
        success: false,
        message: 'Landing page not found or cannot be updated',
        error: 'LANDING_PAGE_NOT_FOUND_OR_NOT_UPDATABLE',
      };
    }
    return {
      success: true,
      data: landingPage,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete landing page' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Landing page deleted successfully' })
  async remove(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.landingPagesService.remove(id);
    if (!result) {
      return {
        success: false,
        message: 'Landing page not found or cannot be deleted',
        error: 'LANDING_PAGE_NOT_FOUND_OR_NOT_DELETABLE',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish landing page' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Landing page published successfully' })
  async publish(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const landingPage = await this.landingPagesService.publish(id, user?.id);
    if (!landingPage) {
      return {
        success: false,
        message: 'Landing page not found or cannot be published',
        error: 'LANDING_PAGE_NOT_FOUND_OR_NOT_PUBLISHABLE',
      };
    }
    return {
      success: true,
      data: landingPage,
    };
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish landing page' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Landing page unpublished successfully' })
  async unpublish(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const landingPage = await this.landingPagesService.unpublish(id, user?.id);
    if (!landingPage) {
      return {
        success: false,
        message: 'Landing page not found or cannot be unpublished',
        error: 'LANDING_PAGE_NOT_FOUND_OR_NOT_UNPUBLISHABLE',
      };
    }
    return {
      success: true,
      data: landingPage,
    };
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate landing page' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Landing page duplicated successfully' })
  async duplicate(
    @Param('id') id: string,
    @Body() body: { title?: string; slug?: string },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const landingPage = await this.landingPagesService.duplicate(id, {
      ...body,
      duplicatedBy: user?.id,
    });
    if (!landingPage) {
      return {
        success: false,
        message: 'Landing page not found or cannot be duplicated',
        error: 'LANDING_PAGE_NOT_FOUND_OR_NOT_DUPLICATABLE',
      };
    }
    return {
      success: true,
      data: landingPage,
    };
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Get landing page campaigns' })
  @SwaggerApiResponse({ status: 200, description: 'Landing page campaigns retrieved successfully' })
  async getCampaigns(): Promise<ApiResponse<any>> {
    const campaigns = await this.landingPagesService.getCampaigns();
    return {
      success: true,
      data: campaigns,
    };
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get landing page templates' })
  @SwaggerApiResponse({ status: 200, description: 'Landing page templates retrieved successfully' })
  async getTemplates(): Promise<ApiResponse<any>> {
    const templates = await this.landingPagesService.getTemplates();
    return {
      success: true,
      data: templates,
    };
  }

  @Get('analytics/:id')
  @ApiOperation({ summary: 'Get landing page analytics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Landing page analytics retrieved successfully' })
  async getAnalytics(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const analytics = await this.landingPagesService.getAnalytics(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return {
      success: true,
      data: analytics,
    };
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Increment landing page view count' })
  @SwaggerApiResponse({ status: 200, description: 'Landing page view count incremented successfully' })
  async incrementView(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.landingPagesService.incrementView(id);
    if (!result) {
      return {
        success: false,
        message: 'Landing page not found',
        error: 'LANDING_PAGE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/conversion')
  @ApiOperation({ summary: 'Track landing page conversion' })
  @SwaggerApiResponse({ status: 200, description: 'Landing page conversion tracked successfully' })
  async trackConversion(
    @Param('id') id: string,
    @Body() body: { type: string; value?: number; metadata?: any }
  ): Promise<ApiResponse<any>> {
    const result = await this.landingPagesService.trackConversion(id, {
      type: body.type,
      value: body.value,
      metadata: body.metadata,
    });
    if (!result) {
      return {
        success: false,
        message: 'Landing page not found',
        error: 'LANDING_PAGE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get landing pages statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Landing pages statistics retrieved successfully' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('campaign') campaign?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.landingPagesService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      campaign
    );
    return {
      success: true,
      data: stats,
    };
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update landing pages' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Landing pages bulk updated successfully' })
  async bulkUpdate(@Body() body: { pageIds: string[]; updateData: UpdateLandingPageDto }): Promise<ApiResponse<any>> {
    const result = await this.landingPagesService.bulkUpdate(body.pageIds, body.updateData);
    return {
      success: true,
      data: result,
    };
  }

  @Post('bulk-publish')
  @ApiOperation({ summary: 'Bulk publish landing pages' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Landing pages bulk published successfully' })
  async bulkPublish(@Body() body: { pageIds: string[] }, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const result = await this.landingPagesService.bulkPublish(body.pageIds, user?.id);
    return {
      success: true,
      data: result,
    };
  }

  @Post('bulk-unpublish')
  @ApiOperation({ summary: 'Bulk unpublish landing pages' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Landing pages bulk unpublished successfully' })
  async bulkUnpublish(@Body() body: { pageIds: string[] }, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const result = await this.landingPagesService.bulkUnpublish(body.pageIds, user?.id);
    return {
      success: true,
      data: result,
    };
  }
}
