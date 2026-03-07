import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';
import { config } from './config/configuration';
import { ProductController } from './products/product.controller';
import { ApiResponse } from '../../../packages/api-client/src/types/api.types';

const app = express();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors(config.cors));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    },
  } as ApiResponse);
});

// Product routes
const productController = new ProductController();

app.get('/products', productController.getProducts.bind(productController));
app.get('/products/search', productController.searchProducts.bind(productController));
app.get('/products/featured', productController.getFeaturedProducts.bind(productController));
app.get('/products/:id', productController.getProduct.bind(productController));
app.post('/products', productController.createProduct.bind(productController));
app.put('/products/:id', productController.updateProduct.bind(productController));
app.delete('/products/:id', productController.deleteProduct.bind(productController));

// Category routes
app.get('/categories', productController.getCategories.bind(productController));

// Colour routes
app.get('/colours', productController.getColours.bind(productController));

// Size routes
app.get('/sizes', productController.getSizes.bind(productController));

// Inventory routes
app.get('/products/:productId/inventory', productController.getInventory.bind(productController));
app.put('/products/:productId/inventory', productController.updateInventory.bind(productController));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
  } as ApiResponse);
});

// Error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: 'INTERNAL_SERVER_ERROR',
    ...(config.isDevelopment && { stack: error.stack }),
  } as ApiResponse);
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Product Service is running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`🔍 Environment: ${config.env}`);
});
