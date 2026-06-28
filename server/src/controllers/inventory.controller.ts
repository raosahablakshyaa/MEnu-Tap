import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { inventoryService } from '../services/inventory.service';
import { MovementType } from '../models/stockMovement.model';

const rid = (req: AuthenticatedRequest) => req.restaurantId!.toString();
const p = (req: AuthenticatedRequest, key: string) => req.params[key] as string;

export const listIngredients = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Ingredients fetched', await inventoryService.listIngredients(rid(req), req.query as Record<string, string>));
});

export const getIngredient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Ingredient fetched', await inventoryService.getIngredient(rid(req), p(req, 'id')));
});

export const createIngredient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendCreated(res, 'Ingredient created', await inventoryService.createIngredient(rid(req), req.body, req.user!._id.toString()));
});

export const updateIngredient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Ingredient updated', await inventoryService.updateIngredient(rid(req), p(req, 'id'), req.body));
});

export const deleteIngredient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Ingredient removed', await inventoryService.deleteIngredient(rid(req), p(req, 'id')));
});

export const adjustStock = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { quantity, type, notes, unitCost } = req.body;
  sendSuccess(res, 'Stock adjusted', await inventoryService.adjustStock(rid(req), p(req, 'id'), quantity, type as MovementType, notes, req.user!._id.toString(), unitCost));
});

export const getStockMovements = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ingredientId = (req.params['ingredientId'] as string) ?? 'all';
  sendSuccess(res, 'Stock movements fetched', await inventoryService.getStockMovements(rid(req), ingredientId, req.query as Record<string, string>));
});

export const getLowStockAlerts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Low stock alerts', await inventoryService.getLowStockAlerts(rid(req)));
});

export const getInventoryValuation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Inventory valuation', await inventoryService.getInventoryValuation(rid(req)));
});
