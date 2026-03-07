import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';
import { config } from './config/configuration';
import { AnalyticsController } from './analytics/analytics.controller';

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  [key: string]: any;
}

const app = express();

app.use(helmet());
app.use(cors(config.cors));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

const analyticsController = new AnalyticsController();

app.post('/events/track', analyticsController.trackEvent.bind(analyticsController));
app.get('/events', analyticsController.getEvents.bind(analyticsController));
app.get('/events/metrics', analyticsController.getEventMetrics.bind(analyticsController));

app.get('/dashboards', analyticsController.getDashboards.bind(analyticsController));
app.get('/dashboards/:id', analyticsController.getDashboard.bind(analyticsController));
app.post('/dashboards', analyticsController.createDashboard.bind(analyticsController));
app.put('/dashboards/:id', analyticsController.updateDashboard.bind(analyticsController));

app.get('/widgets', analyticsController.getWidgets.bind(analyticsController));
app.get('/widgets/:id', analyticsController.getWidget.bind(analyticsController));
app.post('/widgets', analyticsController.createWidget.bind(analyticsController));
app.put('/widgets/:id', analyticsController.updateWidget.bind(analyticsController));

app.get('/funnels', analyticsController.getFunnels.bind(analyticsController));
app.get('/funnels/:id', analyticsController.getFunnel.bind(analyticsController));

app.get('/stats/realtime', analyticsController.getRealTimeStats.bind(analyticsController));
app.get('/stats/overview', analyticsController.getOverviewStats.bind(analyticsController));

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
  } as ApiResponse);
});

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
  console.log(`Analytics Service is running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`Environment: ${config.env}`);
});