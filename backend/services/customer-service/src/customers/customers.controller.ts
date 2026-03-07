import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/common/decorators/current-user.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('membershipTier') membershipTier?: string
  ): Promise<ApiResponse<any>> {
    const customers = await this.customersService.findAll({
      page,
      limit,
      search,
      status,
      membershipTier,
    });
    return {
      success: true,
      data: customers,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const customer = await this.customersService.findById(id, user);
    if (!customer) {
      return {
        success: false,
        message: 'Customer not found',
        error: 'CUSTOMER_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: customer,
    };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current customer profile' })
  @SwaggerApiResponse({ status: 200, description: 'Customer profile retrieved successfully' })
  async getProfile(@CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const customer = await this.customersService.findByUserId(user?.id);
    if (!customer) {
      return {
        success: false,
        message: 'Customer profile not found',
        error: 'CUSTOMER_PROFILE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: customer,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new customer' })
  @SwaggerApiResponse({ status: 201, description: 'Customer created successfully' })
  async create(@Body() createCustomerDto: CreateCustomerDto): Promise<ApiResponse<any>> {
    const customer = await this.customersService.create(createCustomerDto);
    return {
      success: true,
      data: customer,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer' })
  @SwaggerApiResponse({ status: 200, description: 'Customer updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const customer = await this.customersService.update(id, updateCustomerDto, user);
    if (!customer) {
      return {
        success: false,
        message: 'Customer not found',
        error: 'CUSTOMER_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: customer,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @SwaggerApiResponse({ status: 200, description: 'Customer deleted successfully' })
  async remove(@Param('id') id: string): Promise<ApiResponse<void>> {
    await this.customersService.remove(id);
    return {
      success: true,
      data: undefined,
      message: 'Customer deleted successfully',
    };
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verify customer' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Customer verified successfully' })
  async verify(
    @Param('id') id: string,
    @Body() body: { verified: boolean; notes?: string }
  ): Promise<ApiResponse<any>> {
    const customer = await this.customersService.verify(id, body.verified, body.notes);
    if (!customer) {
      return {
        success: false,
        message: 'Customer not found',
        error: 'CUSTOMER_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: customer,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search customers' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Customers searched successfully' })
  async search(
    @Query('q') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('filters') filters?: string
  ): Promise<ApiResponse<any>> {
    const customers = await this.customersService.search(query, { page, limit, filters });
    return {
      success: true,
      data: customers,
    };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get customer statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Customer statistics retrieved successfully' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('membershipTier') membershipTier?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.customersService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      membershipTier
    );
    return {
      success: true,
      data: stats,
    };
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate customer' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Customer deactivated successfully' })
  async deactivate(
    @Param('id') id: string,
    @Body() body: { reason?: string }
  ): Promise<ApiResponse<any>> {
    const customer = await this.customersService.deactivate(id, body.reason);
    if (!customer) {
      return {
        success: false,
        message: 'Customer not found',
        error: 'CUSTOMER_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: customer,
    };
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate customer' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Customer reactivated successfully' })
  async reactivate(
    @Param('id') id: string,
    @Body() body: { reason?: string }
  ): Promise<ApiResponse<any>> {
    const customer = await this.customersService.reactivate(id, body.reason);
    if (!customer) {
      return {
        success: false,
        message: 'Customer not found',
        error: 'CUSTOMER_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: customer,
    };
  }
}
