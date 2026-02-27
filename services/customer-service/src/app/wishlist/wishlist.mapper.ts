import { WishlistItem } from '@prisma/client';
import { WishlistItemDto } from './wishlist.types';

export function toWishlistItemDto(item: WishlistItem): WishlistItemDto {
  return {
    id: item.id,
    profileId: item.profileId,
    productId: item.productId,
    productName: item.productName,
    productSlug: item.productSlug,
    notes: item.notes,
    addedAt: item.addedAt.toISOString(),
  };
}