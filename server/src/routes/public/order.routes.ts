/**
 * @openapi
 * tags:
 *   name: CustomerOrder
 *   description: Customer order placement and tracking
 */
import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { customerSessionService } from '../../services/customerSession.service';
import { orderService } from '../../services/order.service';
import { orderPaymentService } from '../../services/orderPayment.service';

const router = Router();

/**
 * @openapi
 * /orders/session/{sessionId}/details:
 *   put:
 *     tags: [CustomerOrder]
 *     summary: Save customer personal details to session
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [consentGiven]
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               birthday: { type: string, format: date }
 *               anniversary: { type: string, format: date }
 *               consentGiven: { type: boolean }
 */
router.put('/session/:sessionId/details', asyncHandler(async (req: Request, res: Response) => {
  const session = await customerSessionService.saveCustomerDetails(
    req.params['sessionId'] as string,
    req.body
  );
  sendSuccess(res, 'Customer details saved', {
    sessionId: session.sessionId,
    name: session.name,
    phone: session.phone,
    email: session.email,
  });
}));

/**
 * @openapi
 * /orders:
 *   post:
 *     tags: [CustomerOrder]
 *     summary: Place an order from cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, paymentMethod]
 *             properties:
 *               sessionId: { type: string }
 *               paymentMethod: { type: string, enum: [cash, upi, card, wallet, razorpay] }
 *               couponCode: { type: string }
 *               notes: { type: string }
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, paymentMethod, couponCode, notes } = req.body as {
    sessionId: string;
    paymentMethod: string;
    couponCode?: string;
    notes?: string;
  };

  if (!sessionId || !paymentMethod) {
    res.status(400).json({ success: false, message: 'sessionId and paymentMethod are required', data: null, errors: null });
    return;
  }

  const order = await orderService.placeOrder({ sessionId, paymentMethod, couponCode, notes });
  sendCreated(res, 'Order placed successfully', order);
}));

/**
 * @openapi
 * /orders/session/{sessionId}:
 *   get:
 *     tags: [CustomerOrder]
 *     summary: Get all orders for a session
 */
router.get('/session/:sessionId', asyncHandler(async (req: Request, res: Response) => {
  const orders = await orderService.getSessionOrders(req.params['sessionId'] as string);
  sendSuccess(res, 'Session orders retrieved', orders);
}));

/**
 * @openapi
 * /orders/{orderId}:
 *   get:
 *     tags: [CustomerOrder]
 *     summary: Get order status (customer-facing, requires sessionId header)
 */
router.get('/:orderId', asyncHandler(async (req: Request, res: Response) => {
  const sessionId = req.headers['x-session-id'] as string;
  if (!sessionId) {
    res.status(400).json({ success: false, message: 'X-Session-Id header required', data: null, errors: null });
    return;
  }
  const order = await orderService.getOrderBySession(req.params['orderId'] as string, sessionId);
  sendSuccess(res, 'Order retrieved', order);
}));

/**
 * @openapi
 * /orders/{orderId}/payment/razorpay:
 *   post:
 *     tags: [CustomerOrder]
 *     summary: Create Razorpay order for payment
 */
router.post('/:orderId/payment/razorpay', asyncHandler(async (req: Request, res: Response) => {
  const sessionId = req.headers['x-session-id'] as string;
  if (!sessionId) {
    res.status(400).json({ success: false, message: 'X-Session-Id header required', data: null, errors: null });
    return;
  }
  const result = await orderPaymentService.createRazorpayOrder(
    req.params['orderId'] as string,
    sessionId
  );
  sendSuccess(res, 'Razorpay order created', result);
}));

/**
 * @openapi
 * /orders/payment/verify:
 *   post:
 *     tags: [CustomerOrder]
 *     summary: Verify Razorpay payment signature
 */
router.post('/payment/verify', asyncHandler(async (req: Request, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  };

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    res.status(400).json({ success: false, message: 'Missing payment fields', data: null, errors: null });
    return;
  }

  const result = await orderPaymentService.verifyPayment(
    razorpayOrderId, razorpayPaymentId, razorpaySignature
  );
  sendSuccess(res, 'Payment verified', result);
}));

/**
 * @openapi
 * /orders/{orderId}/feedback:
 *   post:
 *     tags: [CustomerOrder]
 *     summary: Submit order feedback
 */
router.post('/:orderId/feedback', asyncHandler(async (req: Request, res: Response) => {
  const sessionId = req.headers['x-session-id'] as string;
  if (!sessionId) {
    res.status(400).json({ success: false, message: 'X-Session-Id header required', data: null, errors: null });
    return;
  }

  const { foodRating, serviceRating, ambienceRating, comment } = req.body as {
    foodRating: number;
    serviceRating: number;
    ambienceRating: number;
    comment?: string;
  };

  const feedback = await orderService.submitFeedback(
    req.params['orderId'] as string,
    sessionId,
    { foodRating, serviceRating, ambienceRating, comment }
  );
  sendCreated(res, 'Feedback submitted', feedback);
}));

export default router;
