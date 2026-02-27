import { WishlistItem } from '@prisma/client';
import { prismaClient } from '../../infrastructure/db/prisma.client';
import { AddToWishlistInput } from './wishlist.types';

export class WishlistRepository {
  async findByProfileId(profileId: string): Promise<WishlistItem[]> {
    return prismaClient.wishlistItem.findMany({
      where: { profileId },
      orderBy: { addedAt: 'desc' },
    });
  }

  async findByProfileAndProduct(profileId: string, productId: string): Promise<WishlistItem | null> {
    return prismaClient.wishlistItem.findUnique({
      where: { profileId_productId: { profileId, productId } },
    });
  }

  async add(profileId: string, input: AddToWishlistInput): Promise<WishlistItem> {
    return prismaClient.wishlistItem.create({
      data: { profileId, ...input },
    });
  }

  async remove(profileId: string, productId: string): Promise<void> {
    await prismaClient.wishlistItem.delete({
      where: { profileId_productId: { profileId, productId } },
    });
  }

  async count(profileId: string): Promise<number> {
    return prismaClient.wishlistItem.count({ where: { profileId } });
  }

  async clear(profileId: string): Promise<void> {
    await prismaClient.wishlistItem.deleteMany({ where: { profileId } });
  }
}