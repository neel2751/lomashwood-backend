import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';
import { config } from './config/configuration';
import { NotificationController } from './notifications/notification.controller';
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

// Notification routes
const notificationController = new NotificationController();

app.get('/notifications', notificationController.getNotifications.bind(notificationController));
app.get('/notifications/:id', notificationController.getNotification.bind(notificationController));
app.post('/notifications', notificationController.createNotification.bind(notificationController));
app.put('/notifications/:id/read', notificationController.markAsRead.bind(notificationController));
app.put('/notifications/read-all', notificationController.markAllAsRead.bind(notificationController));

// Email routes
app.post('/emails/send', notificationController.sendEmail.bind(notificationController));
app.get('/emails/logs', notificationController.getEmailLogs.bind(notificationController));

// SMS routes
app.post('/sms/send', notificationController.sendSms.bind(notificationController));
app.get('/sms/logs', notificationController.getSmsLogs.bind(notificationController));

// Push notification routes
app.post('/push/send', notificationController.sendPushNotification.bind(notificationController));
app.get('/push/logs', notificationController.getPushLogs.bind(notificationController));

// Template routes
app.get('/templates', notificationController.getNotificationTemplates.bind(notificationController));
app.post('/templates', notificationController.createNotificationTemplate.bind(notificationController));

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
  console.log(`🚀 Notification Service is running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`🔍 Environment: ${config.env}`);
});
