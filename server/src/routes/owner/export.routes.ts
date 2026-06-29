import { Router, Response } from 'express';
import { authenticate, attachRestaurant, requireRestaurantOwner, requireApprovedRestaurant } from '../../middlewares';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthenticatedRequest } from '../../types';
import { exportService } from '../../services/export.service';

const router = Router();

router.use(authenticate, attachRestaurant, requireRestaurantOwner, requireApprovedRestaurant);

type ExportFormat = 'json' | 'csv' | 'excel';

function parseFormat(raw: string | undefined): ExportFormat {
  if (raw === 'csv' || raw === 'json' || raw === 'excel') return raw;
  return 'json';
}

function parseDates(from?: string, to?: string) {
  return {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  };
}

function sendExport(res: Response, result: { data: string | Buffer; contentType: string; filename: string }) {
  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(result.data);
}

router.get('/export/orders', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const fmt = parseFormat(req.query.format as string);
  const { from, to } = parseDates(req.query.from as string, req.query.to as string);
  const result = await exportService.exportOrders(req.restaurantId!.toString(), fmt, from, to);
  sendExport(res, result);
}));

router.get('/export/menu', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const fmt = parseFormat(req.query.format as string);
  const result = await exportService.exportMenu(req.restaurantId!.toString(), fmt);
  sendExport(res, result);
}));

router.get('/export/customers', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const fmt = parseFormat(req.query.format as string);
  const result = await exportService.exportCustomers(req.restaurantId!.toString(), fmt);
  sendExport(res, result);
}));

router.get('/export/expenses', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const fmt = parseFormat(req.query.format as string);
  const { from, to } = parseDates(req.query.from as string, req.query.to as string);
  const result = await exportService.exportExpenses(req.restaurantId!.toString(), fmt, from, to);
  sendExport(res, result);
}));

router.get('/export/pos', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const fmt = parseFormat(req.query.format as string);
  const { from, to } = parseDates(req.query.from as string, req.query.to as string);
  const result = await exportService.exportPOS(req.restaurantId!.toString(), fmt, from, to);
  sendExport(res, result);
}));

router.get('/export/stock-movements', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const fmt = parseFormat(req.query.format as string);
  const { from, to } = parseDates(req.query.from as string, req.query.to as string);
  const result = await exportService.exportStockMovements(req.restaurantId!.toString(), fmt, from, to);
  sendExport(res, result);
}));

export default router;
