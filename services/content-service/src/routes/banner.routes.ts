import { Router } from 'express';
import {
  getBanners,
  getBannersAdmin,
  getBannerById,
  createBanner,
  updateBanner,
  reorderBanners,
  deleteBanner,
} from '../controllers/banner.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/banners', getBanners);

// Admin routes
router.get('/banners/admin', authenticateToken, requireAdmin, getBannersAdmin);
router.get('/banners/:id', authenticateToken, requireAdmin, getBannerById);
router.post('/banners', authenticateToken, requireAdmin, createBanner);
router.put('/banners/:id', authenticateToken, requireAdmin, updateBanner);
router.post('/banners/reorder', authenticateToken, requireAdmin, reorderBanners);
router.delete('/banners/:id', authenticateToken, requireAdmin, deleteBanner);

export default router;