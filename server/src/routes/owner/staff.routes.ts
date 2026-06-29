import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { staffService } from '../../services/staff.service';

const router = Router();

router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const staff = await staffService.list(req.restaurantId!.toString());
  sendSuccess(res, 'Staff retrieved', staff);
}));

router.post('/invite', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await staffService.invite(
    req.restaurantId!.toString(), req.body as { email: string; roleSlug: string }, req.user!._id.toString()
  );
  sendCreated(res, 'Invitation sent', result);
}));

router.get('/invitations', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const invitations = await staffService.getInvitations(req.restaurantId!.toString());
  sendSuccess(res, 'Invitations retrieved', invitations);
}));

router.delete('/invitations/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params['id'] as string;
  const result = await staffService.cancelInvitation(req.restaurantId!.toString(), id);
  sendSuccess(res, 'Invitation cancelled', result);
}));

router.put('/:id/role', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params['id'] as string;
  const result = await staffService.updateRole(
    req.restaurantId!.toString(), id, req.body.roleSlug as string
  );
  sendSuccess(res, 'Role updated', result);
}));

router.put('/:id/suspend', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params['id'] as string;
  const result = await staffService.suspend(req.restaurantId!.toString(), id);
  sendSuccess(res, 'Staff suspended', result);
}));

router.put('/:id/activate', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params['id'] as string;
  const result = await staffService.activate(req.restaurantId!.toString(), id);
  sendSuccess(res, 'Staff activated', result);
}));

router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params['id'] as string;
  const result = await staffService.remove(req.restaurantId!.toString(), id);
  sendSuccess(res, 'Staff removed', result);
}));

export default router;
