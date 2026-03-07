import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/common/decorators/current-user.decorator';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { FilterAppointmentDto } from './dto/filter-appointment.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all appointments' })
  @SwaggerApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('consultantId') consultantId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const appointments = await this.appointmentsService.findAll({
      page,
      limit,
      status,
      consultantId,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      user,
    });
    return {
      success: true,
      data: appointments,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Appointment retrieved successfully' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const appointment = await this.appointmentsService.findById(id, user);
    if (!appointment) {
      return {
        success: false,
        message: 'Appointment not found',
        error: 'APPOINTMENT_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: appointment,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new appointment' })
  @SwaggerApiResponse({ status: 201, description: 'Appointment created successfully' })
  async create(@Body() createAppointmentDto: CreateAppointmentDto, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const appointment = await this.appointmentsService.create(createAppointmentDto, user);
    return {
      success: true,
      data: appointment,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update appointment' })
  @SwaggerApiResponse({ status: 200, description: 'Appointment updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const appointment = await this.appointmentsService.update(id, updateAppointmentDto, user);
    if (!appointment) {
      return {
        success: false,
        message: 'Appointment not found',
        error: 'APPOINTMENT_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: appointment,
    };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel appointment' })
  @SwaggerApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  async cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const appointment = await this.appointmentsService.cancel(id, body.reason, user);
    if (!appointment) {
      return {
        success: false,
        message: 'Appointment not found or cannot be cancelled',
        error: 'APPOINTMENT_NOT_FOUND_OR_NOT_CANCELLABLE',
      };
    }
    return {
      success: true,
      data: appointment,
    };
  }

  @Post(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule appointment' })
  @SwaggerApiResponse({ status: 200, description: 'Appointment rescheduled successfully' })
  async reschedule(
    @Param('id') id: string,
    @Body() body: { newDateTime: Date; reason?: string },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const appointment = await this.appointmentsService.reschedule(id, body.newDateTime, body.reason, user);
    if (!appointment) {
      return {
        success: false,
        message: 'Appointment not found or cannot be rescheduled',
        error: 'APPOINTMENT_NOT_FOUND_OR_NOT_RESCHEDULABLE',
      };
    }
    return {
      success: true,
      data: appointment,
    };
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get appointment history' })
  @SwaggerApiResponse({ status: 200, description: 'Appointment history retrieved successfully' })
  async getHistory(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const history = await this.appointmentsService.getHistory(id, user);
    return {
      success: true,
      data: history,
    };
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm appointment' })
  @SwaggerApiResponse({ status: 200, description: 'Appointment confirmed successfully' })
  async confirm(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const appointment = await this.appointmentsService.confirm(id, user);
    if (!appointment) {
      return {
        success: false,
        message: 'Appointment not found',
        error: 'APPOINTMENT_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: appointment,
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get appointments by user ID' })
  @SwaggerApiResponse({ status: 200, description: 'User appointments retrieved successfully' })
  async findByUser(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const appointments = await this.appointmentsService.findByUser(userId, { page, limit, status }, user);
    return {
      success: true,
      data: appointments,
    };
  }

  @Get('consultant/:consultantId')
  @ApiOperation({ summary: 'Get appointments by consultant ID' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Consultant appointments retrieved successfully' })
  async findByConsultant(
    @Param('consultantId') consultantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const appointments = await this.appointmentsService.findByConsultant(consultantId, {
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

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get appointment statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Appointment statistics retrieved successfully' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('consultantId') consultantId?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.appointmentsService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      consultantId
    );
    return {
      success: true,
      data: stats,
    };
  }
}
