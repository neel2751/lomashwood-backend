import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/common/decorators/current-user.decorator';
import { LoyaltyService } from './loyalty.service';
import { AdjustLoyaltyDto } from './dto/adjust-loyalty.dto';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('loyalty')
@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'Get all loyalty accounts' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Loyalty accounts retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('tier') tier?: string,
    @Query('status') status?: string
  ): Promise<ApiResponse<any>> {
    const accounts = await this.loyaltyService.findAll({
      page,
      limit,
      tier,
      status,
    });
    return {
      success: true,
      data: accounts,
    };
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get loyalty account by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Loyalty account retrieved successfully' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const account = await this.loyaltyService.findById(id, user);
    if (!account) {
      return {
        success: false,
        message: 'Loyalty account not found',
        error: 'LOYALTY_ACCOUNT_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: account,
    };
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get customer loyalty account' })
  @SwaggerApiResponse({ status: 200, description: 'Customer loyalty account retrieved successfully' })
  async findByCustomer(
    @Param('customerId') customerId: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const account = await this.loyaltyService.findByCustomer(customerId, user);
    if (!account) {
      return {
        success: false,
        message: 'Loyalty account not found',
        error: 'LOYALTY_ACCOUNT_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: account,
    };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user loyalty profile' })
  @SwaggerApiResponse({ status: 200, description: 'Loyalty profile retrieved successfully' })
  async getProfile(@CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const profile = await this.loyaltyService.getProfile(user);
    if (!profile) {
      return {
        success: false,
        message: 'Loyalty profile not found',
        error: 'LOYALTY_PROFILE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: profile,
    };
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create loyalty account' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Loyalty account created successfully' })
  async create(@Body() createData: { customerId: string; initialPoints?: number }): Promise<ApiResponse<any>> {
    const account = await this.loyaltyService.create(createData.customerId, createData.initialPoints);
    return {
      success: true,
      data: account,
    };
  }

  @Post('accounts/:id/adjust')
  @ApiOperation({ summary: 'Adjust loyalty points' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Loyalty points adjusted successfully' })
  async adjustPoints(
    @Param('id') id: string,
    @Body() adjustLoyaltyDto: AdjustLoyaltyDto
  ): Promise<ApiResponse<any>> {
    const result = await this.loyaltyService.adjustPoints(id, adjustLoyaltyDto);
    if (!result) {
      return {
        success: false,
        message: 'Loyalty account not found',
        error: 'LOYALTY_ACCOUNT_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get loyalty transactions' })
  @SwaggerApiResponse({ status: 200, description: 'Loyalty transactions retrieved successfully' })
  async getTransactions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('accountId') accountId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const transactions = await this.loyaltyService.getTransactions({
      page,
      limit,
      accountId,
      type,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    }, user);
    return {
      success: true,
      data: transactions,
    };
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get loyalty transaction by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Loyalty transaction retrieved successfully' })
  async getTransaction(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const transaction = await this.loyaltyService.getTransaction(id, user);
    if (!transaction) {
      return {
        success: false,
        message: 'Loyalty transaction not found',
        error: 'LOYALTY_TRANSACTION_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: transaction,
    };
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem loyalty points' })
  @SwaggerApiResponse({ status: 200, description: 'Loyalty points redeemed successfully' })
  async redeem(
    @Body() body: { points: number; rewardId?: string; description?: string },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const result = await this.loyaltyService.redeemPoints(
      body.points,
      body.rewardId,
      body.description,
      user
    );
    if (!result) {
      return {
        success: false,
        message: 'Insufficient points or account not found',
        error: 'INSUFFICIENT_POINTS_OR_ACCOUNT_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Get('rewards')
  @ApiOperation({ summary: 'Get available rewards' })
  @SwaggerApiResponse({ status: 200, description: 'Available rewards retrieved successfully' })
  async getRewards(
    @Query('tier') tier?: string,
    @Query('category') category?: string
  ): Promise<ApiResponse<any>> {
    const rewards = await this.loyaltyService.getRewards(tier, category);
    return {
      success: true,
      data: rewards,
    };
  }

  @Get('tiers')
  @ApiOperation({ summary: 'Get loyalty tiers' })
  @SwaggerApiResponse({ status: 200, description: 'Loyalty tiers retrieved successfully' })
  async getTiers(): Promise<ApiResponse<any>> {
    const tiers = await this.loyaltyService.getTiers();
    return {
      success: true,
      data: tiers,
    };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get loyalty statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Loyalty statistics retrieved successfully' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tier') tier?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.loyaltyService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      tier
    );
    return {
      success: true,
      data: stats,
    };
  }

  @Post('bulk-adjust')
  @ApiOperation({ summary: 'Bulk adjust loyalty points' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Loyalty points bulk adjusted successfully' })
  async bulkAdjust(@Body() body: { adjustments: Array<{ accountId: string; points: number; reason: string }> }): Promise<ApiResponse<any>> {
    const result = await this.loyaltyService.bulkAdjust(body.adjustments);
    return {
      success: true,
      data: result,
    };
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get loyalty leaderboard' })
  @SwaggerApiResponse({ status: 200, description: 'Loyalty leaderboard retrieved successfully' })
  async getLeaderboard(
    @Query('limit') limit: number = 10,
    @Query('tier') tier?: string
  ): Promise<ApiResponse<any>> {
    const leaderboard = await this.loyaltyService.getLeaderboard(limit, tier);
    return {
      success: true,
      data: leaderboard,
    };
  }
}
