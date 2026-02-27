import { Request, Response, NextFunction } from 'express';
import { WishlistService } from './wishlist.service';
import { addToWishlistSchema } from './wishlist.schemas';

export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  getWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const items = await this.wishlistService.getWishlist(userId);
      res.status(200).json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  };

  addItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const input = addToWishlistSchema.parse(req.body);
      const item = await this.wishlistService.addItem(userId, input);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  };

  removeItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      await this.wishlistService.removeItem(userId, req.params.productId!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  clearWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      await this.wishlistService.clearWishlist(userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}