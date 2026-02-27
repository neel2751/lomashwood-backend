import { Wishlist, WishlistItem, WishlistVisibility } from '@prisma/client';
import { FIXED_DATE, FIXED_IDS, dateAgo } from './common.fixture';

export const wishlistFixtures = {
  private: {
    id: FIXED_IDS.wishlist1,
    customerId: FIXED_IDS.customer1,
    name: 'Dream Kitchen',
    visibility: WishlistVisibility.PRIVATE,
    deletedAt: null,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  } satisfies Wishlist,

  public: {
    id: 'wsl-00000000-0000-0000-0000-000000000002',
    customerId: FIXED_IDS.customer1,
    name: 'Bedroom Inspiration',
    visibility: WishlistVisibility.PUBLIC,
    deletedAt: null,
    createdAt: dateAgo(15),
    updatedAt: dateAgo(5),
  } satisfies Wishlist,

  deleted: {
    id: 'wsl-00000000-0000-0000-0000-000000000099',
    customerId: FIXED_IDS.customer1,
    name: 'Old Wishlist',
    visibility: WishlistVisibility.PRIVATE,
    deletedAt: dateAgo(30),
    createdAt: dateAgo(60),
    updatedAt: dateAgo(30),
  } satisfies Wishlist,
};

export const wishlistItemFixtures = {
  item1: {
    id: FIXED_IDS.wishlistItem1,
    wishlistId: FIXED_IDS.wishlist1,
    productId: FIXED_IDS.product1,
    notes: 'Love the walnut finish',
    createdAt: FIXED_DATE,
  } satisfies WishlistItem,

  item2: {
    id: 'wsi-00000000-0000-0000-0000-000000000002',
    wishlistId: FIXED_IDS.wishlist1,
    productId: FIXED_IDS.product2,
    notes: null,
    createdAt: dateAgo(5),
  } satisfies WishlistItem,
};

export const createWishlistDto = {
  name: 'New Wishlist',
  visibility: 'PRIVATE' as const,
};

export const addWishlistItemDto = {
  productId: FIXED_IDS.product1,
  notes: 'Interested in this item',
};