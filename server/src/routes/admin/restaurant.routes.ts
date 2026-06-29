import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { validateQuery, validateBody, validateParams } from '../../middlewares';
import { paginationSchema, rejectRestaurantSchema, suspendRestaurantSchema, requestInfoSchema } from '../../validators/admin.validator';
import { adminRestaurantService } from '../../services/admin/restaurant.service';
import { z } from 'zod';

const router = Router();

router.get('/', validateQuery(paginationSchema.extend({
  status: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
})), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await adminRestaurantService.list(req.query as never);
  sendSuccess(res, 'Restaurants retrieved', result);
}));

router.get('/export', validateQuery(paginationSchema.extend({ status: z.string().optional() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await adminRestaurantService.exportList(req.query as never);
    sendSuccess(res, 'Restaurants exported', data);
  })
);

router.get('/pending', validateQuery(paginationSchema.extend({
  search: z.string().optional(),
})),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await adminRestaurantService.listPending(req.query as never);
    sendSuccess(res, 'Pending restaurants retrieved', result);
  })
);

router.post('/:id/request-info', validateParams(z.object({ id: z.string() })),
  validateBody(requestInfoSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const restaurant = await adminRestaurantService.requestInfo(req.params.id as string, req, req.body.notes);
    sendSuccess(res, 'Information requested', restaurant);
  })
);

router.get('/:id', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const restaurant = await adminRestaurantService.getById(req.params.id as string);
    sendSuccess(res, 'Restaurant retrieved', restaurant);
  })
);

router.patch('/:id', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const restaurant = await adminRestaurantService.update(req.params.id as string, req.body, req);
    sendSuccess(res, 'Restaurant updated', restaurant);
  })
);

router.post('/:id/approve', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const restaurant = await adminRestaurantService.approve(req.params.id as string, req, req.body.notes);
    sendSuccess(res, 'Restaurant approved', restaurant);
  })
);

router.post('/:id/reject', validateParams(z.object({ id: z.string() })), validateBody(rejectRestaurantSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const restaurant = await adminRestaurantService.reject(req.params.id as string, req, req.body.reason);
    sendSuccess(res, 'Restaurant rejected', restaurant);
  })
);

router.post('/:id/suspend', validateParams(z.object({ id: z.string() })), validateBody(suspendRestaurantSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const restaurant = await adminRestaurantService.suspend(req.params.id as string, req, req.body.reason);
    sendSuccess(res, 'Restaurant suspended', restaurant);
  })
);

router.post('/:id/activate', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const restaurant = await adminRestaurantService.activate(req.params.id as string, req);
    sendSuccess(res, 'Restaurant activated', restaurant);
  })
);

router.delete('/:id', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await adminRestaurantService.softDelete(req.params.id as string, req);
    sendSuccess(res, result.message);
  })
);

router.post('/:id/restore', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const restaurant = await adminRestaurantService.restore(req.params.id as string, req);
    sendSuccess(res, 'Restaurant restored', restaurant);
  })
);

router.get('/:id/analytics', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const analytics = await adminRestaurantService.getAnalytics(req.params.id as string);
    sendSuccess(res, 'Restaurant analytics retrieved', analytics);
  })
);

router.get('/:id/orders', validateParams(z.object({ id: z.string() })), validateQuery(paginationSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const orders = await adminRestaurantService.getOrders(req.params.id as string, req.query as never);
    sendSuccess(res, 'Restaurant orders retrieved', orders);
  })
);

router.get('/:id/staff', validateParams(z.object({ id: z.string() })), validateQuery(paginationSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const staff = await adminRestaurantService.getStaff(req.params.id as string, req.query as never);
    sendSuccess(res, 'Restaurant staff retrieved', staff);
  })
);

router.post('/:id/impersonate', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await adminRestaurantService.impersonate(req.params.id as string, req);
    sendSuccess(res, 'Impersonation token generated', result);
  })
);

export default router;
