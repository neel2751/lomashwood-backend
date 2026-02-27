import { Router } from 'express';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryRepository } from './category.repository';
import { prisma } from '../../infrastructure/db/prisma.client';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoryQuerySchema,
  CategoryIdSchema,
  BulkDeleteCategorySchema,
  CategoryReorderSchema,
} from './category.schemas';

const router = Router();

const categoryRepository = new CategoryRepository(prisma);
const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(categoryService);

router.post(
  '/',
  authMiddleware,
  validateRequest({ body: CreateCategorySchema }),
  categoryController.createCategory
);

router.get(
  '/',
  validateRequest({ query: CategoryQuerySchema }),
  categoryController.getAllCategories
);

router.get('/active', categoryController.getActiveCategories);

router.get('/featured', categoryController.getFeaturedCategories);

router.get('/hierarchy', categoryController.getCategoryHierarchy);

router.get('/statistics', authMiddleware, categoryController.getCategoryStatistics);

router.get('/type/:type', categoryController.getCategoriesByType);

router.get('/search', categoryController.searchCategories);

router.get('/export', authMiddleware, categoryController.exportCategories);

router.get('/slug/:slug', categoryController.getCategoryBySlug);

router.get(
  '/:id',
  validateRequest({ params: CategoryIdSchema }),
  categoryController.getCategoryById
);

router.get(
  '/:id/products',
  validateRequest({ params: CategoryIdSchema }),
  categoryController.getCategoryWithProducts
);

router.patch(
  '/:id',
  authMiddleware,
  validateRequest({ params: CategoryIdSchema, body: UpdateCategorySchema }),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authMiddleware,
  validateRequest({ params: CategoryIdSchema }),
  categoryController.deleteCategory
);

router.post(
  '/bulk-delete',
  authMiddleware,
  validateRequest({ body: BulkDeleteCategorySchema }),
  categoryController.bulkDeleteCategories
);

router.patch(
  '/:id/toggle-status',
  authMiddleware,
  validateRequest({ params: CategoryIdSchema }),
  categoryController.toggleCategoryStatus
);

router.patch(
  '/:id/toggle-featured',
  authMiddleware,
  validateRequest({ params: CategoryIdSchema }),
  categoryController.toggleFeaturedStatus
);

router.post(
  '/reorder',
  authMiddleware,
  validateRequest({ body: CategoryReorderSchema }),
  categoryController.reorderCategories
);

export default router;