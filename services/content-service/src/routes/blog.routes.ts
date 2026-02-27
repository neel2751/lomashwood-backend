import { Router } from 'express';
import {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
} from '../controllers/blog.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/blog', getBlogs);
router.get('/blog/:id', getBlogById);

// Admin routes
router.post('/blog', authenticateToken, requireAdmin, createBlog);
router.put('/blog/:id', authenticateToken, requireAdmin, updateBlog);
router.delete('/blog/:id', authenticateToken, requireAdmin, deleteBlog);

export default router;