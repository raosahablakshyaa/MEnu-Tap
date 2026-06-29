import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { branchService } from '../services/branch.service';

export const listBranches = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Branches', await branchService.list(req.restaurantId!.toString()));
});
export const getBranch = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Branch', await branchService.get(req.restaurantId!.toString(), req.params['id'] as string));
});
export const createBranch = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendCreated(res, 'Branch created', await branchService.create(req.restaurantId!.toString(), req.body));
});
export const updateBranch = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Branch updated', await branchService.update(req.restaurantId!.toString(), req.params['id'] as string, req.body));
});
export const deleteBranch = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Branch closed', await branchService.delete(req.restaurantId!.toString(), req.params['id'] as string));
});
export const getBranchComparison = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const from = req.query.from ? new Date(req.query.from as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
  sendSuccess(res, 'Branch comparison', await branchService.getComparison(req.restaurantId!.toString(), from, to));
});
