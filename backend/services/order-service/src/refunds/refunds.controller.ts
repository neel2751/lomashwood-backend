import { Controller, Get, Post, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { RefundsService } from './refunds.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundDto } from './dto/update-refund.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('refunds')
@Controller('refunds')
@UseGuards(JwtAuthGuard)
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all refunds' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Refunds retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('orderId') orderId?: string,
    @Query('paymentId') paymentId?: string
  ): Promise<ApiResponse<any>> {
    const refunds = await this.refundsService.findAll({ page, limit, status, orderId, paymentId });
    return {
      success: true,
      data: refunds,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get refund by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Refund retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const refund = await this.refundsService.findById(id);
    if (!refund) {
      return {
        success: false,
        message: 'Refund not found',
        error: 'REFUND_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: refund,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new refund' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Refund created successfully' })
  async create(@Body() createRefundDto: CreateRefundDto): Promise<ApiResponse<any>> {
    const refund = await this.refundsService.create(createRefundDto);
    return {
      success: true,
      data: refund,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update refund' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Refund updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateRefundDto: UpdateRefundDto
  ): Promise<ApiResponse<any>> {
    const refund = await this.refundsService.update(id, updateRefundDto);
    if (!refund) {
      return {
        success: false,
        message: 'Refund not found',
        error: 'REFUND_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: refund,
    };
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Process refund' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Refund processed successfully' })
  async process(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string }
  ): Promise<ApiResponse<any>> {
    const refund = await this.refundsService.process(id, body.status, body.notes);
    if (!refund) {
      return {
        success: false,
        message: 'Refund not found',
        error: 'REFUND_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: refund,
    };
  }

  @Get('payment/:paymentId')
  @ApiOperation({ summary: 'Get refunds by payment ID' })
  @SwaggerApiResponse({ status: 200, description: 'Payment refunds retrieved successfully' })
  async findByPayment(@Param('paymentId') paymentId: string): Promise<ApiResponse<any[]>> {
    const refunds = await this.refundsService.findByPayment(paymentId);
    return {
      success: true,
      data: refunds,
    };
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get refunds by order ID' })
  @SwaggerApiResponse({ status: 200, description: 'Order refunds retrieved successfully' })
  async findByOrder(@Param('orderId') orderId: string): Promise<ApiResponse<any[]>> {
    const refunds = await this.refundsService.findByOrder(orderId);
    return {
      success: true,
      data: refunds,
    };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get refund statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Refund statistics retrieved successfully' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.refundsService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return {
      success: true,
      data: stats,
    };
  }
}
