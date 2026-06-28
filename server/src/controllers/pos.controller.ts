import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { posService } from '../services/pos.service';

export const createBill = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendCreated(res, 'Bill created', await posService.createBill(req.restaurantId!.toString(), req.body, req.user!._id.toString()));
});

export const listTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Transactions', await posService.list(req.restaurantId!.toString(), req.query as Record<string, string>));
});

export const getTransaction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Transaction', await posService.get(req.restaurantId!.toString(), req.params['id'] as string));
});

export const voidBill = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Bill voided', await posService.voidBill(req.restaurantId!.toString(), req.params['id'] as string));
});

export const generateGstInvoice = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendCreated(res, 'GST invoice generated', await posService.generateGstInvoice(req.restaurantId!.toString(), req.params['id'] as string));
});

export const getDailySummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  sendSuccess(res, 'Daily POS summary', await posService.getDailySummary(req.restaurantId!.toString(), date));
});
