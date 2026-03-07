import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';
import { config } from './config/configuration';
import { CustomerController } from './customers/customer.controller';
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

// Customer routes
const customerController = new CustomerController();

app.get('/customers', customerController.getCustomers.bind(customerController));
app.get('/customers/:id', customerController.getCustomer.bind(customerController));
app.post('/customers', customerController.createCustomer.bind(customerController));
app.put('/customers/:id', customerController.updateCustomer.bind(customerController));
app.delete('/customers/:id', customerController.deleteCustomer.bind(customerController));

// Review routes
app.get('/reviews', customerController.getReviews.bind(customerController));
app.post('/reviews', customerController.createReview.bind(customerController));

// Support ticket routes
app.get('/support-tickets', customerController.getSupportTickets.bind(customerController));
app.post('/support-tickets', customerController.createSupportTicket.bind(customerController));

// Wishlist routes
app.get('/customers/:customerId/wishlist', customerController.getWishlist.bind(customerController));
app.post('/customers/:customerId/wishlist', customerController.addToWishlist.bind(customerController));
app.delete('/customers/:customerId/wishlist/:productId', customerController.removeFromWishlist.bind(customerController));

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
  console.log(`🚀 Customer Service is running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`🔍 Environment: ${config.env}`);
});
