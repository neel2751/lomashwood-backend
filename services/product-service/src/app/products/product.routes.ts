import { Router } from 'express';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { productRepository } from './product.repository';
import { eventProducer } from '../../infrastructure/messaging/event-producer';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductQuerySchema,
  ProductIdSchema,
  ProductSlugSchema,
  ProductStatusUpdateSchema,
  ProductFeaturedToggleSchema,
  BulkDeleteProductSchema,
} from './product.schemas';

// ── Dependency wiring ──────────────────────────────────────────────────────────
const productService = new ProductService(productRepository, eventProducer);
const productController = new ProductController(productService);

const router = Router();

// ── Public routes ──────────────────────────────────────────────────────────────

// GET /products
router.get(
  '/',
  validateRequest({ query: ProductQuerySchema }),
  productController.getAllProducts
);

// GET /products/featured
router.get(
  '/featured',
  validateRequest({ query: ProductQuerySchema }),
  productController.getFeaturedProducts
);

// GET /products/popular
router.get(
  '/popular',
  validateRequest({ query: ProductQuerySchema }),
  productController.getPopularProducts
);

// GET /products/search?q=...
router.get(
  '/search',
  validateRequest({ query: ProductQuerySchema }),
  productController.searchProducts
);

// GET /products/filter-options
router.get(
  '/filter-options',
  validateRequest({ query: ProductQuerySchema }),
  productController.getFilterOptions
);

// GET /products/slug/:slug
router.get(
  '/slug/:slug',
  validateRequest({ params: ProductSlugSchema }),
  productController.getProductBySlug
);

// GET /products/related/:id
router.get(
  '/related/:id',
  validateRequest({ params: ProductIdSchema }),
  productController.getRelatedProducts
);

// GET /products/:id
router.get(
  '/:id',
  validateRequest({ params: ProductIdSchema }),
  productController.getProductById
);

// ── Protected routes (admin / manager) ────────────────────────────────────────

// POST /products
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateRequest({ body: CreateProductSchema }),
  productController.createProduct
);

// PATCH /products/bulk/delete
router.patch(
  '/bulk/delete',
  authenticate,
  authorize(['ADMIN']),
  validateRequest({ body: BulkDeleteProductSchema }),
  productController.bulkDeleteProducts
);

// GET /products/statistics
router.get(
  '/statistics',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  productController.getStatistics
);

// PATCH /products/:id
router.patch(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateRequest({ params: ProductIdSchema, body: UpdateProductSchema }),
  productController.updateProduct
);

// PATCH /products/:id/status
router.patch(
  '/:id/status',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateRequest({ params: ProductIdSchema, body: ProductStatusUpdateSchema }),
  productController.updateProductStatus
);

// PATCH /products/:id/featured
router.patch(
  '/:id/featured',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateRequest({ params: ProductIdSchema, body: ProductFeaturedToggleSchema }),
  productController.toggleFeatured
);

// POST /products/:id/colours
router.post(
  '/:id/colours',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateRequest({ params: ProductIdSchema }),
  productController.syncProductColours
);

// DELETE /products/:id
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  validateRequest({ params: ProductIdSchema }),
  productController.deleteProduct
);

export default router;