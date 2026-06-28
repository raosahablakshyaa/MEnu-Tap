import { Router, Response, Request } from 'express';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { authenticate, validateBody, attachRestaurant, requireRestaurantOwner } from '../middlewares';
import { createPaymentOrderSchema, verifyPaymentSchema } from '../validators/restaurant.validator';
import { restaurantProfileService } from '../services/restaurantProfile.service';
import { paymentService } from '../services/payment.service';

const router = Router();

router.get('/plans', asyncHandler(async (_req: Request, res: Response) => {
  const plans = await restaurantProfileService.listPlans();
  sendSuccess(res, 'Plans retrieved', plans);
}));

router.use(authenticate);
router.use(attachRestaurant);
router.use(requireRestaurantOwner);

router.get('/current', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const sub = await restaurantProfileService.getCurrentSubscription(req.restaurantId!.toString());
  sendSuccess(res, 'Current subscription retrieved', sub);
}));

router.get('/history', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const history = await restaurantProfileService.getSubscriptionHistory(req.restaurantId!.toString());
  sendSuccess(res, 'Subscription history retrieved', history);
}));

router.post('/create', validateBody(createPaymentOrderSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const order = await paymentService.createOrder({
      planId: req.body.planId,
      restaurantId: req.restaurantId!.toString(),
      userId: req.user!._id.toString(),
    });
    sendCreated(res, 'Payment order created', order);
  })
);

export { router as subscriptionRoutes };

const paymentRouter = Router();

paymentRouter.post('/create-order', authenticate, attachRestaurant, requireRestaurantOwner,
  validateBody(createPaymentOrderSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const order = await paymentService.createOrder({
      planId: req.body.planId,
      restaurantId: req.restaurantId!.toString(),
      userId: req.user!._id.toString(),
    });
    sendCreated(res, 'Payment order created', order);
  })
);

paymentRouter.post('/verify', authenticate, attachRestaurant, requireRestaurantOwner,
  validateBody(verifyPaymentSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await paymentService.verifyPayment(
      req.body.razorpayOrderId,
      req.body.razorpayPaymentId,
      req.body.razorpaySignature,
      req
    );
    sendSuccess(res, 'Payment verified successfully', result);
  })
);

paymentRouter.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const result = await paymentService.handleWebhook(req.body, signature);
  sendSuccess(res, 'Webhook processed', result);
}));

export { paymentRouter };

export default router;
