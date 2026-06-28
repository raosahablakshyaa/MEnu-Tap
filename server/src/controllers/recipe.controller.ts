import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { recipeService } from '../services/recipe.service';

export const listRecipes = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = await recipeService.list(req.restaurantId!.toString());
  sendSuccess(res, 'Recipes fetched', data);
});

export const getRecipeByMenuItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = await recipeService.getByMenuItem(req.restaurantId!.toString(), req.params['menuItemId'] as string);
  sendSuccess(res, 'Recipe fetched', data);
});

export const upsertRecipe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = await recipeService.upsert(
    req.restaurantId!.toString(),
    req.params['menuItemId'] as string,
    req.body,
    req.user!._id.toString()
  );
  sendCreated(res, 'Recipe saved', data);
});

export const deleteRecipe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = await recipeService.delete(req.restaurantId!.toString(), req.params['menuItemId'] as string);
  sendSuccess(res, 'Recipe deleted', data);
});

export const getProfitAnalysis = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = await recipeService.getProfitAnalysis(req.restaurantId!.toString());
  sendSuccess(res, 'Profit analysis', data);
});
