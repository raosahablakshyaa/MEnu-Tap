import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { validateQuery } from '../../middlewares';
import { paginationSchema, reportDateRangeSchema } from '../../validators/admin.validator';
import { adminRevenueService } from '../../services/admin/revenue.service';
import { z } from 'zod';

const router = Router();

router.get('/dashboard', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const data = await adminRevenueService.getDashboard();
  sendSuccess(res, 'Revenue dashboard retrieved', data);
}));

router.get('/transactions', validateQuery(paginationSchema.extend({
  status: z.string().optional(),
  type: z.string().optional(),
  restaurantId: z.string().optional(),
})),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await adminRevenueService.listTransactions(req.query as never);
    sendSuccess(res, 'Transactions retrieved', data);
  })
);

router.get('/export', validateQuery(reportDateRangeSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await adminRevenueService.exportRevenue(req.query.from as unknown as Date, req.query.to as unknown as Date);
    sendSuccess(res, 'Revenue exported', data);
  })
);

export default router;
