import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/common/decorators/current-user.decorator';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('support')
@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  @ApiOperation({ summary: 'Get all support tickets' })
  @SwaggerApiResponse({ status: 200, description: 'Support tickets retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('customerId') customerId?: string,
    @Query('assignedTo') assignedTo?: string
  ): Promise<ApiResponse<any>> {
    const tickets = await this.supportService.findAll({
      page,
      limit,
      status,
      priority,
      customerId,
      assignedTo,
    });
    return {
      success: true,
      data: tickets,
    };
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get support ticket by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Support ticket retrieved successfully' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const ticket = await this.supportService.findById(id, user);
    if (!ticket) {
      return {
        success: false,
        message: 'Support ticket not found',
        error: 'SUPPORT_TICKET_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: ticket,
    };
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Create new support ticket' })
  @SwaggerApiResponse({ status: 201, description: 'Support ticket created successfully' })
  async create(@Body() createTicketDto: CreateTicketDto, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const ticket = await this.supportService.create(createTicketDto, user);
    return {
      success: true,
      data: ticket,
    };
  }

  @Put('tickets/:id')
  @ApiOperation({ summary: 'Update support ticket' })
  @SwaggerApiResponse({ status: 200, description: 'Support ticket updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const ticket = await this.supportService.update(id, updateTicketDto, user);
    if (!ticket) {
      return {
        success: false,
        message: 'Support ticket not found or cannot be updated',
        error: 'SUPPORT_TICKET_NOT_FOUND_OR_NOT_UPDATABLE',
      };
    }
    return {
      success: true,
      data: ticket,
    };
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Add message to support ticket' })
  @SwaggerApiResponse({ status: 201, description: 'Message added successfully' })
  async addMessage(
    @Param('id') id: string,
    @Body() body: { content: string; attachments?: string[]; isInternal?: boolean },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const message = await this.supportService.addMessage(id, {
      content: body.content,
      attachments: body.attachments,
      isInternal: body.isInternal || false,
    }, user);
    if (!message) {
      return {
        success: false,
        message: 'Support ticket not found',
        error: 'SUPPORT_TICKET_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: message,
    };
  }

  @Get('tickets/:id/messages')
  @ApiOperation({ summary: 'Get ticket messages' })
  @SwaggerApiResponse({ status: 200, description: 'Ticket messages retrieved successfully' })
  async getMessages(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const messages = await this.supportService.getMessages(id, user);
    if (!messages) {
      return {
        success: false,
        message: 'Support ticket not found',
        error: 'SUPPORT_TICKET_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: messages,
    };
  }

  @Post('tickets/:id/assign')
  @ApiOperation({ summary: 'Assign support ticket' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Support ticket assigned successfully' })
  async assign(
    @Param('id') id: string,
    @Body() body: { assignedTo: string; notes?: string }
  ): Promise<ApiResponse<any>> {
    const ticket = await this.supportService.assign(id, body.assignedTo, body.notes);
    if (!ticket) {
      return {
        success: false,
        message: 'Support ticket not found',
        error: 'SUPPORT_TICKET_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: ticket,
    };
  }

  @Post('tickets/:id/close')
  @ApiOperation({ summary: 'Close support ticket' })
  @SwaggerApiResponse({ status: 200, description: 'Support ticket closed successfully' })
  async close(
    @Param('id') id: string,
    @Body() body: { resolution?: string; satisfaction?: number; notes?: string },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const ticket = await this.supportService.close(id, {
      resolution: body.resolution,
      satisfaction: body.satisfaction,
      notes: body.notes,
    }, user);
    if (!ticket) {
      return {
        success: false,
        message: 'Support ticket not found or cannot be closed',
        error: 'SUPPORT_TICKET_NOT_FOUND_OR_NOT_CLOSABLE',
      };
    }
    return {
      success: true,
      data: ticket,
    };
  }

  @Post('tickets/:id/reopen')
  @ApiOperation({ summary: 'Reopen support ticket' })
  @SwaggerApiResponse({ status: 200, description: 'Support ticket reopened successfully' })
  async reopen(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const ticket = await this.supportService.reopen(id, body.reason, user);
    if (!ticket) {
      return {
        success: false,
        message: 'Support ticket not found or cannot be reopened',
        error: 'SUPPORT_TICKET_NOT_FOUND_OR_NOT_REOPENABLE',
      };
    }
    return {
      success: true,
      data: ticket,
    };
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get customer support tickets' })
  @SwaggerApiResponse({ status: 200, description: 'Customer support tickets retrieved successfully' })
  async findByCustomer(
    @Param('customerId') customerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const tickets = await this.supportService.findByCustomer(customerId, {
      page,
      limit,
      status,
    }, user);
    return {
      success: true,
      data: tickets,
    };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get support statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Support statistics retrieved successfully' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('assignedTo') assignedTo?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.supportService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      assignedTo
    );
    return {
      success: true,
      data: stats,
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get support categories' })
  @SwaggerApiResponse({ status: 200, description: 'Support categories retrieved successfully' })
  async getCategories(): Promise<ApiResponse<any>> {
    const categories = await this.supportService.getCategories();
    return {
      success: true,
      data: categories,
    };
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update support tickets' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Support tickets bulk updated successfully' })
  async bulkUpdate(@Body() body: { ticketIds: string[]; updateData: UpdateTicketDto }): Promise<ApiResponse<any>> {
    const result = await this.supportService.bulkUpdate(body.ticketIds, body.updateData);
    return {
      success: true,
      data: result,
    };
  }
}
