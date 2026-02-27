import { Router } from 'express';

import { LandingController } from './landing.controller';
import { requireAuth, requireRole } from '../../interfaces/http/middleware.factory';

const router: Router = Router();
const controller = new LandingController();

router.get('/active', controller.getActiveLandingPages);

router.get('/', requireAuth, requireRole('ADMIN'), controller.listLandingPages);

router.get('/admin/:id', requireAuth, requireRole('ADMIN'), controller.getLandingById);

router.get('/:slug', controller.getLandingBySlug);

router.post('/', requireAuth, requireRole('ADMIN'), controller.createLandingPage);

router.patch('/:id', requireAuth, requireRole('ADMIN'), controller.updateLandingPage);

router.delete('/:id', requireAuth, requireRole('ADMIN'), controller.deleteLandingPage);

export { router as landingPageRouter };