import { Router } from 'express';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { WishlistRepository } from './wishlist.repository';
import { ProfileRepository } from '../profiles/profile.repository';

const wishlistRepo = new WishlistRepository();
const profileRepo = new ProfileRepository();
const wishlistService = new WishlistService(wishlistRepo, profileRepo);
const wishlistController = new WishlistController(wishlistService);

export const wishlistRouter = Router();
export default wishlistRouter;

wishlistRouter.get('/', wishlistController.getWishlist);
wishlistRouter.post('/', wishlistController.addItem);
wishlistRouter.delete('/clear', wishlistController.clearWishlist);
wishlistRouter.delete('/:productId', wishlistController.removeItem);