import { Router, RequestHandler } from 'express';

import { BlogController } from './blog.controller';
import { requireAuth, requireRole } from '../../interfaces/http/middleware.factory';

const router: Router = Router();
const controller = new BlogController();

router.get('/', controller.listBlogs as RequestHandler);
router.get('/featured', controller.getFeaturedBlogs as RequestHandler);
router.get('/:slug', controller.getBlogBySlug as RequestHandler);

router.get('/admin/:id', requireAuth, requireRole('ADMIN'), controller.getBlogById as RequestHandler);
router.post('/', requireAuth, requireRole('ADMIN'), controller.createBlog as RequestHandler);
router.patch('/:id', requireAuth, requireRole('ADMIN'), controller.updateBlog as RequestHandler);
router.delete('/:id', requireAuth, requireRole('ADMIN'), controller.deleteBlog as RequestHandler);

export { router as blogRouter };