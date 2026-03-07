import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { ConsultantsService } from './consultants.service';
import { CreateConsultantDto } from './dto/create-consultant.dto';
import { UpdateConsultantDto } from './dto/update-consultant.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('consultants')
@Controller('consultants')
@UseGuards(JwtAuthGuard)
export class ConsultantsController {
  constructor(private readonly consultantsService: ConsultantsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all consultants' })
  @SwaggerApiResponse({ status: 200, description: 'Consultants retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('specialization') specialization?: string,
    @Query('showroomId') showroomId?: string,
    @Query('isActive') isActive?: boolean
  ): Promise<ApiResponse<any>> {
    const consultants = await this.consultantsService.findAll({
      page,
      limit,
      specialization,
      showroomId,
      isActive,
    });
    return {
      success: true,
      data: consultants,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get consultant by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Consultant retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const consultant = await this.consultantsService.findById(id);
    if (!consultant) {
      return {
        success: false,
        message: 'Consultant not found',
        error: 'CONSULTANT_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: consultant,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new consultant' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Consultant created successfully' })
  async create(@Body() createConsultantDto: CreateConsultantDto): Promise<ApiResponse<any>> {
    const consultant = await this.consultantsService.create(createConsultantDto);
    return {
      success: true,
      data: consultant,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update consultant' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Consultant updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateConsultantDto: UpdateConsultantDto
  ): Promise<ApiResponse<any>> {
    const consultant = await this.consultantsService.update(id, updateConsultantDto);
    if (!consultant) {
      return {
        success: false,
        message: 'Consultant not found',
        error: 'CONSULTANT_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: consultant,
    };
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get consultant availability' })
  @SwaggerApiResponse({ status: 200, description: 'Consultant availability retrieved successfully' })
  async getAvailability(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const availability = await this.consultantsService.getAvailability(id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return {
      success: true,
      data: availability,
    };
  }

  @Get(':id/appointments')
  @ApiOperation({ summary: 'Get consultant appointments' })
  @SwaggerApiResponse({ status: 200, description: 'Consultant appointments retrieved successfully' })
  async getAppointments(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const appointments = await this.consultantsService.getAppointments(id, {
      page,
      limit,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return {
      success: true,
      data: appointments,
    };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get consultant statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Consultant statistics retrieved successfully' })
  async getStats(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.consultantsService.getStats(id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return {
      success: true,
      data: stats,
    };
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update consultant status' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Consultant status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean; reason?: string }
  ): Promise<ApiResponse<any>> {
    const consultant = await this.consultantsService.updateStatus(id, body.isActive, body.reason);
    if (!consultant) {
      return {
        success: false,
        message: 'Consultant not found',
        error: 'CONSULTANT_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: consultant,
    };
  }

  @Get('specializations')
  @ApiOperation({ summary: 'Get all specializations' })
  @SwaggerApiResponse({ status: 200, description: 'Specializations retrieved successfully' })
  async getSpecializations(): Promise<ApiResponse<any>> {
    const specializations = await this.consultantsService.getSpecializations();
    return {
      success: true,
      data: specializations,
    };
  }

  @Get('showroom/:showroomId')
  @ApiOperation({ summary: 'Get consultants by showroom' })
  @SwaggerApiResponse({ status: 200, description: 'Showroom consultants retrieved successfully' })
  async findByShowroom(
    @Param('showroomId') showroomId: string,
    @Query('specialization') specialization?: string,
    @Query('isActive') isActive?: boolean
  ): Promise<ApiResponse<any>> {
    const consultants = await this.consultantsService.findByShowroom(showroomId, {
      specialization,
      isActive,
    });
    return {
      success: true,
      data: consultants,
    };
  }
}
