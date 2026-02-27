import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import appointmentRoutes from './appointment.routes';
import orderRoutes from './order.routes';
import contentRoutes from './content.routes';
import * as customerRoutesModule from './customer.routes';
import notificationRoutes from './notification.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

const customerRoutes = (customerRoutesModule as any).default ?? customerRoutesModule;

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

router.get('/ready', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ready',
    service: 'api-gateway',
  });
});

router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    service: 'api-gateway',
  });
});

router.use('/v1/auth', authRoutes);

router.use('/v1/products', productRoutes);
router.use('/v1/categories', productRoutes);

router.use('/v1/appointments', appointmentRoutes);
router.use('/v1/showrooms', appointmentRoutes);

router.use('/v1/payments', orderRoutes);
router.use('/v1/webhooks', orderRoutes);

router.use('/v1/blog', contentRoutes);
router.use('/v1/brochures', contentRoutes);
router.use('/v1/business', contentRoutes);
router.use('/v1/contact', contentRoutes);
router.use('/v1/newsletter', contentRoutes);
router.use('/v1/uploads', contentRoutes);
router.use('/v1/media-wall', contentRoutes);
router.use('/v1/finance', contentRoutes);
router.use('/v1/pages', contentRoutes);

router.use('/v1/customers', customerRoutes);

router.use('/v1/notifications', notificationRoutes);

router.use('/v1/analytics', analyticsRoutes);

router.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

export default router;