import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { menuItemService } from '../../services/menuItem.service';
import { upload } from '../../middlewares';
import { uploadService } from '../../services/upload.service';

const router = Router();

router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await menuItemService.list(req.restaurantId!.toString(), req.query as Record<string, unknown>);
  sendSuccess(res, 'Menu items retrieved', result);
}));

router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const item = await menuItemService.create(
    req.restaurantId!.toString(), req.body, req.user!._id.toString()
  );
  sendCreated(res, 'Menu item created', item);
}));

router.post('/upload', upload.single('file'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ success: false, message: 'No file', data: null, errors: null }); return; }
  const result = await uploadService.uploadImage(req.file.buffer, `restaurants/${req.restaurantId}/menu`, `item-${Date.now()}`);
  sendSuccess(res, 'Uploaded', result);
}));

router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params['id'] as string;
  const item = await menuItemService.getById(req.restaurantId!.toString(), id);
  sendSuccess(res, 'Menu item retrieved', item);
}));

router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params['id'] as string;
  const item = await menuItemService.update(
    req.restaurantId!.toString(), id, req.body, req.user!._id.toString()
  );
  sendSuccess(res, 'Menu item updated', item);
}));

router.post('/:id/duplicate', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params['id'] as string;
  const item = await menuItemService.duplicate(
    req.restaurantId!.toString(), id, req.user!._id.toString()
  );
  sendCreated(res, 'Menu item duplicated', item);
}));

router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params['id'] as string;
  const result = await menuItemService.delete(req.restaurantId!.toString(), id);
  sendSuccess(res, 'Menu item deleted', result);
}));

export default router;
