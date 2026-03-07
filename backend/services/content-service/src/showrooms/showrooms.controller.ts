import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/common/decorators/current-user.decorator';
import { ShowroomsService } from './showrooms.service';
import { CreateShowroomDto } from './dto/create-showroom.dto';
import { UpdateShowroomDto } from './dto/update-showroom.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('showrooms')
@Controller('showrooms')
@UseGuards(JwtAuthGuard)
export class ShowroomsController {
  constructor(private readonly showroomsService: ShowroomsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all showrooms' })
  @SwaggerApiResponse({ status: 200, description: 'Showrooms retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('region') region?: string,
    @Query('search') search?: string
  ): Promise<ApiResponse<any>> {
    const showrooms = await this.showroomsService.findAll({
      page,
      limit,
      status,
      type,
      region,
      search,
    });
    return {
      success: true,
      data: showrooms,
    };
  }

  @Get('published')
  @ApiOperation({ summary: 'Get published showrooms' })
  @SwaggerApiResponse({ status: 200, description: 'Published showrooms retrieved successfully' })
  async findPublished(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
    @Query('region') region?: string,
    @Query('search') search?: string
  ): Promise<ApiResponse<any>> {
    const showrooms = await this.showroomsService.findPublished({
      page,
      limit,
      type,
      region,
      search,
    });
    return {
      success: true,
      data: showrooms,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get showroom by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Showroom retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const showroom = await this.showroomsService.findById(id);
    if (!showroom) {
      return {
        success: false,
        message: 'Showroom not found',
        error: 'SHOWROOM_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: showroom,
    };
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get showroom by slug' })
  @SwaggerApiResponse({ status: 200, description: 'Showroom retrieved successfully' })
  async findBySlug(@Param('slug') slug: string): Promise<ApiResponse<any>> {
    const showroom = await this.showroomsService.findBySlug(slug);
    if (!showroom) {
      return {
        success: false,
        message: 'Showroom not found',
        error: 'SHOWROOM_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: showroom,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new showroom' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Showroom created successfully' })
  async create(@Body() createShowroomDto: CreateShowroomDto, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const showroom = await this.showroomsService.create({
      ...createShowroomDto,
      createdBy: user?.id,
    });
    return {
      success: true,
      data: showroom,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update showroom' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Showroom updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateShowroomDto: UpdateShowroomDto,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const showroom = await this.showroomsService.update(id, {
      ...updateShowroomDto,
      updatedBy: user?.id,
    });
    if (!showroom) {
      return {
        success: false,
        message: 'Showroom not found or cannot be updated',
        error: 'SHOWROOM_NOT_FOUND_OR_NOT_UPDATABLE',
      };
    }
    return {
      success: true,
      data: showroom,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete showroom' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Showroom deleted successfully' })
  async remove(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.showroomsService.remove(id);
    if (!result) {
      return {
        success: false,
        message: 'Showroom not found or cannot be deleted',
        error: 'SHOWROOM_NOT_FOUND_OR_NOT_DELETABLE',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish showroom' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Showroom published successfully' })
  async publish(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const showroom = await this.showroomsService.publish(id, user?.id);
    if (!showroom) {
      return {
        success: false,
        message: 'Showroom not found or cannot be published',
        error: 'SHOWROOM_NOT_FOUND_OR_NOT_PUBLISHABLE',
      };
    }
    return {
      success: true,
      data: showroom,
    };
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish showroom' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Showroom unpublished successfully' })
  async unpublish(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const showroom = await this.showroomsService.unpublish(id, user?.id);
    if (!showroom) {
      return {
        success: false,
        message: 'Showroom not found or cannot be unpublished',
        error: 'SHOWROOM_NOT_FOUND_OR_NOT_UNPUBLISHABLE',
      };
    }
    return {
      success: true,
      data: showroom,
    };
  }

  @Post(':id/feature')
  @ApiOperation({ summary: 'Feature showroom' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Showroom featured successfully' })
  async feature(@Param('id') id: string, @Body() body: { featured: boolean }): Promise<ApiResponse<any>> {
    const showroom = await this.showroomsService.feature(id, body.featured);
    if (!showroom) {
      return {
        success: false,
        message: 'Showroom not found',
        error: 'SHOWROOM_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: showroom,
    };
  }

  @Get('types')
  @ApiOperation({ summary: 'Get showroom types' })
  @SwaggerApiResponse({ status: 200, description: 'Showroom types retrieved successfully' })
  async getTypes(): Promise<ApiResponse<any>> {
    const types = await this.showroomsService.getTypes();
    return {
      success: true,
      data: types,
    };
  }

  @Get('regions')
  @ApiOperation({ summary: 'Get showroom regions' })
  @SwaggerApiResponse({ status: 200, description: 'Showroom regions retrieved successfully' })
  async getRegions(): Promise<ApiResponse<any>> {
    const regions = await this.showroomsService.getRegions();
    return {
      success: true,
      data: regions,
    };
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby showrooms' })
  @SwaggerApiResponse({ status: 200, description: 'Nearby showrooms retrieved successfully' })
  async getNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius: number = 50,
    @Query('limit') limit: number = 10
  ): Promise<ApiResponse<any>> {
    const showrooms = await this.showroomsService.getNearby(latitude, longitude, radius, limit);
    return {
      success: true,
      data: showrooms,
    };
  }

  @Get('availability')
  @ApiOperation({ summary: 'Get showroom availability' })
  @SwaggerApiResponse({ status: 200, description: 'Showroom availability retrieved successfully' })
  async getAvailability(
    @Query('showroomId') showroomId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const availability = await this.showroomsService.getAvailability(showroomId, 
      startDate ? new Date(startDate) : undefined, 
      endDate ? new Date(endDate) : undefined);
    return {
      success: true,
      data: availability,
    };
  }

  @Post(':id/appointment')
  @ApiOperation({ summary: 'Book showroom appointment' })
  @SwaggerApiResponse({ status: 201, description: 'Showroom appointment booked successfully' })
  async bookAppointment(
    @Param('id') id: string,
    @Body() body: {
      consultantId: string;
      date: string;
      time: string;
      duration: number;
      notes?: string;
      contactInfo: any;
    }
  ): Promise<ApiResponse<any>> {
    const appointment = await this.showroomsService.bookAppointment(id, {
      consultantId: body.consultantId,
      date: new Date(body.date),
      time: body.time,
      duration: body.duration,
      notes: body.notes,
      contactInfo: body.contactInfo,
    });
    return {
      success: true,
      data: appointment,
    };
  }

  @Get(':id/appointments')
  @ApiOperation({ summary: 'Get showroom appointments' })
  @SwaggerApiResponse({ status: 200, description: 'Showroom appointments retrieved successfully' })
  async getAppointments(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const appointments = await this.showroomsService.getAppointments(id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined);
    return {
      success: true,
      data: appointments,
    };
  }

  @Get(':id/consultants')
  @ApiOperation({ summary: 'Get showroom consultants' })
  @SwaggerApiResponse({ status: 200, description: 'Showroom consultants retrieved successfully' })
  async getConsultants(@Param('id') id: string): Promise<ApiResponse<any>> {
    const consultants = await this.showroomsService.getConsultants(id);
    return {
      success: true,
      data: consultants,
    };
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Get showroom products' })
  @SwaggerApiResponse({ status: 200, description: 'Showroom products retrieved successfully' })
  async getProducts(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string
  ): Promise<ApiResponse<any>> {
    const products = await this.showroomsService.getProducts(id, page, limit, category);
    return {
      success: true,
      data: products,
    };
  }

  @Get(':id/tours')
  @ApiOperation({ summary: 'Get showroom tours' })
  @SwaggerApiResponse({ status: 200, description: 'Showroom tours retrieved successfully' })
  async getTours(@Param('id') id: string): Promise<ApiResponse<any>> {
    const tours = await this.showroomsService.getTours(id);
    return {
      success: true,
      data: tours,
    };
  }

  @Get(':id/gallery')
  @ApiOperation({ summary: 'Get showroom gallery' })
  @SwaggerApiResponse({ status: 200, description: 'Showroom gallery retrieved successfully' })
  async getGallery(@Param('id') id: string): Promise<ApiResponse<any>> {
    const gallery = await this.showroomsService.getGallery(id);
    return {
      success: true,
      data: gallery,
    };
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get showroom reviews' })
  @SwaggerApiResponse({ status: 200, description: 'Showroom reviews retrieved successfully' })
  async getReviews(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('rating') rating?: number
  ): Promise<ApiResponse<any>> {
    const reviews = await this.showroomsService.getReviews(id, page, limit, rating);
    return {
      success: true,
      data: reviews,
    };
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Add showroom review' })
  @SwaggerApiResponse({ status: 201, description: 'Showroom review added successfully' })
  async addReview(
    @Param('id') id: string,
    @Body() body: {
      rating: number;
      title: string;
      comment: string;
      customerName?: string;
      customerEmail?: string;
      verified: boolean;
    }
  ): Promise<ApiResponse<any>> {
    const review = await this.showroomsService.addReview(id, {
      rating: body.rating,
      title: body.title,
      comment: body.comment,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      verified: body.verified,
    });
    return {
      success: true,
      data: review,
    };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get showroom statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Showroom statistics retrieved successfully' })
  async getStats(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.showroomsService.getStats(id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get showrooms statistics summary' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Showrooms statistics summary retrieved successfully' })
  async getStatsSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('region') region?: string,
    @Query('type') type?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.showroomsService.getStatsSummary(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      region,
      type
    );
    return {
      success: true,
      data: stats,
    };
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update showrooms' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Showrooms bulk updated successfully' })
  async bulkUpdate(@Body() body: { showroomIds: string[]; updateData: UpdateShowroomDto }): Promise<ApiResponse<any>> {
    const result = await this.showroomsService.bulkUpdate(body.showroomIds, body.updateData);
    return {
      success: true,
      data: result,
    };
  }

  @Post('bulk-publish')
  @ApiOperation({ summary: 'Bulk publish showrooms' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Showrooms bulk published successfully' })
  async bulkPublish(@Body() body: { showroomIds: string[] }, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const result = await this.showroomsService.bulkPublish(body.showroomIds, user?.id);
    return {
      success: true,
      data: result,
    };
  }

  @Post('bulk-unpublish')
  @ApiOperation({ summary: 'Bulk unpublish showrooms' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Showrooms bulk unpublished successfully' })
  async bulkUnpublish(@Body() body: { showroomIds: string[] }, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const result = await this.showroomsService.bulkUnpublish(body.showroomIds, user?.id);
    return {
      success: true,
      data: result,
    };
  }
}
