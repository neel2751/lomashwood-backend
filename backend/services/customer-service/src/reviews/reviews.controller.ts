import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/common/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  @SwaggerApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('productId') productId?: string,
    @Query('customerId') customerId?: string,
    @Query('rating') rating?: number,
    @Query('status') status?: string
  ): Promise<ApiResponse<any>> {
    const reviews = await this.reviewsService.findAll({
      page,
      limit,
      productId,
      customerId,
      rating,
      status,
    });
    return {
      success: true,
      data: reviews,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Review retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const review = await this.reviewsService.findById(id);
    if (!review) {
      return {
        success: false,
        message: 'Review not found',
        error: 'REVIEW_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: review,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new review' })
  @SwaggerApiResponse({ status: 201, description: 'Review created successfully' })
  async create(@Body() createReviewDto: CreateReviewDto, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const review = await this.reviewsService.create(createReviewDto, user);
    return {
      success: true,
      data: review,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update review' })
  @SwaggerApiResponse({ status: 200, description: 'Review updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateData: any,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const review = await this.reviewsService.update(id, updateData, user);
    if (!review) {
      return {
        success: false,
        message: 'Review not found or cannot be updated',
        error: 'REVIEW_NOT_FOUND_OR_NOT_UPDATABLE',
      };
    }
    return {
      success: true,
      data: review,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete review' })
  @SwaggerApiResponse({ status: 200, description: 'Review deleted successfully' })
  async remove(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const result = await this.reviewsService.remove(id, user);
    if (!result) {
      return {
        success: false,
        message: 'Review not found or cannot be deleted',
        error: 'REVIEW_NOT_FOUND_OR_NOT_DELETABLE',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/moderate')
  @ApiOperation({ summary: 'Moderate review' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Review moderated successfully' })
  async moderate(
    @Param('id') id: string,
    @Body() moderateReviewDto: ModerateReviewDto
  ): Promise<ApiResponse<any>> {
    const review = await this.reviewsService.moderate(id, moderateReviewDto);
    if (!review) {
      return {
        success: false,
        message: 'Review not found',
        error: 'REVIEW_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: review,
    };
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get reviews by product ID' })
  @SwaggerApiResponse({ status: 200, description: 'Product reviews retrieved successfully' })
  async findByProduct(
    @Param('productId') productId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('rating') rating?: number,
    @Query('verified') verified?: boolean
  ): Promise<ApiResponse<any>> {
    const reviews = await this.reviewsService.findByProduct(productId, {
      page,
      limit,
      rating,
      verified,
    });
    return {
      success: true,
      data: reviews,
    };
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get reviews by customer ID' })
  @SwaggerApiResponse({ status: 200, description: 'Customer reviews retrieved successfully' })
  async findByCustomer(
    @Param('customerId') customerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string
  ): Promise<ApiResponse<any>> {
    const reviews = await this.reviewsService.findByCustomer(customerId, {
      page,
      limit,
      status,
    });
    return {
      success: true,
      data: reviews,
    };
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending reviews' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Pending reviews retrieved successfully' })
  async getPending(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<ApiResponse<any>> {
    const reviews = await this.reviewsService.getPending({ page, limit });
    return {
      success: true,
      data: reviews,
    };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get review statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Review statistics retrieved successfully' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('productId') productId?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.reviewsService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      productId
    );
    return {
      success: true,
      data: stats,
    };
  }

  @Post('bulk-moderate')
  @ApiOperation({ summary: 'Bulk moderate reviews' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Reviews bulk moderated successfully' })
  async bulkModerate(@Body() body: { reviewIds: string[]; status: string; notes?: string }): Promise<ApiResponse<any>> {
    const result = await this.reviewsService.bulkModerate(body.reviewIds, body.status, body.notes);
    return {
      success: true,
      data: result,
    };
  }
}
