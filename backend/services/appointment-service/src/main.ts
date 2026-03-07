import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';
import { config } from './config/configuration';
import { AppointmentController } from './appointments/appointment.controller';
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

// Appointment routes
const appointmentController = new AppointmentController();

app.get('/appointments', appointmentController.getAppointments.bind(appointmentController));
app.get('/appointments/:id', appointmentController.getAppointment.bind(appointmentController));
app.post('/appointments', appointmentController.createAppointment.bind(appointmentController));
app.put('/appointments/:id', appointmentController.updateAppointment.bind(appointmentController));
app.post('/appointments/:id/cancel', appointmentController.cancelAppointment.bind(appointmentController));
app.post('/appointments/:id/reschedule', appointmentController.rescheduleAppointment.bind(appointmentController));

// Availability routes
app.get('/availability', appointmentController.getAvailability.bind(appointmentController));

// Consultant routes
app.get('/consultants', appointmentController.getConsultants.bind(appointmentController));

// Showroom routes
app.get('/showrooms', appointmentController.getShowrooms.bind(appointmentController));

// Time slot routes
app.get('/time-slots', appointmentController.getTimeSlots.bind(appointmentController));

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
  console.log(`🚀 Appointment Service is running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`🔍 Environment: ${config.env}`);
});
