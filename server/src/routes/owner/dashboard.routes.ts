import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { dashboardService } from '../../services/dashboard.service';

const router = Router();

router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await dashboardService.getDashboardStats(req.restaurantId!.toString());
  sendSuccess(res, 'Dashboard stats retrieved', stats);
}));

export default router;
