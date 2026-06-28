import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { validateQuery, validateBody, validateParams } from '../../middlewares';
import { paginationSchema, createNotificationSchema } from '../../validators/admin.validator';
import { adminNotificationService } from '../../services/admin/notification.service';
import { z } from 'zod';

const router = Router();

router.get('/', validateQuery(paginationSchema.extend({ status: z.string().optional() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const notifications = await adminNotificationService.list(req.query as never);
    sendSuccess(res, 'Notifications retrieved', notifications);
  })
);

router.post('/', validateBody(createNotificationSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const notification = await adminNotificationService.create(req.body, req);
    sendCreated(res, 'Notification created', notification);
  })
);

router.post('/:id/send', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const notification = await adminNotificationService.send(req.params.id as string, req);
    sendSuccess(res, 'Notification sent', notification);
  })
);

router.post('/:id/cancel', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const notification = await adminNotificationService.cancel(req.params.id as string, req);
    sendSuccess(res, 'Notification cancelled', notification);
  })
);

export default router;
