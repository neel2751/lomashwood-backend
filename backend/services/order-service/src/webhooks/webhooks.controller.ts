import { Controller, Post, Body, Headers, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { PaymentsService } from '../payments/payments.service';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('stripe')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async stripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Body() webhookData: any
  ): Promise<ApiResponse<any>> {
    try {
      const result = await this.paymentsService.handleStripeWebhook(signature, webhookData);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Webhook processing failed',
        error: 'WEBHOOK_PROCESSING_FAILED',
      };
    }
  }

  @Post('razorpay')
  @ApiOperation({ summary: 'Razorpay webhook handler' })
  async razorpayWebhook(
    @Headers() headers: any,
    @Body() webhookData: any
  ): Promise<ApiResponse<any>> {
    try {
      const result = await this.paymentsService.handleRazorpayWebhook(headers, webhookData);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Webhook processing failed',
        error: 'WEBHOOK_PROCESSING_FAILED',
      };
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Webhook health check' })
  async health(): Promise<ApiResponse<any>> {
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'webhooks',
      },
    };
  }

  @Post('test')
  @ApiOperation({ summary: 'Test webhook endpoint' })
  async testWebhook(@Body() testData: any): Promise<ApiResponse<any>> {
    return {
      success: true,
      data: {
        received: testData,
        processed: true,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
