import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { validateQuery } from '../../middlewares';
import { paginationSchema } from '../../validators/admin.validator';
import { adminAuditService } from '../../services/admin/audit.service';
import { z } from 'zod';

const router = Router();

router.get('/', validateQuery(paginationSchema.extend({
  action: z.string().optional(),
  resource: z.string().optional(),
  userId: z.string().optional(),
  status: z.string().optional(),
})),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const logs = await adminAuditService.list(req.query as never);
    sendSuccess(res, 'Audit logs retrieved', logs);
  })
);

router.get('/login-history', validateQuery(paginationSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const logs = await adminAuditService.getLoginHistory(req.query as never);
    sendSuccess(res, 'Login history retrieved', logs);
  })
);

router.get('/failed-logins', validateQuery(paginationSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const logs = await adminAuditService.getFailedLogins(req.query as never);
    sendSuccess(res, 'Failed logins retrieved', logs);
  })
);

export default router;
