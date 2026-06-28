import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { aiService } from '../services/ai.service';

export const generateDailyReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const report = await aiService.generateDailyReport(req.restaurantId!.toString());
  sendSuccess(res, 'AI report generated', report);
});

export const getLatestReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const period = (req.query.period as string) || 'daily';
  sendSuccess(res, 'Latest AI report', await aiService.getLatestReport(req.restaurantId!.toString(), period));
});

export const getReportHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const period = (req.query.period as string) || 'daily';
  const limit = parseInt(req.query.limit as string) || 30;
  sendSuccess(res, 'Report history', await aiService.getReportHistory(req.restaurantId!.toString(), period, limit));
});

export const getSalesForecast = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Sales forecast', await aiService.getSalesForecast(req.restaurantId!.toString()));
});

export const getExecutiveDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Executive dashboard', await aiService.getExecutiveDashboard(req.restaurantId!.toString()));
});
