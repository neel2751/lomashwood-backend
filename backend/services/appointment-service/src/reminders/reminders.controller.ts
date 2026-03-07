import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/common/decorators/current-user.decorator';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('reminders')
@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reminders' })
  @SwaggerApiResponse({ status: 200, description: 'Reminders retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const reminders = await this.remindersService.findAll({
      page,
      limit,
      type,
      status,
      userId,
      user,
    });
    return {
      success: true,
      data: reminders,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reminder by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Reminder retrieved successfully' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const reminder = await this.remindersService.findById(id, user);
    if (!reminder) {
      return {
        success: false,
        message: 'Reminder not found',
        error: 'REMINDER_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: reminder,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new reminder' })
  @SwaggerApiResponse({ status: 201, description: 'Reminder created successfully' })
  async create(@Body() createReminderDto: CreateReminderDto, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const reminder = await this.remindersService.create(createReminderDto, user);
    return {
      success: true,
      data: reminder,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update reminder' })
  @SwaggerApiResponse({ status: 200, description: 'Reminder updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateData: any,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const reminder = await this.remindersService.update(id, updateData, user);
    if (!reminder) {
      return {
        success: false,
        message: 'Reminder not found',
        error: 'REMINDER_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: reminder,
    };
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send reminder now' })
  @SwaggerApiResponse({ status: 200, description: 'Reminder sent successfully' })
  async send(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const result = await this.remindersService.send(id, user);
    if (!result) {
      return {
        success: false,
        message: 'Reminder not found or cannot be sent',
        error: 'REMINDER_NOT_FOUND_OR_NOT_SENDABLE',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark reminder as completed' })
  @SwaggerApiResponse({ status: 200, description: 'Reminder marked as completed successfully' })
  async complete(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const reminder = await this.remindersService.complete(id, user);
    if (!reminder) {
      return {
        success: false,
        message: 'Reminder not found',
        error: 'REMINDER_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: reminder,
    };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel reminder' })
  @SwaggerApiResponse({ status: 200, description: 'Reminder cancelled successfully' })
  async cancel(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const reminder = await this.remindersService.cancel(id, user);
    if (!reminder) {
      return {
        success: false,
        message: 'Reminder not found',
        error: 'REMINDER_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: reminder,
    };
  }

  @Get('appointment/:appointmentId')
  @ApiOperation({ summary: 'Get reminders by appointment ID' })
  @SwaggerApiResponse({ status: 200, description: 'Appointment reminders retrieved successfully' })
  async findByAppointment(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const reminders = await this.remindersService.findByAppointment(appointmentId, user);
    return {
      success: true,
      data: reminders,
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get reminders by user ID' })
  @SwaggerApiResponse({ status: 200, description: 'User reminders retrieved successfully' })
  async findByUser(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const reminders = await this.remindersService.findByUser(userId, {
      page,
      limit,
      type,
      status,
    }, user);
    return {
      success: true,
      data: reminders,
    };
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming reminders' })
  @SwaggerApiResponse({ status: 200, description: 'Upcoming reminders retrieved successfully' })
  async getUpcoming(
    @Query('hours') hours: number = 24,
    @Query('userId') userId?: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const reminders = await this.remindersService.getUpcoming(hours, userId, user);
    return {
      success: true,
      data: reminders,
    };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get reminder statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Reminder statistics retrieved successfully' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.remindersService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      userId
    );
    return {
      success: true,
      data: stats,
    };
  }
}
