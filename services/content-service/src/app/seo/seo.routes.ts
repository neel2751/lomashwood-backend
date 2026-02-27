import { Router } from 'express';

import { SeoController } from './seo.controller';
import { requireAuth } from '../../infrastructure/http/middleware.factory';
import { requireRole } from '../../infrastructure/http/middleware.factory';

const router = Router();
const controller = new SeoController();

router.get('/entity/:entityType/:entityId', controller.getSeoByEntity);


router.get('/', requireAuth, requireRole('ADMIN'), controller.listSeoMeta);


router.get('/:id', requireAuth, requireRole('ADMIN'), controller.getSeoById);


router.put('/', requireAuth, requireRole('ADMIN'), controller.upsertSeo);


router.patch('/:id', requireAuth, requireRole('ADMIN'), controller.updateSeo);

router.delete('/:id', requireAuth, requireRole('ADMIN'), controller.deleteSeo);

export { router as seoRouter };