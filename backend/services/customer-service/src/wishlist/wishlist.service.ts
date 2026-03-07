import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    customerId?: string;
    isPublic?: boolean;
    user?: any;
  }): Promise<{ wishlists: Wishlist[]; total: number; page: number; limit: number }> {
    const { page, limit, customerId, isPublic, user } = params;
    const skip = (page - 1) * limit;

    const query = this.wishlistRepository.createQueryBuilder('wishlist')
      .leftJoinAndSelect('wishlist.customer', 'customer')
      .leftJoinAndSelect('wishlist.items', 'items');

    // Apply user access control
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      query.andWhere('wishlist.customerId = :customerId', { customerId: user?.id });
    } else if (customerId) {
      query.andWhere('wishlist.customerId = :customerId', { customerId });
    }

    if (isPublic !== undefined) {
      query.andWhere('wishlist.isPublic = :isPublic', { isPublic });
    }

    const [wishlists, total] = await query
      .orderBy('wishlist.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      wishlists,
      total,
      page,
      limit,
    };
  }

  async findById(id: string, user?: any): Promise<Wishlist | null> {
    const query = this.wishlistRepository.createQueryBuilder('wishlist')
      .leftJoinAndSelect('wishlist.customer', 'customer')
      .leftJoinAndSelect('wishlist.items', 'items')
      .where('wishlist.id = :id', { id });

    // Apply user access control
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      query.andWhere('(wishlist.customerId = :customerId OR wishlist.isPublic = :isPublic)', {
        customerId: user?.id,
        isPublic: true,
      });
    }

    return query.getOne();
  }

  async findByCustomer(customerId: string, params: {
    page: number;
    limit: number;
  }, user?: any): Promise<{ wishlists: Wishlist[]; total: number; page: number; limit: number }> {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    // Apply user access control
    const targetCustomerId = (user?.role !== 'ADMIN' && user?.role !== 'STAFF') ? user?.id : customerId;

    const [wishlists, total] = await this.wishlistRepository.createQueryBuilder('wishlist')
      .leftJoinAndSelect('wishlist.items', 'items')
      .where('wishlist.customerId = :customerId', { customerId: targetCustomerId })
      .orderBy('wishlist.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      wishlists,
      total,
      page,
      limit,
    };
  }

  async create(createData: {
    name: string;
    description?: string;
    isPublic?: boolean;
    items?: any[];
    customerId: string;
  }): Promise<Wishlist> {
    const wishlist = this.wishlistRepository.create({
      ...createData,
      isPublic: createData.isPublic || false,
      shareToken: this.generateShareToken(),
    });

    return this.wishlistRepository.save(wishlist);
  }

  async update(id: string, updateData: any, user?: any): Promise<Wishlist | null> {
    const wishlist = await this.findById(id, user);
    if (!wishlist) {
      return null;
    }

    // Check if user can update this wishlist
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF' && wishlist.customerId !== user?.id) {
      return null;
    }

    await this.wishlistRepository.update(id, {
      ...updateData,
      updatedAt: new Date(),
    });

    return this.findById(id, user);
  }

  async remove(id: string, user?: any): Promise<Wishlist | null> {
    const wishlist = await this.findById(id, user);
    if (!wishlist) {
      return null;
    }

    // Check if user can delete this wishlist
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF' && wishlist.customerId !== user?.id) {
      return null;
    }

    await this.wishlistRepository.delete(id);
    return wishlist;
  }

  async addItem(wishlistId: string, itemData: {
    productId: string;
    variantId?: string;
    quantity?: number;
    notes?: string;
    priority?: number;
    addedBy: string;
  }, user?: any): Promise<Wishlist | null> {
    const wishlist = await this.findById(wishlistId, user);
    if (!wishlist) {
      return null;
    }

    // Check if user can add items to this wishlist
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF' && wishlist.customerId !== user?.id) {
      return null;
    }

    // Check if item already exists
    const existingItem = wishlist.items?.find(item => 
      item.productId === itemData.productId && 
      item.variantId === itemData.variantId
    );

    if (existingItem) {
      return null; // Item already exists
    }

    const newItem = {
      id: this.generateItemId(),
      productId: itemData.productId,
      variantId: itemData.variantId,
      quantity: itemData.quantity || 1,
      notes: itemData.notes,
      priority: itemData.priority || 0,
      addedBy: itemData.addedBy,
      addedAt: new Date(),
    };

    const updatedItems = [...(wishlist.items || []), newItem];
    
    await this.wishlistRepository.update(wishlistId, {
      items: updatedItems,
      updatedAt: new Date(),
    });

    return this.findById(wishlistId, user);
  }

  async updateItem(wishlistId: string, itemId: string, updateData: any, user?: any): Promise<Wishlist | null> {
    const wishlist = await this.findById(wishlistId, user);
    if (!wishlist) {
      return null;
    }

    // Check if user can update items in this wishlist
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF' && wishlist.customerId !== user?.id) {
      return null;
    }

    const updatedItems = wishlist.items?.map(item => 
      item.id === itemId ? { ...item, ...updateData, updatedAt: new Date() } : item
    );

    await this.wishlistRepository.update(wishlistId, {
      items: updatedItems,
      updatedAt: new Date(),
    });

    return this.findById(wishlistId, user);
  }

  async removeItem(wishlistId: string, itemId: string, user?: any): Promise<Wishlist | null> {
    const wishlist = await this.findById(wishlistId, user);
    if (!wishlist) {
      return null;
    }

    // Check if user can remove items from this wishlist
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF' && wishlist.customerId !== user?.id) {
      return null;
    }

    const updatedItems = wishlist.items?.filter(item => item.id !== itemId);

    await this.wishlistRepository.update(wishlistId, {
      items: updatedItems,
      updatedAt: new Date(),
    });

    return this.findById(wishlistId, user);
  }

  async share(wishlistId: string, shareData: {
    emails: string[];
    message?: string;
    expiresIn?: number;
    sharedBy: string;
  }, user?: any): Promise<any> {
    const wishlist = await this.findById(wishlistId, user);
    if (!wishlist) {
      return null;
    }

    // Check if user can share this wishlist
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF' && wishlist.customerId !== user?.id) {
      return null;
    }

    const shareToken = this.generateShareToken();
    const expiresAt = shareData.expiresIn 
      ? new Date(Date.now() + shareData.expiresIn * 24 * 60 * 60 * 1000)
      : null;

    await this.wishlistRepository.update(wishlistId, {
      isPublic: true,
      shareToken,
      shareExpiresAt: expiresAt,
      sharedAt: new Date(),
      sharedBy: shareData.sharedBy,
      updatedAt: new Date(),
    });

    // Here you would integrate with an email service to send the share emails
    // For now, just return the share information
    return {
      shareToken,
      expiresAt,
      sharedAt: new Date(),
    };
  }

  async copy(wishlistId: string, copyData: {
    name?: string;
    description?: string;
    copiedBy: string;
  }, user?: any): Promise<Wishlist | null> {
    const originalWishlist = await this.findById(wishlistId, user);
    if (!originalWishlist) {
      return null;
    }

    const newWishlist = this.wishlistRepository.create({
      name: copyData.name || `Copy of ${originalWishlist.name}`,
      description: copyData.description || originalWishlist.description,
      customerId: user?.id,
      items: originalWishlist.items,
      isPublic: false,
      shareToken: this.generateShareToken(),
      copiedFrom: wishlistId,
      copiedBy: copyData.copiedBy,
      copiedAt: new Date(),
    });

    return this.wishlistRepository.save(newWishlist);
  }

  async findByShareToken(shareToken: string): Promise<Wishlist | null> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { shareToken, isPublic: true },
      relations: ['customer'],
    });

    // Check if share token has expired
    if (wishlist?.shareExpiresAt && wishlist.shareExpiresAt < new Date()) {
      return null;
    }

    return wishlist;
  }

  async getStats(
    startDate?: Date,
    endDate?: Date,
    customerId?: string
  ): Promise<{
    totalWishlists: number;
    publicWishlists: number;
    privateWishlists: number;
    totalItems: number;
    averageItemsPerWishlist: number;
    mostActiveCustomers: any[];
  }> {
    const query = this.wishlistRepository.createQueryBuilder('wishlist')
      .leftJoinAndSelect('wishlist.customer', 'customer');

    if (startDate) {
      query.andWhere('wishlist.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('wishlist.createdAt <= :endDate', { endDate });
    }

    if (customerId) {
      query.andWhere('wishlist.customerId = :customerId', { customerId });
    }

    const wishlists = await query.getMany();

    const totalWishlists = wishlists.length;
    const publicWishlists = wishlists.filter(w => w.isPublic).length;
    const privateWishlists = totalWishlists - publicWishlists;

    const totalItems = wishlists.reduce((sum, wishlist) => 
      sum + (wishlist.items?.length || 0), 0
    );

    const averageItemsPerWishlist = totalWishlists > 0 ? totalItems / totalWishlists : 0;

    // Get most active customers (customers with most wishlists)
    const customerStats = wishlists.reduce((acc, wishlist) => {
      acc[wishlist.customerId] = (acc[wishlist.customerId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveCustomers = Object.entries(customerStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([customerId, count]) => ({ customerId, count }));

    return {
      totalWishlists,
      publicWishlists,
      privateWishlists,
      totalItems,
      averageItemsPerWishlist,
      mostActiveCustomers,
    };
  }

  private generateShareToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateItemId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
