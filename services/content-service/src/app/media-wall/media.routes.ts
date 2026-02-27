import { Router, RequestHandler } from 'express';

import { MediaController } from './media.controller';
import { requireAuth, requireRole } from '@infrastructure/http/middleware.factory';

const router: ReturnType<typeof Router> = Router();
const controller = new MediaController();

const authMiddleware = requireAuth as unknown as RequestHandler;
const adminRoleMiddleware = requireRole('ADMIN') as unknown as RequestHandler;

router.get('/', controller.listMedia);

router.get('/active', controller.getActiveMedia);

router.get('/:id', controller.getMediaById);



router.post('/', authMiddleware, adminRoleMiddleware, controller.createMedia);

router.patch('/reorder', authMiddleware, adminRoleMiddleware, controller.reorderMedia);

router.patch('/:id', authMiddleware, adminRoleMiddleware, controller.updateMedia);


router.delete('/:id', authMiddleware, adminRoleMiddleware, controller.deleteMedia);

export { router as mediaWallRouter };