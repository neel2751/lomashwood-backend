import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/common/decorators/current-user.decorator';
import { SeoService } from './seo.service';
import { UpdateSeoDto } from './dto/update-seo.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('seo')
@Controller('seo')
@UseGuards(JwtAuthGuard)
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get()
  @ApiOperation({ summary: 'Get all SEO metadata' })
  @SwaggerApiResponse({ status: 200, description: 'SEO metadata retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('search') search?: string
  ): Promise<ApiResponse<any>> {
    const seoMeta = await this.seoService.findAll({
      page,
      limit,
      entityType,
      entityId,
      search,
    });
    return {
      success: true,
      data: seoMeta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get SEO metadata by ID' })
  @SwaggerApiResponse({ status: 200, description: 'SEO metadata retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const seoMeta = await this.seoService.findById(id);
    if (!seoMeta) {
      return {
        success: false,
        message: 'SEO metadata not found',
        error: 'SEO_META_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: seoMeta,
    };
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get SEO metadata by entity' })
  @SwaggerApiResponse({ status: 200, description: 'SEO metadata retrieved successfully' })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string
  ): Promise<ApiResponse<any>> {
    const seoMeta = await this.seoService.findByEntity(entityType, entityId);
    if (!seoMeta) {
      return {
        success: false,
        message: 'SEO metadata not found for this entity',
        error: 'SEO_META_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: seoMeta,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create SEO metadata' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'SEO metadata created successfully' })
  async create(@Body() updateSeoDto: UpdateSeoDto, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const seoMeta = await this.seoService.create({
      ...updateSeoDto,
      createdBy: user?.id,
    });
    return {
      success: true,
      data: seoMeta,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update SEO metadata' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SEO metadata updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateSeoDto: UpdateSeoDto,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const seoMeta = await this.seoService.update(id, {
      ...updateSeoDto,
      updatedBy: user?.id,
    });
    if (!seoMeta) {
      return {
        success: false,
        message: 'SEO metadata not found or cannot be updated',
        error: 'SEO_META_NOT_FOUND_OR_NOT_UPDATABLE',
      };
    }
    return {
      success: true,
      data: seoMeta,
    };
  }

  @Put('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Update SEO metadata by entity' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SEO metadata updated successfully' })
  async updateByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() updateSeoDto: UpdateSeoDto,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const seoMeta = await this.seoService.updateByEntity(entityType, entityId, {
      ...updateSeoDto,
      updatedBy: user?.id,
    });
    if (!seoMeta) {
      return {
        success: false,
        message: 'SEO metadata not found or cannot be updated',
        error: 'SEO_META_NOT_FOUND_OR_NOT_UPDATABLE',
      };
    }
    return {
      success: true,
      data: seoMeta,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete SEO metadata' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SEO metadata deleted successfully' })
  async remove(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.seoService.remove(id);
    if (!result) {
      return {
        success: false,
        message: 'SEO metadata not found or cannot be deleted',
        error: 'SEO_META_NOT_FOUND_OR_NOT_DELETABLE',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Get('sitemap/generate')
  @ApiOperation({ summary: 'Generate sitemap' })
  @SwaggerApiResponse({ status: 200, description: 'Sitemap generated successfully' })
  async generateSitemap(
    @Query('domain') domain?: string,
    @Query('includeImages') includeImages?: boolean
  ): Promise<ApiResponse<any>> {
    const sitemap = await this.seoService.generateSitemap(domain, includeImages);
    return {
      success: true,
      data: sitemap,
    };
  }

  @Get('robots/generate')
  @ApiOperation({ summary: 'Generate robots.txt' })
  @SwaggerApiResponse({ status: 200, description: 'Robots.txt generated successfully' })
  async generateRobots(
    @Query('domain') domain?: string,
    @Query('allowAll') allowAll?: boolean
  ): Promise<ApiResponse<any>> {
    const robots = await this.seoService.generateRobots(domain, allowAll);
    return {
      success: true,
      data: robots,
    };
  }

  @Get('schema/generate')
  @ApiOperation({ summary: 'Generate schema markup' })
  @SwaggerApiResponse({ status: 200, description: 'Schema markup generated successfully' })
  async generateSchema(
    @Query('type') type: string,
    @Query('data') data?: string
  ): Promise<ApiResponse<any>> {
    const schema = await this.seoService.generateSchema(type, data ? JSON.parse(data) : {});
    return {
      success: true,
      data: schema,
    };
  }

  @Get('meta/analyze')
  @ApiOperation({ summary: 'Analyze SEO metadata' })
  @SwaggerApiResponse({ status: 200, description: 'SEO analysis completed successfully' })
  async analyze(
    @Query('url') url?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string
  ): Promise<ApiResponse<any>> {
    const analysis = await this.seoService.analyze(url, entityType, entityId);
    return {
      success: true,
      data: analysis,
    };
  }

  @Get('keywords/suggest')
  @ApiOperation({ summary: 'Get keyword suggestions' })
  @SwaggerApiResponse({ status: 200, description: 'Keyword suggestions retrieved successfully' })
  async getKeywordSuggestions(
    @Query('query') query: string,
    @Query('limit') limit: number = 10
  ): Promise<ApiResponse<any>> {
    const suggestions = await this.seoService.getKeywordSuggestions(query, limit);
    return {
      success: true,
      data: suggestions,
    };
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get SEO analytics summary' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SEO analytics retrieved successfully' })
  async getAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('entityType') entityType?: string
  ): Promise<ApiResponse<any>> {
    const analytics = await this.seoService.getAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      entityType
    );
    return {
      success: true,
      data: analytics,
    };
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update SEO metadata' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SEO metadata bulk updated successfully' })
  async bulkUpdate(@Body() body: { ids: string[]; updateData: UpdateSeoDto }): Promise<ApiResponse<any>> {
    const result = await this.seoService.bulkUpdate(body.ids, body.updateData);
    return {
      success: true,
      data: result,
    };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate SEO metadata' })
  @SwaggerApiResponse({ status: 200, description: 'SEO validation completed successfully' })
  async validate(@Body() body: { seoData: UpdateSeoDto }): Promise<ApiResponse<any>> {
    const validation = await this.seoService.validate(body.seoData);
    return {
      success: true,
      data: validation,
    };
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export SEO metadata to CSV' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SEO metadata exported successfully' })
  async exportToCsv(
    @Query('entityType') entityType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const csvData = await this.seoService.exportToCsv(
      entityType,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return {
      success: true,
      data: csvData,
    };
  }
}
