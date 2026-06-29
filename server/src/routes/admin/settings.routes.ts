import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { validateBody } from '../../middlewares';
import { updateSettingsSchema } from '../../validators/admin.validator';
import { adminSettingsService } from '../../services/admin/settings.service';
import { z } from 'zod';

const router = Router();

router.get('/', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const settings = await adminSettingsService.get();
  sendSuccess(res, 'Settings retrieved', settings);
}));

router.patch('/', validateBody(updateSettingsSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const settings = await adminSettingsService.update(req.body, req);
    sendSuccess(res, 'Settings updated', settings);
  })
);

router.post('/maintenance', validateBody(z.object({
  enabled: z.boolean(),
  message: z.string().optional(),
})),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const settings = await adminSettingsService.toggleMaintenance(req.body.enabled, req.body.message, req);
    sendSuccess(res, 'Maintenance mode updated', settings);
  })
);

router.post('/feature-flags', validateBody(z.object({
  flag: z.string(),
  enabled: z.boolean(),
})),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const settings = await adminSettingsService.updateFeatureFlag(req.body.flag, req.body.enabled, req);
    sendSuccess(res, 'Feature flag updated', settings);
  })
);

export default router;
