import { Controller, Get, Post, Put, Body, Param, UseGuards, Headers, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { InvoicesService } from './invoices.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('orderId') orderId?: string
  ): Promise<ApiResponse<any>> {
    const invoices = await this.invoicesService.findAll({ page, limit, status, orderId });
    return {
      success: true,
      data: invoices,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const invoice = await this.invoicesService.findById(id);
    if (!invoice) {
      return {
        success: false,
        message: 'Invoice not found',
        error: 'INVOICE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: invoice,
    };
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Get invoice PDF' })
  async getPdf(@Param('id') id: string): Promise<any> {
    const pdfBuffer = await this.invoicesService.generatePdf(id);
    if (!pdfBuffer) {
      return {
        success: false,
        message: 'Invoice not found',
        error: 'INVOICE_NOT_FOUND',
      };
    }
    
    return {
      success: true,
      data: pdfBuffer,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Generate new invoice' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Invoice generated successfully' })
  async generate(@Body() generateInvoiceDto: GenerateInvoiceDto): Promise<ApiResponse<any>> {
    const invoice = await this.invoicesService.generate(generateInvoiceDto);
    return {
      success: true,
      data: invoice,
    };
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send invoice via email' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Invoice sent successfully' })
  async send(
    @Param('id') id: string,
    @Body() body: { email?: string; subject?: string; message?: string }
  ): Promise<ApiResponse<any>> {
    const result = await this.invoicesService.sendInvoice(id, body.email, body.subject, body.message);
    return {
      success: true,
      data: result,
    };
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get invoices by order ID' })
  @SwaggerApiResponse({ status: 200, description: 'Order invoices retrieved successfully' })
  async findByOrder(@Param('orderId') orderId: string): Promise<ApiResponse<any[]>> {
    const invoices = await this.invoicesService.findByOrder(orderId);
    return {
      success: true,
      data: invoices,
    };
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update invoice status' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Invoice status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string }
  ): Promise<ApiResponse<any>> {
    const invoice = await this.invoicesService.updateStatus(id, body.status, body.notes);
    if (!invoice) {
      return {
        success: false,
        message: 'Invoice not found',
        error: 'INVOICE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: invoice,
    };
  }

  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Invoice marked as paid successfully' })
  async markAsPaid(
    @Param('id') id: string,
    @Body() body: { paymentDate?: Date; paymentMethod?: string; notes?: string }
  ): Promise<ApiResponse<any>> {
    const invoice = await this.invoicesService.markAsPaid(id, body);
    if (!invoice) {
      return {
        success: false,
        message: 'Invoice not found',
        error: 'INVOICE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: invoice,
    };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get invoice statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Invoice statistics retrieved successfully' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.invoicesService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return {
      success: true,
      data: stats,
    };
  }
}
