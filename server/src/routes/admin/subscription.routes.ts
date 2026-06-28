import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { validateQuery, validateBody, validateParams } from '../../middlewares';
import { paginationSchema, createPlanSchema, assignPlanSchema } from '../../validators/admin.validator';
import { adminSubscriptionService } from '../../services/admin/subscription.service';
import { z } from 'zod';

const router = Router();

// Plans
router.get('/plans', validateQuery(paginationSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const plans = await adminSubscriptionService.listPlans(req.query as never);
    sendSuccess(res, 'Plans retrieved', plans);
  })
);

router.post('/plans', validateBody(createPlanSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const plan = await adminSubscriptionService.createPlan(req.body, req);
    sendCreated(res, 'Plan created', plan);
  })
);

router.patch('/plans/:id', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const plan = await adminSubscriptionService.updatePlan(req.params.id as string, req.body, req);
    sendSuccess(res, 'Plan updated', plan);
  })
);

router.delete('/plans/:id', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await adminSubscriptionService.deletePlan(req.params.id as string, req);
    sendSuccess(res, result.message);
  })
);

router.post('/plans/:id/pause', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const plan = await adminSubscriptionService.pausePlan(req.params.id as string, req);
    sendSuccess(res, 'Plan paused', plan);
  })
);

router.post('/plans/:id/duplicate', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const plan = await adminSubscriptionService.duplicatePlan(req.params.id as string, req);
    sendCreated(res, 'Plan duplicated', plan);
  })
);

// Subscriptions
router.get('/', validateQuery(paginationSchema.extend({
  status: z.string().optional(),
  restaurantId: z.string().optional(),
})),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subs = await adminSubscriptionService.listSubscriptions(req.query as never);
    sendSuccess(res, 'Subscriptions retrieved', subs);
  })
);

router.post('/assign', validateBody(assignPlanSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const sub = await adminSubscriptionService.assignPlan(
      req.body.restaurantId, req.body.planId, req, req.body.autoRenew
    );
    sendCreated(res, 'Plan assigned', sub);
  })
);

router.post('/:id/renew', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const sub = await adminSubscriptionService.renewSubscription(req.params.id as string, req);
    sendSuccess(res, 'Subscription renewed', sub);
  })
);

router.post('/:id/cancel', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const sub = await adminSubscriptionService.cancelSubscription(req.params.id as string, req, req.body.reason);
    sendSuccess(res, 'Subscription cancelled', sub);
  })
);

router.post('/:id/upgrade', validateParams(z.object({ id: z.string() })),
  validateBody(z.object({ planId: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const sub = await adminSubscriptionService.upgradeSubscription(req.params.id as string, req.body.planId, req);
    sendSuccess(res, 'Subscription upgraded', sub);
  })
);

router.post('/:id/invoice', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const invoice = await adminSubscriptionService.generateInvoice(req.params.id as string, req);
    sendCreated(res, 'Invoice generated', invoice);
  })
);

export default router;
