import { Router } from 'express';
import { emailController }   from './email.controller';
import { authMiddleware }    from '@/middleware/auth.middleware';
import { adminMiddleware }   from '@/middleware/admin.middleware';

const router = Router();

router.post(
  '/',
  authMiddleware,
  (req, res, next) => { void emailController.send(req, res, next); },
);

router.post(
  '/bulk',
  authMiddleware,
  adminMiddleware,
  (req, res, next) => { void emailController.sendBulk(req, res, next); },
);

router.get(
  '/:id',
  authMiddleware,
  (req, res, next) => { void emailController.getById(req, res, next); },
);

router.delete(
  '/:id',
  authMiddleware,
  (req, res, next) => { void emailController.cancel(req, res, next); },
);

export { router as emailRouter };