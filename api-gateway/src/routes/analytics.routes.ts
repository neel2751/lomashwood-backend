import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { z } from 'zod';


const analyticsModule = require('../services/analytics.client');
const analyticsClient = analyticsModule.analyticsClient
  || analyticsModule.default
  || new (analyticsModule.AnalyticsClient || analyticsModule.default)();

const responseModule = require('../utils/response');
const sendResponse = responseModule.sendResponse || responseModule.default?.sendResponse || responseModule.default;
const sendError = responseModule.sendError || responseModule.default?.sendError || ((res: any, error: any) => {
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    },
    timestamp: new Date().toISOString()
  });
});

const router = Router();

const trackEventSchema = z.object({
  eventName: z.string().min(1),
  eventType: z.enum([
    'page_view',
    'product_view',
    'add_to_cart',
    'booking_started',
    'booking_completed',
    'brochure_requested',
    'business_inquiry',
    'newsletter_signup',
    'showroom_search',
    'filter_applied',
    'cta_clicked'
  ]),
  properties: z.record(z.any()).optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional()
});

const trackPageViewSchema = z.object({
  pageUrl: z.string().url(),
  pageTitle: z.string(),
  referrer: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const trackConversionSchema = z.object({
  conversionType: z.enum([
    'appointment_booking',
    'brochure_request',
    'business_inquiry',
    'product_purchase',
    'newsletter_subscription'
  ]),
  value: z.number().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

router.post(
  '/track/event',
  validateRequest(trackEventSchema),
  async (req, res) => {
    try {
      const result = await analyticsClient.trackEvent(req.body);
      return sendResponse(res, result, 'Event tracked successfully', 201);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.post(
  '/track/pageview',
  validateRequest(trackPageViewSchema),
  async (req, res) => {
    try {
      const result = await analyticsClient.trackPageView(req.body);
      return sendResponse(res, result, 'Page view tracked successfully', 201);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.post(
  '/track/conversion',
  validateRequest(trackConversionSchema),
  async (req, res) => {
    try {
      const result = await analyticsClient.trackConversion(req.body);
      return sendResponse(res, result, 'Conversion tracked successfully', 201);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.get(
  '/dashboard',
  authMiddleware,
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const result = await analyticsClient.getDashboardData({
        startDate: startDate as string,
        endDate: endDate as string
      });
      return sendResponse(res, result, 'Dashboard data retrieved successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.get(
  '/products/popular',
  authMiddleware,
  async (req, res) => {
    try {
      const { category, limit = '10', startDate, endDate } = req.query;
      const result = await analyticsClient.getPopularProducts({
        category: category as string,
        limit: parseInt(limit as string),
        startDate: startDate as string,
        endDate: endDate as string
      });
      return sendResponse(res, result, 'Popular products retrieved successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.get(
  '/bookings/metrics',
  authMiddleware,
  async (req, res) => {
    try {
      const { startDate, endDate, type } = req.query;
      const result = await analyticsClient.getBookingMetrics({
        startDate: startDate as string,
        endDate: endDate as string,
        type: type as string
      });
      return sendResponse(res, result, 'Booking metrics retrieved successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.get(
  '/traffic/sources',
  authMiddleware,
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const result = await analyticsClient.getTrafficSources({
        startDate: startDate as string,
        endDate: endDate as string
      });
      return sendResponse(res, result, 'Traffic sources retrieved successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.get(
  '/conversions/funnel',
  authMiddleware,
  async (req, res) => {
    try {
      const { funnelType, startDate, endDate } = req.query;
      const result = await analyticsClient.getConversionFunnel({
        funnelType: funnelType as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      return sendResponse(res, result, 'Conversion funnel data retrieved successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.get(
  '/users/behavior',
  authMiddleware,
  async (req, res) => {
    try {
      const { startDate, endDate, segment } = req.query;
      const result = await analyticsClient.getUserBehavior({
        startDate: startDate as string,
        endDate: endDate as string,
        segment: segment as string
      });
      return sendResponse(res, result, 'User behavior data retrieved successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.get(
  '/revenue/metrics',
  authMiddleware,
  async (req, res) => {
    try {
      const { startDate, endDate, groupBy = 'day' } = req.query;
      const result = await analyticsClient.getRevenueMetrics({
        startDate: startDate as string,
        endDate: endDate as string,
        groupBy: groupBy as string
      });
      return sendResponse(res, result, 'Revenue metrics retrieved successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.get(
  '/showrooms/performance',
  authMiddleware,
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const result = await analyticsClient.getShowroomPerformance({
        startDate: startDate as string,
        endDate: endDate as string
      });
      return sendResponse(res, result, 'Showroom performance data retrieved successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.get(
  '/reports/generate',
  authMiddleware,
  async (req, res) => {
    try {
      const { reportType, format = 'json', startDate, endDate } = req.query;
      const result = await analyticsClient.generateReport({
        reportType: reportType as string,
        format: format as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      return sendResponse(res, result, 'Report generated successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.get(
  '/sessions/active',
  authMiddleware,
  async (res) => {
    try {
      const result = await analyticsClient.getActiveSessions();
      return sendResponse(res, result, 'Active sessions retrieved successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.get(
  '/heatmap',
  authMiddleware,
  async (req, res) => {
    try {
      const { pageUrl, startDate, endDate } = req.query;
      const result = await analyticsClient.getHeatmapData({
        pageUrl: pageUrl as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      return sendResponse(res, result, 'Heatmap data retrieved successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.get(
  '/cohorts',
  authMiddleware,
  async (req, res) => {
    try {
      const { startDate, endDate, cohortType } = req.query;
      const result = await analyticsClient.getCohortAnalysis({
        startDate: startDate as string,
        endDate: endDate as string,
        cohortType: cohortType as string
      });
      return sendResponse(res, result, 'Cohort analysis retrieved successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

router.get(
  '/retention',
  authMiddleware,
  async (req, res) => {
    try {
      const { startDate, endDate, interval = 'week' } = req.query;
      const result = await analyticsClient.getRetentionMetrics({
        startDate: startDate as string,
        endDate: endDate as string,
        interval: interval as string
      });
      return sendResponse(res, result, 'Retention metrics retrieved successfully', 200);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

export default router;