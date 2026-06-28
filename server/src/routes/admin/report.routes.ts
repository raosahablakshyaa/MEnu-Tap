import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { validateQuery } from '../../middlewares';
import { reportDateRangeSchema } from '../../validators/admin.validator';
import { adminReportService } from '../../services/admin/report.service';

const router = Router();

router.get('/restaurants', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const report = await adminReportService.restaurantReport();
  sendSuccess(res, 'Restaurant report generated', report);
}));

router.get('/revenue', validateQuery(reportDateRangeSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const report = await adminReportService.revenueReport(req.query.from as unknown as Date, req.query.to as unknown as Date);
    sendSuccess(res, 'Revenue report generated', report);
  })
);

router.get('/subscriptions', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const report = await adminReportService.subscriptionReport();
  sendSuccess(res, 'Subscription report generated', report);
}));

router.get('/customers', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const report = await adminReportService.customerReport();
  sendSuccess(res, 'Customer report generated', report);
}));

router.get('/payments', validateQuery(reportDateRangeSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const report = await adminReportService.paymentReport(req.query.from as unknown as Date, req.query.to as unknown as Date);
    sendSuccess(res, 'Payment report generated', report);
  })
);

router.get('/support', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const report = await adminReportService.supportReport();
  sendSuccess(res, 'Support report generated', report);
}));

router.get('/restaurants/csv', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const report = await adminReportService.restaurantReport();
  const csv = adminReportService.formatAsCsv(
    report.recent as Record<string, unknown>[],
    ['name', 'slug', 'status', 'isActive']
  );
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=restaurants.csv');
  res.send(csv);
}));

export default router;
