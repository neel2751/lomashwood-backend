import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/common/decorators/current-user.decorator';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('blogs')
@Controller('blogs')
@UseGuards(JwtAuthGuard)
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all blogs' })
  @SwaggerApiResponse({ status: 200, description: 'Blogs retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('author') author?: string,
    @Query('featured') featured?: boolean,
    @Query('search') search?: string
  ): Promise<ApiResponse<any>> {
    const blogs = await this.blogsService.findAll({
      page,
      limit,
      status,
      category,
      author,
      featured,
      search,
    });
    return {
      success: true,
      data: blogs,
    };
  }

  @Get('published')
  @ApiOperation({ summary: 'Get published blogs' })
  @SwaggerApiResponse({ status: 200, description: 'Published blogs retrieved successfully' })
  async findPublished(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('author') author?: string,
    @Query('featured') featured?: boolean,
    @Query('search') search?: string
  ): Promise<ApiResponse<any>> {
    const blogs = await this.blogsService.findPublished({
      page,
      limit,
      category,
      author,
      featured,
      search,
    });
    return {
      success: true,
      data: blogs,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get blog by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Blog retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const blog = await this.blogsService.findById(id);
    if (!blog) {
      return {
        success: false,
        message: 'Blog not found',
        error: 'BLOG_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: blog,
    };
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get blog by slug' })
  @SwaggerApiResponse({ status: 200, description: 'Blog retrieved successfully' })
  async findBySlug(@Param('slug') slug: string): Promise<ApiResponse<any>> {
    const blog = await this.blogsService.findBySlug(slug);
    if (!blog) {
      return {
        success: false,
        message: 'Blog not found',
        error: 'BLOG_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: blog,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new blog' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Blog created successfully' })
  async create(@Body() createBlogDto: CreateBlogDto, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const blog = await this.blogsService.create({
      ...createBlogDto,
      authorId: user?.id,
    });
    return {
      success: true,
      data: blog,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update blog' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Blog updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const blog = await this.blogsService.update(id, {
      ...updateBlogDto,
      updatedBy: user?.id,
    });
    if (!blog) {
      return {
        success: false,
        message: 'Blog not found or cannot be updated',
        error: 'BLOG_NOT_FOUND_OR_NOT_UPDATABLE',
      };
    }
    return {
      success: true,
      data: blog,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete blog' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Blog deleted successfully' })
  async remove(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.blogsService.remove(id);
    if (!result) {
      return {
        success: false,
        message: 'Blog not found or cannot be deleted',
        error: 'BLOG_NOT_FOUND_OR_NOT_DELETABLE',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish blog' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Blog published successfully' })
  async publish(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const blog = await this.blogsService.publish(id, user?.id);
    if (!blog) {
      return {
        success: false,
        message: 'Blog not found or cannot be published',
        error: 'BLOG_NOT_FOUND_OR_NOT_PUBLISHABLE',
      };
    }
    return {
      success: true,
      data: blog,
    };
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish blog' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Blog unpublished successfully' })
  async unpublish(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const blog = await this.blogsService.unpublish(id, user?.id);
    if (!blog) {
      return {
        success: false,
        message: 'Blog not found or cannot be unpublished',
        error: 'BLOG_NOT_FOUND_OR_NOT_UNPUBLISHABLE',
      };
    }
    return {
      success: true,
      data: blog,
    };
  }

  @Post(':id/feature')
  @ApiOperation({ summary: 'Feature blog' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Blog featured successfully' })
  async feature(@Param('id') id: string, @Body() body: { featured: boolean }): Promise<ApiResponse<any>> {
    const blog = await this.blogsService.feature(id, body.featured);
    if (!blog) {
      return {
        success: false,
        message: 'Blog not found',
        error: 'BLOG_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: blog,
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get blog categories' })
  @SwaggerApiResponse({ status: 200, description: 'Blog categories retrieved successfully' })
  async getCategories(): Promise<ApiResponse<any>> {
    const categories = await this.blogsService.getCategories();
    return {
      success: true,
      data: categories,
    };
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get blog tags' })
  @SwaggerApiResponse({ status: 200, description: 'Blog tags retrieved successfully' })
  async getTags(): Promise<ApiResponse<any>> {
    const tags = await this.blogsService.getTags();
    return {
      success: true,
      data: tags,
    };
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular blogs' })
  @SwaggerApiResponse({ status: 200, description: 'Popular blogs retrieved successfully' })
  async getPopular(
    @Query('limit') limit: number = 10,
    @Query('category') category?: string
  ): Promise<ApiResponse<any>> {
    const blogs = await this.blogsService.getPopular(limit, category);
    return {
      success: true,
      data: blogs,
    };
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent blogs' })
  @SwaggerApiResponse({ status: 200, description: 'Recent blogs retrieved successfully' })
  async getRecent(
    @Query('limit') limit: number = 10,
    @Query('category') category?: string
  ): Promise<ApiResponse<any>> {
    const blogs = await this.blogsService.getRecent(limit, category);
    return {
      success: true,
      data: blogs,
    };
  }

  @Get('related/:id')
  @ApiOperation({ summary: 'Get related blogs' })
  @SwaggerApiResponse({ status: 200, description: 'Related blogs retrieved successfully' })
  async getRelated(@Param('id') id: string, @Query('limit') limit: number = 5): Promise<ApiResponse<any>> {
    const blogs = await this.blogsService.getRelated(id, limit);
    return {
      success: true,
      data: blogs,
    };
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Increment blog view count' })
  @SwaggerApiResponse({ status: 200, description: 'Blog view count incremented successfully' })
  async incrementView(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.blogsService.incrementView(id);
    if (!result) {
      return {
        success: false,
        message: 'Blog not found',
        error: 'BLOG_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get blog statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Blog statistics retrieved successfully' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('author') author?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.blogsService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      author
    );
    return {
      success: true,
      data: stats,
    };
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update blogs' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Blogs bulk updated successfully' })
  async bulkUpdate(@Body() body: { blogIds: string[]; updateData: UpdateBlogDto }): Promise<ApiResponse<any>> {
    const result = await this.blogsService.bulkUpdate(body.blogIds, body.updateData);
    return {
      success: true,
      data: result,
    };
  }
}
