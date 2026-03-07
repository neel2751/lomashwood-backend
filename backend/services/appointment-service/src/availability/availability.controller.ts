import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { AvailabilityService } from './availability.service';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { CheckSlotsDto } from './dto/check-slots.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('availability')
@Controller('availability')
@UseGuards(JwtAuthGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  @ApiOperation({ summary: 'Get all availability' })
  @SwaggerApiResponse({ status: 200, description: 'Availability retrieved successfully' })
  async findAll(
    @Query('consultantId') consultantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('showroomId') showroomId?: string
  ): Promise<ApiResponse<any>> {
    const availability = await this.availabilityService.findAll({
      consultantId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      showroomId,
    });
    return {
      success: true,
      data: availability,
    };
  }

  @Get('time-slots')
  @ApiOperation({ summary: 'Get available time slots' })
  @SwaggerApiResponse({ status: 200, description: 'Time slots retrieved successfully' })
  async getAvailableTimeSlots(@Query() checkSlotsDto: CheckSlotsDto): Promise<ApiResponse<any>> {
    const timeSlots = await this.availabilityService.getAvailableTimeSlots(checkSlotsDto);
    return {
      success: true,
      data: timeSlots,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get availability by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Availability retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const availability = await this.availabilityService.findById(id);
    if (!availability) {
      return {
        success: false,
        message: 'Availability not found',
        error: 'AVAILABILITY_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: availability,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Set availability' })
  @UseGuards(RolesGuard)
  @Roles('CONSULTANT', 'ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Availability set successfully' })
  async setAvailability(@Body() setAvailabilityDto: SetAvailabilityDto): Promise<ApiResponse<any>> {
    const availability = await this.availabilityService.setAvailability(setAvailabilityDto);
    return {
      success: true,
      data: availability,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update availability' })
  @UseGuards(RolesGuard)
  @Roles('CONSULTANT', 'ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Availability updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateData: any
  ): Promise<ApiResponse<any>> {
    const availability = await this.availabilityService.update(id, updateData);
    if (!availability) {
      return {
        success: false,
        message: 'Availability not found',
        error: 'AVAILABILITY_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: availability,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete availability' })
  @UseGuards(RolesGuard)
  @Roles('CONSULTANT', 'ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Availability deleted successfully' })
  async remove(@Param('id') id: string): Promise<ApiResponse<void>> {
    await this.availabilityService.remove(id);
    return {
      success: true,
      data: undefined,
      message: 'Availability deleted successfully',
    };
  }

  @Get('consultant/:consultantId')
  @ApiOperation({ summary: 'Get availability by consultant ID' })
  @SwaggerApiResponse({ status: 200, description: 'Consultant availability retrieved successfully' })
  async findByConsultant(
    @Param('consultantId') consultantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const availability = await this.availabilityService.findByConsultant(consultantId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return {
      success: true,
      data: availability,
    };
  }

  @Get('showroom/:showroomId')
  @ApiOperation({ summary: 'Get availability by showroom ID' })
  @SwaggerApiResponse({ status: 200, description: 'Showroom availability retrieved successfully' })
  async findByShowroom(
    @Param('showroomId') showroomId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const availability = await this.availabilityService.findByShowroom(showroomId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return {
      success: true,
      data: availability,
    };
  }

  @Post('bulk-set')
  @ApiOperation({ summary: 'Bulk set availability' })
  @UseGuards(RolesGuard)
  @Roles('CONSULTANT', 'ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Bulk availability set successfully' })
  async bulkSetAvailability(@Body() bulkData: { consultantId: string; availability: any[] }): Promise<ApiResponse<any>> {
    const result = await this.availabilityService.bulkSetAvailability(bulkData.consultantId, bulkData.availability);
    return {
      success: true,
      data: result,
    };
  }
}
