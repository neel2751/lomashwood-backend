import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import * as productValidators from '../validators/product.validator';
import * as productClientModule from '../services/product.client';

const router = Router();


const productQuerySchema = (productValidators as any).productQuerySchema ?? (productValidators as any).default?.productQuerySchema;
const productCreateSchema = (productValidators as any).productCreateSchema ?? (productValidators as any).default?.productCreateSchema;
const productUpdateSchema = (productValidators as any).productUpdateSchema ?? (productValidators as any).default?.productUpdateSchema;
const colourCreateSchema = (productValidators as any).colourCreateSchema ?? (productValidators as any).default?.colourCreateSchema;
const saleCreateSchema = (productValidators as any).saleCreateSchema ?? (productValidators as any).default?.saleCreateSchema;
const packageCreateSchema = (productValidators as any).packageCreateSchema ?? (productValidators as any).default?.packageCreateSchema;


const productClient = (productClientModule as any).default ?? productClientModule;


router.get('/categories/all', async (_req, res, next) => {
  try {
    const response = await productClient.getCategories();
    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/categories/:category', async (req, res, next) => {
  try {
    const response = await productClient.getProductsByCategory(req.params.category, req.query);
    res.status(200).json({
      success: true,
      message: `${req.params.category} products retrieved successfully`,
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/colours/all', async (_req, res, next) => {
  try {
    const response = await productClient.getColours();
    res.status(200).json({
      success: true,
      message: 'Colours retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.post('/colours', authMiddleware, validateRequest(colourCreateSchema), async (req, res, next) => {
  try {
    const response = await productClient.createColour(req.body, req.headers.authorization!);
    res.status(201).json({
      success: true,
      message: 'Colour created successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.patch('/colours/:id', authMiddleware, async (req, res, next) => {
  try {
    const response = await productClient.updateColour(
      req.params.id,
      req.body,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Colour updated successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.delete('/colours/:id', authMiddleware, async (req, res, next) => {
  try {
    const response = await productClient.deleteColour(req.params.id, req.headers.authorization!);
    res.status(200).json({
      success: true,
      message: 'Colour deleted successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/sizes/all', async (_req, res, next) => {
  try {
    const response = await productClient.getSizes();
    res.status(200).json({
      success: true,
      message: 'Sizes retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.post('/sizes', authMiddleware, async (req, res, next) => {
  try {
    const response = await productClient.createSize(req.body, req.headers.authorization!);
    res.status(201).json({
      success: true,
      message: 'Size created successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.patch('/sizes/:id', authMiddleware, async (req, res, next) => {
  try {
    const response = await productClient.updateSize(
      req.params.id,
      req.body,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Size updated successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.delete('/sizes/:id', authMiddleware, async (req, res, next) => {
  try {
    const response = await productClient.deleteSize(req.params.id, req.headers.authorization!);
    res.status(200).json({
      success: true,
      message: 'Size deleted successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/sales/all', async (req, res, next) => {
  try {
    const response = await productClient.getSales(req.query);
    res.status(200).json({
      success: true,
      message: 'Sales retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/sales/:id', async (req, res, next) => {
  try {
    const response = await productClient.getSaleById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Sale retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.post('/sales', authMiddleware, validateRequest(saleCreateSchema), async (req, res, next) => {
  try {
    const response = await productClient.createSale(req.body, req.headers.authorization!);
    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.patch('/sales/:id', authMiddleware, async (req, res, next) => {
  try {
    const response = await productClient.updateSale(
      req.params.id,
      req.body,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Sale updated successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.delete('/sales/:id', authMiddleware, async (req, res, next) => {
  try {
    const response = await productClient.deleteSale(req.params.id, req.headers.authorization!);
    res.status(200).json({
      success: true,
      message: 'Sale deleted successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/packages/all', async (req, res, next) => {
  try {
    const response = await productClient.getPackages(req.query);
    res.status(200).json({
      success: true,
      message: 'Packages retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/packages/:id', async (req, res, next) => {
  try {
    const response = await productClient.getPackageById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Package retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.post('/packages', authMiddleware, validateRequest(packageCreateSchema), async (req, res, next) => {
  try {
    const response = await productClient.createPackage(req.body, req.headers.authorization!);
    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.patch('/packages/:id', authMiddleware, async (req, res, next) => {
  try {
    const response = await productClient.updatePackage(
      req.params.id,
      req.body,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Package updated successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.delete('/packages/:id', authMiddleware, async (req, res, next) => {
  try {
    const response = await productClient.deletePackage(req.params.id, req.headers.authorization!);
    res.status(200).json({
      success: true,
      message: 'Package deleted successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/ranges/all', async (_req, res, next) => {
  try {
    const response = await productClient.getRanges();
    res.status(200).json({
      success: true,
      message: 'Ranges retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/styles/all', async (_req, res, next) => {
  try {
    const response = await productClient.getStyles();
    res.status(200).json({
      success: true,
      message: 'Styles retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/finishes/all', async (_req, res, next) => {
  try {
    const response = await productClient.getFinishes();
    res.status(200).json({
      success: true,
      message: 'Finishes retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/', validateRequest(productQuerySchema), async (req, res, next) => {
  try {
    const response = await productClient.getProducts(req.query);
    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: response.products,
      pagination: response.pagination,
      filters: response.filters,
    });
  } catch (error) {
    next(error);
  }
});


router.post('/', authMiddleware, validateRequest(productCreateSchema), async (req, res, next) => {
  try {
    const response = await productClient.createProduct(req.body, req.headers.authorization!);
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/:id', async (req, res, next) => {
  try {
    const response = await productClient.getProductById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.patch('/:id', authMiddleware, validateRequest(productUpdateSchema), async (req, res, next) => {
  try {
    const response = await productClient.updateProduct(
      req.params.id,
      req.body,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const response = await productClient.deleteProduct(req.params.id, req.headers.authorization!);
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

export default router;