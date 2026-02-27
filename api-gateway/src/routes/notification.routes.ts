import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import * as notificationModule from '../services/notification.client';
import * as responseModule from '../utils/response';
import { z } from 'zod';

const router = Router();

const notificationClient = (notificationModule as any).default ?? notificationModule;
const sendResponse = (responseModule as any).sendResponse ?? (responseModule as any).default?.sendResponse;
const sendError = (responseModule as any).sendError ?? (responseModule as any).default?.sendError;

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  template: z.enum([
    'booking_confirmation',
    'payment_receipt',
    'brochure_delivery',
    'business_inquiry_acknowledgement',
    'newsletter_welcome',
    'appointment_reminder'
  ]),
  data: z.record(z.any())
});

const sendBulkEmailSchema = z.object({
  recipients: z.array(z.string().email()).min(1),
  subject: z.string().min(1),
  template: z.string().min(1),
  data: z.record(z.any())
});

const subscribeNewsletterSchema = z.object({
  email: z.string().email(),
  name: z.string().optional()
});

router.post(
  '/email/send',
  authMiddleware,
  validateRequest(sendEmailSchema),
  async (req, res) => {
    try {
      const result = await notificationClient.sendEmail(req.body);
      return sendResponse(res, result, 'Email sent successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.post(
  '/email/bulk',
  authMiddleware,
  validateRequest(sendBulkEmailSchema),
  async (req, res) => {
    try {
      const result = await notificationClient.sendBulkEmail(req.body);
      return sendResponse(res, result, 'Bulk emails queued successfully', 202);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.post(
  '/newsletter/subscribe',
  validateRequest(subscribeNewsletterSchema),
  async (req, res) => {
    try {
      const result = await notificationClient.subscribeNewsletter(req.body);
      return sendResponse(res, result, 'Successfully subscribed to newsletter', 201);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.delete(
  '/newsletter/unsubscribe/:email',
  async (req, res) => {
    try {
      const result = await notificationClient.unsubscribeNewsletter(req.params.email);
      return sendResponse(res, result, 'Successfully unsubscribed from newsletter', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.get(
  '/templates',
  authMiddleware,
  async (_req, res) => {  // ← _req: unused parameter fix
    try {
      const result = await notificationClient.getTemplates();
      return sendResponse(res, result, 'Templates retrieved successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.get(
  '/history',
  authMiddleware,
  async (req, res) => {
    try {
      const { page = '1', limit = '20', type } = req.query;
      const result = await notificationClient.getNotificationHistory({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        type: type as string
      });
      return sendResponse(res, result, 'Notification history retrieved successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.get(
  '/status/:notificationId',
  authMiddleware,
  async (req, res) => {
    try {
      const result = await notificationClient.getNotificationStatus(req.params.notificationId);
      return sendResponse(res, result, 'Notification status retrieved successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.post(
  '/sms/send',
  authMiddleware,
  async (req, res) => {
    try {
      const result = await notificationClient.sendSMS(req.body);
      return sendResponse(res, result, 'SMS sent successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.get(
  '/preferences/:userId',
  authMiddleware,
  async (req, res) => {
    try {
      const result = await notificationClient.getUserPreferences(req.params.userId);
      return sendResponse(res, result, 'Notification preferences retrieved successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.patch(
  '/preferences/:userId',
  authMiddleware,
  async (req, res) => {
    try {
      const result = await notificationClient.updateUserPreferences(req.params.userId, req.body);
      return sendResponse(res, result, 'Notification preferences updated successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

export default router;