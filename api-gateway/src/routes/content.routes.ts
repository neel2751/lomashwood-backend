
import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';

const proxyModule = require('../controllers/proxy.controller');
const proxyController = proxyModule.proxyController || proxyModule.default || proxyModule;

const contentValidator = require('../validators/content.validator');
const zod = require('zod');
const fallbackSchema = zod.z?.object({}) || { parseAsync: async (d: any) => d };

const createBlogSchema = contentValidator.createBlogSchema || fallbackSchema;
const updateBlogSchema = contentValidator.updateBlogSchema || fallbackSchema;
const createMediaWallSchema = contentValidator.createMediaWallSchema || fallbackSchema;
const updateMediaWallSchema = contentValidator.updateMediaWallSchema || fallbackSchema;
const createFinanceContentSchema = contentValidator.createFinanceContentSchema || fallbackSchema;
const updateFinanceContentSchema = contentValidator.updateFinanceContentSchema || fallbackSchema;
const createHomeSliderSchema = contentValidator.createHomeSliderSchema || fallbackSchema;
const updateHomeSliderSchema = contentValidator.updateHomeSliderSchema || fallbackSchema;
const createPageContentSchema = contentValidator.createPageContentSchema || fallbackSchema;
const updatePageContentSchema = contentValidator.updatePageContentSchema || fallbackSchema;
const createFAQSchema = contentValidator.createFAQSchema || fallbackSchema;
const updateFAQSchema = contentValidator.updateFAQSchema || fallbackSchema;
const createNewsletterSchema = contentValidator.createNewsletterSchema || fallbackSchema;
const createAccreditationSchema = contentValidator.createAccreditationSchema || fallbackSchema;
const updateAccreditationSchema = contentValidator.updateAccreditationSchema || fallbackSchema;

const authenticate = authMiddleware;
const authorize = (roles: string[]) => {
  if (typeof (authMiddleware as any).authorize === 'function') {
    return (authMiddleware as any).authorize(roles);
  }
  return requireRole(...roles);
};

const router = Router();

router.get(
  '/blog',
  proxyController.forward('content-service', '/api/v1/blog')
);

router.get(
  '/blog/:slug',
  proxyController.forward('content-service', '/api/v1/blog/:slug')
);

router.post(
  '/blog',
  authenticate,
  authorize(['admin']),
  validateRequest(createBlogSchema),
  proxyController.forward('content-service', '/api/v1/blog')
);

router.patch(
  '/blog/:id',
  authenticate,
  authorize(['admin']),
  validateRequest(updateBlogSchema),
  proxyController.forward('content-service', '/api/v1/blog/:id')
);

router.delete(
  '/blog/:id',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/blog/:id')
);

router.get(
  '/media-wall',
  proxyController.forward('content-service', '/api/v1/media-wall')
);

router.post(
  '/media-wall',
  authenticate,
  authorize(['admin']),
  validateRequest(createMediaWallSchema),
  proxyController.forward('content-service', '/api/v1/media-wall')
);

router.patch(
  '/media-wall/:id',
  authenticate,
  authorize(['admin']),
  validateRequest(updateMediaWallSchema),
  proxyController.forward('content-service', '/api/v1/media-wall/:id')
);

router.delete(
  '/media-wall/:id',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/media-wall/:id')
);

router.get(
  '/finance',
  proxyController.forward('content-service', '/api/v1/finance')
);

router.post(
  '/finance',
  authenticate,
  authorize(['admin']),
  validateRequest(createFinanceContentSchema),
  proxyController.forward('content-service', '/api/v1/finance')
);

router.patch(
  '/finance/:id',
  authenticate,
  authorize(['admin']),
  validateRequest(updateFinanceContentSchema),
  proxyController.forward('content-service', '/api/v1/finance/:id')
);

router.delete(
  '/finance/:id',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/finance/:id')
);

router.get(
  '/home-sliders',
  proxyController.forward('content-service', '/api/v1/home-sliders')
);

router.post(
  '/home-sliders',
  authenticate,
  authorize(['admin']),
  validateRequest(createHomeSliderSchema),
  proxyController.forward('content-service', '/api/v1/home-sliders')
);

router.patch(
  '/home-sliders/:id',
  authenticate,
  authorize(['admin']),
  validateRequest(updateHomeSliderSchema),
  proxyController.forward('content-service', '/api/v1/home-sliders/:id')
);

router.delete(
  '/home-sliders/:id',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/home-sliders/:id')
);

router.get(
  '/pages/:type',
  proxyController.forward('content-service', '/api/v1/pages/:type')
);

router.post(
  '/pages',
  authenticate,
  authorize(['admin']),
  validateRequest(createPageContentSchema),
  proxyController.forward('content-service', '/api/v1/pages')
);

router.patch(
  '/pages/:id',
  authenticate,
  authorize(['admin']),
  validateRequest(updatePageContentSchema),
  proxyController.forward('content-service', '/api/v1/pages/:id')
);

router.delete(
  '/pages/:id',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/pages/:id')
);

router.get(
  '/faqs',
  proxyController.forward('content-service', '/api/v1/faqs')
);

router.post(
  '/faqs',
  authenticate,
  authorize(['admin']),
  validateRequest(createFAQSchema),
  proxyController.forward('content-service', '/api/v1/faqs')
);

router.patch(
  '/faqs/:id',
  authenticate,
  authorize(['admin']),
  validateRequest(updateFAQSchema),
  proxyController.forward('content-service', '/api/v1/faqs/:id')
);

router.delete(
  '/faqs/:id',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/faqs/:id')
);

router.post(
  '/newsletter',
  validateRequest(createNewsletterSchema),
  proxyController.forward('content-service', '/api/v1/newsletter')
);

router.get(
  '/newsletter/subscribers',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/newsletter/subscribers')
);

router.get(
  '/accreditations',
  proxyController.forward('content-service', '/api/v1/accreditations')
);

router.post(
  '/accreditations',
  authenticate,
  authorize(['admin']),
  validateRequest(createAccreditationSchema),
  proxyController.forward('content-service', '/api/v1/accreditations')
);

router.patch(
  '/accreditations/:id',
  authenticate,
  authorize(['admin']),
  validateRequest(updateAccreditationSchema),
  proxyController.forward('content-service', '/api/v1/accreditations/:id')
);

router.delete(
  '/accreditations/:id',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/accreditations/:id')
);

router.get(
  '/logos',
  proxyController.forward('content-service', '/api/v1/logos')
);

router.post(
  '/logos',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/logos')
);

router.delete(
  '/logos/:id',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/logos/:id')
);

router.get(
  '/reviews',
  proxyController.forward('content-service', '/api/v1/reviews')
);

router.post(
  '/reviews',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/reviews')
);

router.patch(
  '/reviews/:id',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/reviews/:id')
);

router.delete(
  '/reviews/:id',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/reviews/:id')
);

router.get(
  '/our-process',
  proxyController.forward('content-service', '/api/v1/our-process')
);

router.post(
  '/our-process',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/our-process')
);

router.patch(
  '/our-process/:id',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/our-process/:id')
);

router.get(
  '/projects',
  proxyController.forward('content-service', '/api/v1/projects')
);

router.get(
  '/projects/:id',
  proxyController.forward('content-service', '/api/v1/projects/:id')
);

router.post(
  '/projects',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/projects')
);

router.patch(
  '/projects/:id',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/projects/:id')
);

router.delete(
  '/projects/:id',
  authenticate,
  authorize(['admin']),
  proxyController.forward('content-service', '/api/v1/projects/:id')
);

export default router;