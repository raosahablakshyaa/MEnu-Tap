import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { validateQuery, validateBody, validateParams } from '../../middlewares';
import { paginationSchema, createCouponSchema } from '../../validators/admin.validator';
import { adminCouponService } from '../../services/admin/coupon.service';
import { z } from 'zod';

const router = Router();

router.get('/', validateQuery(paginationSchema.extend({
  status: z.string().optional(),
  type: z.string().optional(),
})),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const coupons = await adminCouponService.list(req.query as never);
    sendSuccess(res, 'Coupons retrieved', coupons);
  })
);

router.post('/', validateBody(createCouponSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const coupon = await adminCouponService.create(req.body, req);
    sendCreated(res, 'Coupon created', coupon);
  })
);

router.patch('/:id', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const coupon = await adminCouponService.update(req.params.id as string, req.body, req);
    sendSuccess(res, 'Coupon updated', coupon);
  })
);

router.delete('/:id', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await adminCouponService.delete(req.params.id as string, req);
    sendSuccess(res, result.message);
  })
);

router.get('/:id/analytics', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const analytics = await adminCouponService.getAnalytics(req.params.id as string);
    sendSuccess(res, 'Coupon analytics retrieved', analytics);
  })
);

export default router;
