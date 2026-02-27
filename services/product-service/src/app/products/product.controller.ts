import { Request, Response, NextFunction } from 'express';
import { ProductService } from './product.service';
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
import { ProductMapper } from './product.mapper';
import { asyncHandler } from '../../shared/utils';

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ── Create ──────────────────────────────────────────────────────────────────

  createProduct = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const data = CreateProductSchema.parse(req.body);
    const product = await this.productService.create(data);

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  });

  // ── Read: list ──────────────────────────────────────────────────────────────

  getAllProducts = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const query = ProductQuerySchema.parse(req.query);
    const result = await this.productService.findAll(query);

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  });

  // ── Read: single by ID ──────────────────────────────────────────────────────

  getProductById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = ProductIdSchema.parse(req.params);
    const product = await this.productService.findById(id);

    res.status(200).json({
      success: true,
      data: product,
    });
  });

  // ── Read: single by slug ────────────────────────────────────────────────────

  getProductBySlug = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { slug } = ProductSlugSchema.parse(req.params);
    const product = await this.productService.findBySlug(slug);

    res.status(200).json({
      success: true,
      data: product,
    });
  });

  // ── Read: featured ──────────────────────────────────────────────────────────

  getFeaturedProducts = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const query = ProductQuerySchema.parse(req.query);
    const products = await this.productService.getFeatured(query.limit, query.category);

    res.status(200).json({
      success: true,
      data: products,
    });
  });

  // ── Read: popular ───────────────────────────────────────────────────────────

  getPopularProducts = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const query = ProductQuerySchema.parse(req.query);
    const products = await this.productService.getPopular(query.limit, query.category);

    res.status(200).json({
      success: true,
      data: products,
    });
  });

  // ── Read: related ───────────────────────────────────────────────────────────

  getRelatedProducts = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = ProductIdSchema.parse(req.params);
    const limit = Number(req.query.limit) || 4;
    const products = await this.productService.getRelated(id, limit);

    res.status(200).json({
      success: true,
      data: products,
    });
  });

  // ── Read: search ────────────────────────────────────────────────────────────

  searchProducts = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const query = ProductQuerySchema.parse(req.query);
    const q = req.query.q as string | undefined;

    if (!q) {
      res.status(400).json({ success: false, message: 'Search query "q" is required' });
      return;
    }

    const products = await this.productService.search(q, query.category, query.limit);

    res.status(200).json({
      success: true,
      data: products,
    });
  });

  // ── Read: filter options ────────────────────────────────────────────────────

  getFilterOptions = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const query = ProductQuerySchema.parse(req.query);
    const options = await this.productService.getFilterOptions(query.category);

    res.status(200).json({
      success: true,
      data: options,
    });
  });

  // ── Update ──────────────────────────────────────────────────────────────────

  updateProduct = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = ProductIdSchema.parse(req.params);
    const data = UpdateProductSchema.parse(req.body);
    const product = await this.productService.update(id, data);

    res.status(200).json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  });

  // ── Update: status ──────────────────────────────────────────────────────────

  updateProductStatus = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = ProductIdSchema.parse(req.params);
    const { status } = ProductStatusUpdateSchema.parse(req.body);
    const product = await this.productService.updateStatus(id, status);

    res.status(200).json({
      success: true,
      data: product,
      message: `Product status updated to ${status}`,
    });
  });

  // ── Update: featured toggle ─────────────────────────────────────────────────

  toggleFeatured = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = ProductIdSchema.parse(req.params);
    const { featured } = ProductFeaturedToggleSchema.parse(req.body);
    const product = await this.productService.toggleFeatured(id, featured);

    res.status(200).json({
      success: true,
      data: product,
      message: `Product ${featured ? 'marked as' : 'removed from'} featured`,
    });
  });

  // ── Update: sync colours ────────────────────────────────────────────────────

  syncProductColours = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = ProductIdSchema.parse(req.params);
    const { colourIds } = req.body as { colourIds: string[] };

    if (!Array.isArray(colourIds)) {
      res.status(400).json({ success: false, message: 'colourIds must be an array' });
      return;
    }

    const product = await this.productService.update(id, { colourIds });

    res.status(200).json({
      success: true,
      data: product,
      message: 'Product colours synced successfully',
    });
  });

  // ── Delete ──────────────────────────────────────────────────────────────────

  deleteProduct = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = ProductIdSchema.parse(req.params);
    await this.productService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  });

  // ── Bulk: delete ────────────────────────────────────────────────────────────

  bulkDeleteProducts = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { ids } = BulkDeleteProductSchema.parse(req.body);
    const result = await this.productService.bulkDelete(ids);

    res.status(200).json({
      success: true,
      data: result,
      message: `${result.count} products deleted successfully`,
    });
  });

  // ── Statistics ──────────────────────────────────────────────────────────────

  getStatistics = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await this.productService.getStatistics();

    res.status(200).json({
      success: true,
      data: stats,
    });
  });
}