import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { tableService } from '../../services/table.service';

const router = Router();

router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await tableService.list(req.restaurantId!.toString());
  sendSuccess(res, 'Tables retrieved', result);
}));

router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const table = await tableService.create(
    req.restaurantId!.toString(), req.body, req.user!._id.toString()
  );
  sendCreated(res, 'Table created', table);
}));

router.post('/bulk', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await tableService.bulkCreate(
    req.restaurantId!.toString(), req.body, req.user!._id.toString()
  );
  sendCreated(res, 'Tables created', result);
}));

router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params['id'] as string;
  const table = await tableService.update(
    req.restaurantId!.toString(), id, req.body, req.user!._id.toString()
  );
  sendSuccess(res, 'Table updated', table);
}));

router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params['id'] as string;
  const result = await tableService.delete(req.restaurantId!.toString(), id);
  sendSuccess(res, 'Table deleted', result);
}));

export default router;
