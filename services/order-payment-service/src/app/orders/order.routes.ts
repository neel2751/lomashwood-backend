import { Router } from 'express';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { OrderMapper } from './order.mapper';
import { 
  authMiddleware, 
  optionalAuthMiddleware,
  requireAdmin,
  requireCustomer 
} from '../../interfaces/http/middleware/auth.middleware';
import { strictRateLimiter } from '../../interfaces/http/middleware/rate-limit.middleware';

const router = Router();

const orderRepository = new OrderRepository();
const orderMapper = new OrderMapper();
const orderService = new OrderService(orderRepository, orderMapper);
const orderController = new OrderController(orderService);

/**
 * @route   POST /api/v1/orders
 * @desc    Create a new order
 * @access  Private (Customer)
 */
router.post(
  '/',
  authMiddleware,
  requireCustomer,
  orderController.createOrder
);

/**
 * @route   GET /api/v1/orders
 * @desc    Get all orders (with pagination and filters)
 * @access  Private (Admin sees all, Customer sees own)
 */
router.get(
  '/',
  authMiddleware,
  orderController.getOrders
);

/**
 * @route   GET /api/v1/orders/statistics
 * @desc    Get order statistics and analytics
 * @access  Private (Admin for all, Customer for own)
 */
router.get(
  '/statistics',
  authMiddleware,
  orderController.getOrderStatistics
);

/**
 * @route   GET /api/v1/orders/search
 * @desc    Search orders by various criteria
 * @access  Private (Admin)
 */
router.get(
  '/search',
  authMiddleware,
  requireAdmin,
  orderController.searchOrders
);

/**
 * @route   GET /api/v1/orders/export
 * @desc    Export orders to CSV
 * @access  Private (Admin)
 */
router.get(
  '/export',
  authMiddleware,
  requireAdmin,
  strictRateLimiter,
  orderController.exportOrders
);

/**
 * @route   GET /api/v1/orders/pending
 * @desc    Get all pending orders
 * @access  Private (Admin)
 */
router.get(
  '/pending',
  authMiddleware,
  requireAdmin,
  orderController.getPendingOrders
);

/**
 * @route   GET /api/v1/orders/pending/stale
 * @desc    Get stale pending orders (older than X hours)
 * @access  Private (Admin)
 */
router.get(
  '/pending/stale',
  authMiddleware,
  requireAdmin,
  orderController.getStalePendingOrders
);

/**
 * @route   GET /api/v1/orders/without-payment
 * @desc    Get orders without payment
 * @access  Private (Admin)
 */
router.get(
  '/without-payment',
  authMiddleware,
  requireAdmin,
  orderController.getOrdersWithoutPayment
);

/**
 * @route   GET /api/v1/orders/revenue
 * @desc    Get revenue analytics by period
 * @access  Private (Admin)
 */
router.get(
  '/revenue',
  authMiddleware,
  requireAdmin,
  orderController.getRevenueByPeriod
);

/**
 * @route   GET /api/v1/orders/top-customers
 * @desc    Get top customers by revenue
 * @access  Private (Admin)
 */
router.get(
  '/top-customers',
  authMiddleware,
  requireAdmin,
  orderController.getTopCustomers
);

/**
 * @route   GET /api/v1/orders/number/:orderNumber
 * @desc    Get order by order number
 * @access  Private
 */
router.get(
  '/number/:orderNumber',
  authMiddleware,
  orderController.getOrderByNumber
);

/**
 * @route   GET /api/v1/orders/customer/:customerId
 * @desc    Get all orders for a specific customer
 * @access  Private (Admin or own customer)
 */
router.get(
  '/customer/:customerId',
  authMiddleware,
  orderController.getCustomerOrders
);

/**
 * @route   GET /api/v1/orders/product/:productId
 * @desc    Get all orders containing a specific product
 * @access  Private (Admin)
 */
router.get(
  '/product/:productId',
  authMiddleware,
  requireAdmin,
  orderController.getOrdersByProduct
);

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get(
  '/:id',
  authMiddleware,
  orderController.getOrderById
);

/**
 * @route   PATCH /api/v1/orders/:id
 * @desc    Update order details
 * @access  Private (Admin)
 */
router.patch(
  '/:id',
  authMiddleware,
  requireAdmin,
  orderController.updateOrder
);

/**
 * @route   PATCH /api/v1/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin)
 */
router.patch(
  '/:id/status',
  authMiddleware,
  requireAdmin,
  orderController.updateOrderStatus
);

/**
 * @route   POST /api/v1/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Private (Customer can cancel own, Admin can cancel any)
 */
router.post(
  '/:id/cancel',
  authMiddleware,
  orderController.cancelOrder
);

/**
 * @route   POST /api/v1/orders/:id/tracking
 * @desc    Add tracking information to order
 * @access  Private (Admin)
 */
router.post(
  '/:id/tracking',
  authMiddleware,
  requireAdmin,
  orderController.addTrackingInfo
);

/**
 * @route   POST /api/v1/orders/:id/confirm
 * @desc    Confirm an order
 * @access  Private (Admin)
 */
router.post(
  '/:id/confirm',
  authMiddleware,
  requireAdmin,
  orderController.confirmOrder
);

/**
 * @route   POST /api/v1/orders/:id/ship
 * @desc    Mark order as shipped
 * @access  Private (Admin)
 */
router.post(
  '/:id/ship',
  authMiddleware,
  requireAdmin,
  orderController.shipOrder
);

/**
 * @route   POST /api/v1/orders/:id/deliver
 * @desc    Mark order as delivered
 * @access  Private (Admin)
 */
router.post(
  '/:id/deliver',
  authMiddleware,
  requireAdmin,
  orderController.deliverOrder
);

/**
 * @route   POST /api/v1/orders/:id/notes
 * @desc    Add internal notes to order
 * @access  Private (Admin)
 */
router.post(
  '/:id/notes',
  authMiddleware,
  requireAdmin,
  orderController.addOrderNotes
);

/**
 * @route   GET /api/v1/orders/:id/history
 * @desc    Get order status history
 * @access  Private
 */
router.get(
  '/:id/history',
  authMiddleware,
  orderController.getOrderStatusHistory
);

/**
 * @route   GET /api/v1/orders/:id/invoice
 * @desc    Get order invoice
 * @access  Private
 */
router.get(
  '/:id/invoice',
  authMiddleware,
  orderController.getOrderInvoice
);

/**
 * @route   POST /api/v1/orders/:id/restore
 * @desc    Restore a soft-deleted order
 * @access  Private (Admin)
 */
router.post(
  '/:id/restore',
  authMiddleware,
  requireAdmin,
  orderController.restoreOrder
);

/**
 * @route   DELETE /api/v1/orders/:id
 * @desc    Soft delete an order
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  orderController.deleteOrder
);

/**
 * @route   POST /api/v1/orders/bulk/status
 * @desc    Bulk update order status
 * @access  Private (Admin)
 */
router.post(
  '/bulk/status',
  authMiddleware,
  requireAdmin,
  strictRateLimiter,
  orderController.bulkUpdateStatus
);

/**
 * @route   POST /api/v1/orders/bulk/export
 * @desc    Bulk export selected orders
 * @access  Private (Admin)
 */
router.post(
  '/bulk/export',
  authMiddleware,
  requireAdmin,
  strictRateLimiter,
  orderController.bulkExportOrders
);

export { router as orderRoutes };