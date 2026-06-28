import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { purchaseOrderService } from '../services/purchaseOrder.service';
import { POStatus } from '../models/purchaseOrder.model';

export const listPOs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Purchase orders', await purchaseOrderService.list(req.restaurantId!.toString(), req.query as Record<string, string>));
});
export const getPO = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Purchase order', await purchaseOrderService.get(req.restaurantId!.toString(), req.params['id'] as string));
});
export const createPO = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendCreated(res, 'Purchase order created', await purchaseOrderService.create(req.restaurantId!.toString(), req.body, req.user!._id.toString()));
});
export const updatePOStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Status updated', await purchaseOrderService.updateStatus(req.restaurantId!.toString(), req.params['id'] as string, req.body.status as POStatus, req.user!._id.toString()));
});
export const receiveItems = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Items received', await purchaseOrderService.receiveItems(req.restaurantId!.toString(), req.params['id'] as string, req.body.items, req.user!._id.toString()));
});
