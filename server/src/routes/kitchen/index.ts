/**
 * @openapi
 * tags:
 *   name: Kitchen
 *   description: Kitchen Display System — real-time order management
 */
import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { authenticate, attachRestaurant, authorizeRoles } from '../../middlewares';
import { orderService } from '../../services/order.service';
import { orderPaymentService } from '../../services/orderPayment.service';
import { ROLE_SLUGS } from '../../constants';

const router = Router();

// All kitchen routes require authentication + restaurant context
// Allowed roles: owner, manager, kitchen_staff, waiter
const KITCHEN_ROLES = [
  ROLE_SLUGS.RESTAURANT_OWNER,
  ROLE_SLUGS.RESTAURANT_MANAGER,
  ROLE_SLUGS.KITCHEN_STAFF,
  ROLE_SLUGS.WAITER,
];

router.use(authenticate);
router.use(attachRestaurant);
router.use(authorizeRoles(...KITCHEN_ROLES));

/**
 * @openapi
 * /kitchen/orders:
 *   get:
 *     tags: [Kitchen]
 *     summary: Get active kitchen queue (pending, confirmed, preparing, ready)
 *     security:
 *       - bearerAuth: []
 */
router.get('/orders', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const orders = await orderService.getKitchenOrders(req.restaurantId!.toString());
  sendSuccess(res, 'Kitchen orders retrieved', orders);
}));

/**
 * @openapi
 * /kitchen/orders/history:
 *   get:
 *     tags: [Kitchen]
 *     summary: Get order history with filters
 */
router.get('/orders/history', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status, page, limit, dateFrom, dateTo } = req.query as Record<string, string>;
  const result = await orderService.getRestaurantOrders(req.restaurantId!.toString(), {
    status,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    dateFrom,
    dateTo,
  });
  sendSuccess(res, 'Order history retrieved', result);
}));

/**
 * @openapi
 * /kitchen/orders/{orderId}:
 *   get:
 *     tags: [Kitchen]
 *     summary: Get single order details
 */
router.get('/orders/:orderId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { Order } = await import('../../models/order.model');
  const order = await Order.findOne({
    _id: req.params['orderId'],
    restaurantId: req.restaurantId!,
  });
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found', data: null, errors: null });
    return;
  }
  sendSuccess(res, 'Order retrieved', order);
}));

/**
 * @openapi
 * /kitchen/orders/{orderId}/status:
 *   put:
 *     tags: [Kitchen]
 *     summary: Update order status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, preparing, ready, served, completed, cancelled]
 *               cancelReason:
 *                 type: string
 */
router.put('/orders/:orderId/status', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status, cancelReason } = req.body as { status: string; cancelReason?: string };

  if (!status) {
    res.status(400).json({ success: false, message: 'status is required', data: null, errors: null });
    return;
  }

  const order = await orderService.updateStatus(
    req.restaurantId!.toString(),
    req.params['orderId'] as string,
    {
      status: status as Parameters<typeof orderService.updateStatus>[2]['status'],
      cancelReason,
      staffId: req.user!._id.toString(),
    }
  );
  sendSuccess(res, `Order ${status}`, order);
}));

/**
 * @openapi
 * /kitchen/orders/{orderId}/cash-paid:
 *   put:
 *     tags: [Kitchen]
 *     summary: Mark order as paid by cash (staff action)
 */
router.put('/orders/:orderId/cash-paid', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const order = await orderPaymentService.markCashPaid(
    req.params['orderId'] as string,
    req.restaurantId!.toString(),
    req.user!._id.toString()
  );
  sendSuccess(res, 'Order marked as cash paid', order);
}));

/**
 * @openapi
 * /kitchen/feedback:
 *   get:
 *     tags: [Kitchen]
 *     summary: Get customer feedback/reviews for the restaurant
 */
router.get('/feedback', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 20;
  const result = await orderService.getRestaurantFeedback(req.restaurantId!.toString(), page, limit);
  sendSuccess(res, 'Feedback retrieved', result);
}));

export default router;
