import { Router } from 'express';

import { PageController } from './page.controller';
import { requireAuth } from '../../infrastructure/http/middleware.factory';
import { requireRole } from '../../infrastructure/http/middleware.factory';

const router = Router();
const controller = new PageController();


router.get('/published', controller.getPublishedPages);


router.get('/system/:slug', controller.getSystemPage);


router.get('/:slug', controller.getPageBySlug);


router.get('/', requireAuth, requireRole('ADMIN'), controller.listPages);


router.get('/admin/:id', requireAuth, requireRole('ADMIN'), controller.getPageById);


router.post('/', requireAuth, requireRole('ADMIN'), controller.createPage);


router.patch('/:id', requireAuth, requireRole('ADMIN'), controller.updatePage);

router.delete('/:id', requireAuth, requireRole('ADMIN'), controller.deletePage);

export { router as cmsPageRouter };