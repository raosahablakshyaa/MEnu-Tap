import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { supplierService } from '../services/supplier.service';

export const listSuppliers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Suppliers', await supplierService.list(req.restaurantId!.toString(), req.query as Record<string, string>));
});
export const getSupplier = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Supplier', await supplierService.get(req.restaurantId!.toString(), req.params['id'] as string));
});
export const createSupplier = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendCreated(res, 'Supplier created', await supplierService.create(req.restaurantId!.toString(), req.body));
});
export const updateSupplier = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Supplier updated', await supplierService.update(req.restaurantId!.toString(), req.params['id'] as string, req.body));
});
export const deleteSupplier = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Supplier removed', await supplierService.delete(req.restaurantId!.toString(), req.params['id'] as string));
});
