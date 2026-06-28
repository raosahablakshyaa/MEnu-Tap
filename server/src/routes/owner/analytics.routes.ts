import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { analyticsService } from '../../services/analytics.service';

const router = Router();

router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = await analyticsService.getFullAnalytics(req.restaurantId!.toString());
  sendSuccess(res, 'Analytics retrieved', data);
}));

router.get('/revenue', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const period = (req.query.period as 'today' | 'week' | 'month' | 'year') || 'month';
  const data = await analyticsService.getRevenueSummary(req.restaurantId!.toString(), period);
  sendSuccess(res, 'Revenue summary retrieved', data);
}));

router.get('/daily', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const data = await analyticsService.getDailyRevenue(req.restaurantId!.toString(), days);
  sendSuccess(res, 'Daily revenue retrieved', data);
}));

router.get('/monthly', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const months = parseInt(req.query.months as string) || 12;
  const data = await analyticsService.getMonthlyRevenue(req.restaurantId!.toString(), months);
  sendSuccess(res, 'Monthly revenue retrieved', data);
}));

router.get('/peak-hours', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = await analyticsService.getPeakHours(req.restaurantId!.toString());
  sendSuccess(res, 'Peak hours retrieved', data);
}));

router.get('/top-items', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const data = await analyticsService.getTopSellingItems(req.restaurantId!.toString(), limit);
  sendSuccess(res, 'Top items retrieved', data);
}));

export default router;
