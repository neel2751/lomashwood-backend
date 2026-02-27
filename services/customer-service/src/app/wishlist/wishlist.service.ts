import { WishlistRepository } from './wishlist.repository';
import { ProfileRepository } from '../profiles/profile.repository';
import { toWishlistItemDto } from './wishlist.mapper';
import { WishlistItemDto, AddToWishlistInput } from './wishlist.types';
import { NotFoundError, ConflictError, ValidationError } from '../../shared/errors';
import { publishEvent } from '../../infrastructure/messaging/event-producer';
import { CUSTOMER_TOPICS } from '../../infrastructure/messaging/event-topics';
import { createEventMetadata } from '../../infrastructure/messaging/event-metadata';
import { WISHLIST_CONSTANTS } from './wishlist.constants';

export class WishlistService {
  constructor(
    private readonly wishlistRepo: WishlistRepository,
    private readonly profileRepo: ProfileRepository,
  ) {}

  async getWishlist(userId: string): Promise<WishlistItemDto[]> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');

    const items = await this.wishlistRepo.findByProfileId(profile.id);
    return items.map(toWishlistItemDto);
  }

  async addItem(userId: string, input: AddToWishlistInput): Promise<WishlistItemDto> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');

    const existing = await this.wishlistRepo.findByProfileAndProduct(profile.id, input.productId);
    if (existing) throw new ConflictError('Product already in wishlist');

    const count = await this.wishlistRepo.count(profile.id);
    if (count >= WISHLIST_CONSTANTS.MAX_ITEMS) {
      throw new ValidationError(`Wishlist cannot exceed ${WISHLIST_CONSTANTS.MAX_ITEMS} items`);
    }

    const item = await this.wishlistRepo.add(profile.id, input);

    await publishEvent(CUSTOMER_TOPICS.WISHLIST_UPDATED, profile.id, {
      ...createEventMetadata(CUSTOMER_TOPICS.WISHLIST_UPDATED),
      profileId: profile.id,
      action: 'added',
      productId: input.productId,
    });

    return toWishlistItemDto(item);
  }

  async removeItem(userId: string, productId: string): Promise<void> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');

    const existing = await this.wishlistRepo.findByProfileAndProduct(profile.id, productId);
    if (!existing) throw new NotFoundError('Wishlist item');

    await this.wishlistRepo.remove(profile.id, productId);

    await publishEvent(CUSTOMER_TOPICS.WISHLIST_UPDATED, profile.id, {
      ...createEventMetadata(CUSTOMER_TOPICS.WISHLIST_UPDATED),
      profileId: profile.id,
      action: 'removed',
      productId,
    });
  }

  async clearWishlist(userId: string): Promise<void> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');
    await this.wishlistRepo.clear(profile.id);
  }
}