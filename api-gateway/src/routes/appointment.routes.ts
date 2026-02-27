import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';

const validatorModule = require('../validators/booking.validator');
const bookingSchema = validatorModule.bookingSchema || validatorModule.getBookingsSchema || validatorModule.default;
const availabilityQuerySchema = validatorModule.availabilityQuerySchema || validatorModule.getAvailabilitySchema || validatorModule.default;
const showroomCreateSchema = validatorModule.showroomCreateSchema || validatorModule.createShowroomSchema || validatorModule.default;
const consultantCreateSchema = validatorModule.consultantCreateSchema || validatorModule.createConsultantSchema || validatorModule.default;

const appointmentModule = require('../services/appointment.client');
const appointmentClient = appointmentModule.default || appointmentModule;

const router = Router();

router.get('/availability', validateRequest(availabilityQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.getAvailability(req.query);
    res.status(200).json({
      success: true,
      message: 'Availability retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', validateRequest(bookingSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.createAppointment(req.body);
    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully. Confirmation email sent.',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/types/all', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.getAppointmentTypes();
    res.status(200).json({
      success: true,
      message: 'Appointment types retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/types', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.createAppointmentType(
      req.body,
      req.headers.authorization ?? ''
    );
    res.status(201).json({
      success: true,
      message: 'Appointment type created successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/types/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.updateAppointmentType(
      req.params['id'],
      req.body,
      req.headers.authorization ?? ''
    );
    res.status(200).json({
      success: true,
      message: 'Appointment type updated successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/types/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.deleteAppointmentType(
      req.params['id'],
      req.headers.authorization ?? ''
    );
    res.status(200).json({
      success: true,
      message: 'Appointment type deleted successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/showrooms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.getShowrooms(req.query);
    res.status(200).json({
      success: true,
      message: 'Showrooms retrieved successfully',
      data: response.showrooms,
      pagination: response.pagination,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/showrooms/:id/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.getShowroomAvailability(
      req.params['id'],
      req.query
    );
    res.status(200).json({
      success: true,
      message: 'Showroom availability retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/showrooms/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.getShowroomById(req.params['id']);
    res.status(200).json({
      success: true,
      message: 'Showroom retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/showrooms', authMiddleware, validateRequest(showroomCreateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.createShowroom(req.body, req.headers.authorization ?? '');
    res.status(201).json({
      success: true,
      message: 'Showroom created successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/showrooms/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.updateShowroom(
      req.params['id'],
      req.body,
      req.headers.authorization ?? ''
    );
    res.status(200).json({
      success: true,
      message: 'Showroom updated successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/showrooms/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.deleteShowroom(
      req.params['id'],
      req.headers.authorization ?? ''
    );
    res.status(200).json({
      success: true,
      message: 'Showroom deleted successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/consultants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.getConsultants(req.query);
    res.status(200).json({
      success: true,
      message: 'Consultants retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/consultants/:id/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.getConsultantAvailability(
      req.params['id'],
      req.query
    );
    res.status(200).json({
      success: true,
      message: 'Consultant availability retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/consultants/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.getConsultantById(req.params['id']);
    res.status(200).json({
      success: true,
      message: 'Consultant retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/consultants', authMiddleware, validateRequest(consultantCreateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.createConsultant(
      req.body,
      req.headers.authorization ?? ''
    );
    res.status(201).json({
      success: true,
      message: 'Consultant created successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/consultants/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.updateConsultant(
      req.params['id'],
      req.body,
      req.headers.authorization ?? ''
    );
    res.status(200).json({
      success: true,
      message: 'Consultant updated successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/consultants/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.deleteConsultant(
      req.params['id'],
      req.headers.authorization ?? ''
    );
    res.status(200).json({
      success: true,
      message: 'Consultant deleted successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats/overview', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.getAppointmentStats(
      req.query,
      req.headers.authorization ?? ''
    );
    res.status(200).json({
      success: true,
      message: 'Appointment statistics retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/customer/:customerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.getCustomerAppointments(req.params['customerId']);
    res.status(200).json({
      success: true,
      message: 'Customer appointments retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/reminders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.getAppointmentReminders(req.params['id']);
    res.status(200).json({
      success: true,
      message: 'Reminders retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reminders', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.createReminder(
      req.params['id'],
      req.body,
      req.headers.authorization ?? ''
    );
    res.status(201).json({
      success: true,
      message: 'Reminder created successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.getAllAppointments(
      req.query,
      req.headers.authorization ?? ''
    );
    res.status(200).json({
      success: true,
      message: 'Appointments retrieved successfully',
      data: response.appointments,
      pagination: response.pagination,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.getAppointmentById(req.params['id']);
    res.status(200).json({
      success: true,
      message: 'Appointment retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.updateAppointment(req.params['id'], req.body);
    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await appointmentClient.cancelAppointment(req.params['id']);
    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

export default router;