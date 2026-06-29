import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { expenseService } from '../services/expense.service';

export const listExpenses = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Expenses', await expenseService.list(req.restaurantId!.toString(), req.query as Record<string, string>));
});
export const getExpense = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Expense', await expenseService.get(req.restaurantId!.toString(), req.params['id'] as string));
});
export const createExpense = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendCreated(res, 'Expense recorded', await expenseService.create(req.restaurantId!.toString(), req.body, req.user!._id.toString()));
});
export const updateExpense = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Expense updated', await expenseService.update(req.restaurantId!.toString(), req.params['id'] as string, req.body));
});
export const deleteExpense = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Expense deleted', await expenseService.delete(req.restaurantId!.toString(), req.params['id'] as string));
});
export const getExpenseSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const from = req.query.from ? new Date(req.query.from as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
  sendSuccess(res, 'Expense summary', await expenseService.getSummary(req.restaurantId!.toString(), from, to));
});
