export interface WishlistItemDto {
  id: string;
  profileId: string;
  productId: string;
  productName: string;
  productSlug: string;
  notes: string | null;
  addedAt: string;
}

export interface AddToWishlistInput {
  productId: string;
  productName: string;
  productSlug: string;
  notes?: string;
}