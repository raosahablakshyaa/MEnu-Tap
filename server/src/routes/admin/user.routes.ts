import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { validateQuery, validateBody, validateParams } from '../../middlewares';
import { paginationSchema, createUserSchema, resetPasswordSchema, assignRoleSchema } from '../../validators/admin.validator';
import { adminUserService } from '../../services/admin/user.service';
import { z } from 'zod';

const router = Router();

router.get('/', validateQuery(paginationSchema.extend({
  roleSlug: z.string().optional(),
  restaurantId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
})),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const users = await adminUserService.list(req.query as never);
    sendSuccess(res, 'Users retrieved', users);
  })
);

router.get('/stats', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const stats = await adminUserService.getRoleStats();
  sendSuccess(res, 'User stats retrieved', stats);
}));

router.get('/export', validateQuery(paginationSchema.extend({ roleSlug: z.string().optional() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await adminUserService.exportUsers(req.query as never);
    sendSuccess(res, 'Users exported', data);
  })
);

router.post('/', validateBody(createUserSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await adminUserService.create(req.body, req);
    sendCreated(res, 'User created', user);
  })
);

router.get('/:id', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await adminUserService.getById(req.params.id as string);
    sendSuccess(res, 'User retrieved', user);
  })
);

router.patch('/:id', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await adminUserService.update(req.params.id as string, req.body, req);
    sendSuccess(res, 'User updated', user);
  })
);

router.post('/:id/suspend', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await adminUserService.suspend(req.params.id as string, req);
    sendSuccess(res, 'User suspended', user);
  })
);

router.post('/:id/activate', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await adminUserService.activate(req.params.id as string, req);
    sendSuccess(res, 'User activated', user);
  })
);

router.delete('/:id', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await adminUserService.delete(req.params.id as string, req);
    sendSuccess(res, result.message);
  })
);

router.post('/:id/reset-password', validateParams(z.object({ id: z.string() })), validateBody(resetPasswordSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await adminUserService.resetPassword(req.params.id as string, req.body.newPassword, req);
    sendSuccess(res, result.message);
  })
);

router.post('/:id/assign-role', validateParams(z.object({ id: z.string() })), validateBody(assignRoleSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await adminUserService.assignRole(req.params.id as string, req.body.roleSlug, req);
    sendSuccess(res, 'Role assigned', user);
  })
);

export default router;
