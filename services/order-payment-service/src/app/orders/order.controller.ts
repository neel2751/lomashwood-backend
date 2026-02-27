import { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service';
import { 
  CreateOrderSchema, 
  UpdateOrderSchema, 
  UpdateOrderStatusSchema,
  GetOrdersQuerySchema 
} from './order.schemas';
import { asyncHandler } from '../../interfaces/http/middleware/error.middleware';
import { AuthRequest } from '../../interfaces/http/middleware/auth.middleware';
import { logger } from '../../config/logger';

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  createOrder = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validatedData = CreateOrderSchema.parse(req.body);
    const userId = req.user?.userId;

    logger.info('Creating order', { 
      customerId: validatedData.customerId,
      itemCount: validatedData.items.length,
      requestedBy: userId 
    });

    const order = await this.orderService.createOrder(validatedData, userId);

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully',
    });
  });

  getOrderById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    logger.info('Fetching order', { orderId: id, requestedBy: userId });

    const order = await this.orderService.getOrderById(id, userId, userRole);

    res.status(200).json({
      success: true,
      data: order,
    });
  });

  getOrders = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validatedQuery = GetOrdersQuerySchema.parse(req.query);
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    logger.info('Fetching orders', { 
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      requestedBy: userId 
    });

    const result = await this.orderService.getOrders(validatedQuery, userId, userRole);

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
        hasNextPage: result.pagination.hasNextPage,
        hasPreviousPage: result.pagination.hasPreviousPage,
      },
    });
  });

  getOrderByNumber = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { orderNumber } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    logger.info('Fetching order by number', { orderNumber, requestedBy: userId });

    const order = await this.orderService.getOrderByNumber(orderNumber, userId, userRole);

    res.status(200).json({
      success: true,
      data: order,
    });
  });

  getCustomerOrders = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    const validatedQuery = GetOrdersQuerySchema.parse(req.query);
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    logger.info('Fetching customer orders', { 
      customerId, 
      requestedBy: userId 
    });

    const result = await this.orderService.getCustomerOrders(
      customerId, 
      validatedQuery, 
      userId, 
      userRole
    );

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
        hasNextPage: result.pagination.hasNextPage,
        hasPreviousPage: result.pagination.hasPreviousPage,
      },
    });
  });

  updateOrder = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const validatedData = UpdateOrderSchema.parse(req.body);
    const userId = req.user?.userId;

    logger.info('Updating order', { orderId: id, requestedBy: userId });

    const order = await this.orderService.updateOrder(id, validatedData, userId);

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order updated successfully',
    });
  });

  updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const validatedData = UpdateOrderStatusSchema.parse(req.body);
    const userId = req.user?.userId;

    logger.info('Updating order status', { 
      orderId: id, 
      newStatus: validatedData.status,
      requestedBy: userId 
    });

    const order = await this.orderService.updateOrderStatus(
      id, 
      validatedData.status, 
      validatedData.notes,
      userId
    );

    res.status(200).json({
      success: true,
      data: order,
      message: `Order status updated to ${validatedData.status}`,
    });
  });

  cancelOrder = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;

    logger.info('Cancelling order', { orderId: id, reason, requestedBy: userId });

    const order = await this.orderService.cancelOrder(id, reason, userId);

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order cancelled successfully',
    });
  });

  getOrderStatistics = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { customerId } = req.query;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    logger.info('Fetching order statistics', { 
      customerId: customerId as string,
      requestedBy: userId 
    });

    const statistics = await this.orderService.getOrderStatistics(
      customerId as string | undefined,
      userId,
      userRole
    );

    res.status(200).json({
      success: true,
      data: statistics,
    });
  });

  deleteOrder = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    logger.info('Soft deleting order', { orderId: id, requestedBy: userId });

    await this.orderService.deleteOrder(id, userId);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
    });
  });

  addTrackingInfo = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { trackingNumber, trackingUrl, carrier } = req.body;
    const userId = req.user?.userId;

    logger.info('Adding tracking info to order', { 
      orderId: id, 
      trackingNumber,
      requestedBy: userId 
    });

    const order = await this.orderService.addTrackingInfo(
      id, 
      { trackingNumber, trackingUrl, carrier },
      userId
    );

    res.status(200).json({
      success: true,
      data: order,
      message: 'Tracking information added successfully',
    });
  });

  getOrderStatusHistory = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    logger.info('Fetching order status history', { orderId: id, requestedBy: userId });

    const history = await this.orderService.getOrderStatusHistory(id, userId);

    res.status(200).json({
      success: true,
      data: history,
    });
  });
}