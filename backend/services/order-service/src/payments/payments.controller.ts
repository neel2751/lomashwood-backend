import { Controller, Get, Post, Put, Body, Param, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create payment' })
  @SwaggerApiResponse({ status: 201, description: 'Payment created successfully' })
  async create(@Body() createPaymentDto: CreatePaymentDto): Promise<ApiResponse<any>> {
    const payment = await this.paymentsService.create(createPaymentDto);
    return {
      success: true,
      data: payment,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const payment = await this.paymentsService.findById(id);
    if (!payment) {
      return {
        success: false,
        message: 'Payment not found',
        error: 'PAYMENT_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: payment,
    };
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update payment status' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Payment status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string }
  ): Promise<ApiResponse<any>> {
    const payment = await this.paymentsService.updateStatus(id, body.status, body.notes);
    if (!payment) {
      return {
        success: false,
        message: 'Payment not found',
        error: 'PAYMENT_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: payment,
    };
  }

  @Post('stripe/webhook')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async stripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Body() webhookData: any
  ): Promise<ApiResponse<any>> {
    const result = await this.paymentsService.handleStripeWebhook(signature, webhookData);
    return {
      success: true,
      data: result,
    };
  }

  @Post('razorpay/webhook')
  @ApiOperation({ summary: 'Razorpay webhook handler' })
  async razorpayWebhook(
    @Headers() headers: any,
    @Body() webhookData: any
  ): Promise<ApiResponse<any>> {
    const result = await this.paymentsService.handleRazorpayWebhook(headers, webhookData);
    return {
      success: true,
      data: result,
    };
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get payments by order ID' })
  @SwaggerApiResponse({ status: 200, description: 'Order payments retrieved successfully' })
  async findByOrder(@Param('orderId') orderId: string): Promise<ApiResponse<any[]>> {
    const payments = await this.paymentsService.findByOrder(orderId);
    return {
      success: true,
      data: payments,
    };
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund payment' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Payment refunded successfully' })
  async refund(
    @Param('id') id: string,
    @Body() body: { amount?: number; reason?: string }
  ): Promise<ApiResponse<any>> {
    const refund = await this.paymentsService.refund(id, body.amount, body.reason);
    if (!refund) {
      return {
        success: false,
        message: 'Payment not found or cannot be refunded',
        error: 'REFUND_FAILED',
      };
    }
    return {
      success: true,
      data: refund,
    };
  }

  @Get('order/:orderId/summary')
  @ApiOperation({ summary: 'Get payment summary for order' })
  @SwaggerApiResponse({ status: 200, description: 'Payment summary retrieved successfully' })
  async getOrderPaymentSummary(@Param('orderId') orderId: string): Promise<ApiResponse<any>> {
    const summary = await this.paymentsService.getOrderPaymentSummary(orderId);
    return {
      success: true,
      data: summary,
    };
  }
}
