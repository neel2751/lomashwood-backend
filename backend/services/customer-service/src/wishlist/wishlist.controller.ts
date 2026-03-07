import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/common/decorators/current-user.decorator';
import { WishlistService } from './wishlist.service';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

@ApiTags('wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get all wishlists' })
  @SwaggerApiResponse({ status: 200, description: 'Wishlists retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('customerId') customerId?: string,
    @Query('isPublic') isPublic?: boolean,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const wishlists = await this.wishlistService.findAll({
      page,
      limit,
      customerId,
      isPublic,
      user,
    });
    return {
      success: true,
      data: wishlists,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get wishlist by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Wishlist retrieved successfully' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const wishlist = await this.wishlistService.findById(id, user);
    if (!wishlist) {
      return {
        success: false,
        message: 'Wishlist not found',
        error: 'WISHLIST_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: wishlist,
    };
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get customer wishlists' })
  @SwaggerApiResponse({ status: 200, description: 'Customer wishlists retrieved successfully' })
  async findByCustomer(
    @Param('customerId') customerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const wishlists = await this.wishlistService.findByCustomer(customerId, {
      page,
      limit,
    }, user);
    return {
      success: true,
      data: wishlists,
    };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user wishlists' })
  @SwaggerApiResponse({ status: 200, description: 'User wishlists retrieved successfully' })
  async getProfile(@CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const wishlists = await this.wishlistService.findByCustomer(user?.id, {
      page: 1,
      limit: 50,
    }, user);
    return {
      success: true,
      data: wishlists,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new wishlist' })
  @SwaggerApiResponse({ status: 201, description: 'Wishlist created successfully' })
  async create(
    @Body() createData: {
      name: string;
      description?: string;
      isPublic?: boolean;
      items?: any[];
    },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const wishlist = await this.wishlistService.create({
      ...createData,
      customerId: user?.id,
    });
    return {
      success: true,
      data: wishlist,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update wishlist' })
  @SwaggerApiResponse({ status: 200, description: 'Wishlist updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateData: any,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const wishlist = await this.wishlistService.update(id, updateData, user);
    if (!wishlist) {
      return {
        success: false,
        message: 'Wishlist not found or cannot be updated',
        error: 'WISHLIST_NOT_FOUND_OR_NOT_UPDATABLE',
      };
    }
    return {
      success: true,
      data: wishlist,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete wishlist' })
  @SwaggerApiResponse({ status: 200, description: 'Wishlist deleted successfully' })
  async remove(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const result = await this.wishlistService.remove(id, user);
    if (!result) {
      return {
        success: false,
        message: 'Wishlist not found or cannot be deleted',
        error: 'WISHLIST_NOT_FOUND_OR_NOT_DELETABLE',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add item to wishlist' })
  @SwaggerApiResponse({ status: 201, description: 'Item added to wishlist successfully' })
  async addItem(
    @Param('id') id: string,
    @Body() body: {
      productId: string;
      variantId?: string;
      quantity?: number;
      notes?: string;
      priority?: number;
    },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const result = await this.wishlistService.addItem(id, {
      ...body,
      addedBy: user?.id,
    }, user);
    if (!result) {
      return {
        success: false,
        message: 'Wishlist not found or item already exists',
        error: 'WISHLIST_NOT_FOUND_OR_ITEM_EXISTS',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Put(':id/items/:itemId')
  @ApiOperation({ summary: 'Update wishlist item' })
  @SwaggerApiResponse({ status: 200, description: 'Wishlist item updated successfully' })
  async updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() updateData: any,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const result = await this.wishlistService.updateItem(id, itemId, updateData, user);
    if (!result) {
      return {
        success: false,
        message: 'Wishlist or item not found',
        error: 'WISHLIST_OR_ITEM_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Remove item from wishlist' })
  @SwaggerApiResponse({ status: 200, description: 'Item removed from wishlist successfully' })
  async removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const result = await this.wishlistService.removeItem(id, itemId, user);
    if (!result) {
      return {
        success: false,
        message: 'Wishlist or item not found',
        error: 'WISHLIST_OR_ITEM_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share wishlist' })
  @SwaggerApiResponse({ status: 200, description: 'Wishlist shared successfully' })
  async share(
    @Param('id') id: string,
    @Body() body: {
      emails: string[];
      message?: string;
      expiresIn?: number;
    },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const result = await this.wishlistService.share(id, {
      ...body,
      sharedBy: user?.id,
    }, user);
    if (!result) {
      return {
        success: false,
        message: 'Wishlist not found or cannot be shared',
        error: 'WISHLIST_NOT_FOUND_OR_NOT_SHAREABLE',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/copy')
  @ApiOperation({ summary: 'Copy wishlist' })
  @SwaggerApiResponse({ status: 201, description: 'Wishlist copied successfully' })
  async copy(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const result = await this.wishlistService.copy(id, {
      ...body,
      copiedBy: user?.id,
    }, user);
    if (!result) {
      return {
        success: false,
        message: 'Wishlist not found or cannot be copied',
        error: 'WISHLIST_NOT_FOUND_OR_NOT_COPYABLE',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Get('public/:shareToken')
  @ApiOperation({ summary: 'Get public wishlist by share token' })
  @SwaggerApiResponse({ status: 200, description: 'Public wishlist retrieved successfully' })
  async getPublicWishlist(@Param('shareToken') shareToken: string): Promise<ApiResponse<any>> {
    const wishlist = await this.wishlistService.findByShareToken(shareToken);
    if (!wishlist) {
      return {
        success: false,
        message: 'Public wishlist not found or expired',
        error: 'PUBLIC_WISHLIST_NOT_FOUND_OR_EXPIRED',
      };
    }
    return {
      success: true,
      data: wishlist,
    };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get wishlist statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Wishlist statistics retrieved successfully' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('customerId') customerId?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.wishlistService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      customerId
    );
    return {
      success: true,
      data: stats,
    };
  }
}
