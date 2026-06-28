import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { menuCategoryService } from '../../services/menuCategory.service';
import { upload } from '../../middlewares';
import { uploadService } from '../../services/upload.service';

const router = Router();

router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const categories = await menuCategoryService.list(req.restaurantId!.toString());
  sendSuccess(res, 'Categories retrieved', categories);
}));

router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const category = await menuCategoryService.create(
    req.restaurantId!.toString(), req.body, req.user!._id.toString()
  );
  sendCreated(res, 'Category created', category);
}));

router.put('/reorder', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const categories = await menuCategoryService.reorder(
    req.restaurantId!.toString(), req.body.orders
  );
  sendSuccess(res, 'Categories reordered', categories);
}));

router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params['id'] as string;
  const category = await menuCategoryService.update(
    req.restaurantId!.toString(), id, req.body, req.user!._id.toString()
  );
  sendSuccess(res, 'Category updated', category);
}));

router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params['id'] as string;
  const result = await menuCategoryService.delete(req.restaurantId!.toString(), id);
  sendSuccess(res, 'Category deleted', result);
}));

router.post('/upload', upload.single('file'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ success: false, message: 'No file', data: null, errors: null }); return; }
  const result = await uploadService.uploadImage(req.file.buffer, `restaurants/${req.restaurantId}/categories`, `cat-${Date.now()}`);
  sendSuccess(res, 'Uploaded', result);
}));

export default router;
