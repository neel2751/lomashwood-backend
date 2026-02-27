import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import * as orderValidators from '../validators/order.validator';
import * as orderClientModule from '../services/order.client';

const router = Router();


const orderCreateSchema = (orderValidators as any).orderCreateSchema ?? (orderValidators as any).default?.orderCreateSchema;
const paymentIntentSchema = (orderValidators as any).paymentIntentSchema ?? (orderValidators as any).default?.paymentIntentSchema;
const orderUpdateSchema = (orderValidators as any).orderUpdateSchema ?? (orderValidators as any).default?.orderUpdateSchema;
const refundSchema = (orderValidators as any).refundSchema ?? (orderValidators as any).default?.refundSchema;
const invoiceGenerateSchema = (orderValidators as any).invoiceGenerateSchema ?? (orderValidators as any).default?.invoiceGenerateSchema;


const orderClient = (orderClientModule as any).default ?? orderClientModule;


router.post('/orders', authMiddleware, validateRequest(orderCreateSchema), async (req, res, next) => {
  try {
    const response = await orderClient.createOrder(
      req.user?.id,
      req.body,
      req.headers.authorization!
    );
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/orders', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.getUserOrders(
      req.user?.id,
      req.query,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: response.orders,
      pagination: response.pagination,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/orders/all', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.getAllOrders(
      req.query,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: response.orders,
      pagination: response.pagination,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/orders/stats/overview', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.getOrderStats(
      req.query,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Order statistics retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/orders/:id', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.getOrderById(
      req.params.id,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.patch('/orders/:id', authMiddleware, validateRequest(orderUpdateSchema), async (req, res, next) => {
  try {
    const response = await orderClient.updateOrder(
      req.params.id,
      req.body,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.delete('/orders/:id', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.cancelOrder(
      req.params.id,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/orders/:id/tracking', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.getOrderTracking(
      req.params.id,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Tracking information retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.post('/payments/create-intent', authMiddleware, validateRequest(paymentIntentSchema), async (req, res, next) => {
  try {
    const response = await orderClient.createPaymentIntent(
      req.body,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Payment intent created successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.post('/payments/confirm', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.confirmPayment(
      req.body,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.post('/payments/retry', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.retryPayment(
      req.body,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Payment retry initiated successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/payments/stats/overview', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.getPaymentStats(
      req.query,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Payment statistics retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/payments/:id', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.getPaymentById(
      req.params.id,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Payment retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/payments/order/:orderId', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.getOrderPayments(
      req.params.orderId,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Order payments retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.post('/webhooks/stripe', async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const response = await orderClient.handleStripeWebhook(req.body, signature);
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/invoices/:orderId', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.getInvoice(
      req.params.orderId,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Invoice retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.post('/invoices/generate', authMiddleware, validateRequest(invoiceGenerateSchema), async (req, res, next) => {
  try {
    const response = await orderClient.generateInvoice(
      req.body,
      req.headers.authorization!
    );
    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/invoices/:orderId/download', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.downloadInvoice(
      req.params.orderId,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Invoice download link generated',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.post('/invoices/:orderId/send', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.sendInvoice(
      req.params.orderId,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Invoice sent successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.post('/refunds', authMiddleware, validateRequest(refundSchema), async (req, res, next) => {
  try {
    const response = await orderClient.createRefund(
      req.body,
      req.headers.authorization!
    );
    res.status(201).json({
      success: true,
      message: 'Refund request created successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/refunds/order/:orderId', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.getOrderRefunds(
      req.params.orderId,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Order refunds retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/refunds/:id', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.getRefundById(
      req.params.id,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Refund retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.patch('/refunds/:id/approve', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.approveRefund(
      req.params.id,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Refund approved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.patch('/refunds/:id/reject', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.rejectRefund(
      req.params.id,
      req.body,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Refund rejected successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.post('/coupons/validate', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.validateCoupon(
      req.body,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Coupon validated successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.post('/coupons/apply', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.applyCoupon(
      req.body,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.post('/coupons', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.createCoupon(
      req.body,
      req.headers.authorization!
    );
    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/coupons', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.getAllCoupons(req.headers.authorization!);
    res.status(200).json({
      success: true,
      message: 'Coupons retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.post('/taxes/calculate', authMiddleware, async (req, res, next) => {
  try {
    const response = await orderClient.calculateTaxes(
      req.body,
      req.headers.authorization!
    );
    res.status(200).json({
      success: true,
      message: 'Taxes calculated successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/shipping/methods', async (req, res, next) => {
  try {
    const response = await orderClient.getShippingMethods(req.query);
    res.status(200).json({
      success: true,
      message: 'Shipping methods retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.post('/shipping/calculate', async (req, res, next) => {
  try {
    const response = await orderClient.calculateShipping(req.body);
    res.status(200).json({
      success: true,
      message: 'Shipping cost calculated successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

export default router;