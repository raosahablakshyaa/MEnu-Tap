import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { adminDashboardService } from '../../services/admin/dashboard.service';

const router = Router();

router.get('/stats', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const stats = await adminDashboardService.getStats();
  sendSuccess(res, 'Dashboard stats retrieved', stats);
}));

router.get('/overview', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const overview = await adminDashboardService.getOverviewCounts();
  sendSuccess(res, 'Overview counts retrieved', overview);
}));

export default router;
