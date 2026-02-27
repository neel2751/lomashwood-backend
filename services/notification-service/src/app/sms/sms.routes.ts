import { Router } from 'express';
import { smsController }   from './sms.controller';
import { authMiddleware }  from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';

const router = Router();

router.post(
  '/',
  authMiddleware,
  (req, res, next) => { void smsController.send(req, res, next); },
);

router.post(
  '/bulk',
  authMiddleware,
  adminMiddleware,
  (req, res, next) => { void smsController.sendBulk(req, res, next); },
);

router.get(
  '/:id',
  authMiddleware,
  (req, res, next) => { void smsController.getById(req, res, next); },
);

router.delete(
  '/:id',
  authMiddleware,
  (req, res, next) => { void smsController.cancel(req, res, next); },
);

export { router as smsRouter };