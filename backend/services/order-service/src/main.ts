import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';
import { config } from './config/configuration';
import { OrderController } from './orders/order.controller';
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

// Order routes
const orderController = new OrderController();

app.get('/orders', orderController.getOrders.bind(orderController));
app.get('/orders/:id', orderController.getOrder.bind(orderController));
app.post('/orders', orderController.createOrder.bind(orderController));
app.put('/orders/:id', orderController.updateOrder.bind(orderController));
app.post('/orders/:id/cancel', orderController.cancelOrder.bind(orderController));

// Payment routes
app.post('/payments', orderController.createPayment.bind(orderController));
app.put('/payments/:id/status', orderController.updatePaymentStatus.bind(orderController));

// Refund routes
app.post('/refunds', orderController.processRefund.bind(orderController));

// Invoice routes
app.get('/orders/:orderId/invoices', orderController.getInvoices.bind(orderController));
app.post('/orders/:orderId/invoices', orderController.generateInvoice.bind(orderController));

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
  console.log(`🚀 Order Service is running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`🔍 Environment: ${config.env}`);
});
