/**
 * @openapi
 * tags:
 *   name: Cart
 *   description: Customer cart management
 */
import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { cartService } from '../../services/cart.service';

const router = Router();

/**
 * @openapi
 * /cart/{sessionId}:
 *   get:
 *     tags: [Cart]
 *     summary: Get current cart
 */
router.get('/:sessionId', asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.getCart(req.params['sessionId'] as string);
  sendSuccess(res, 'Cart retrieved', cart);
}));

/**
 * @openapi
 * /cart/{sessionId}/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [menuItemId, quantity]
 *             properties:
 *               menuItemId: { type: string }
 *               quantity: { type: integer, minimum: 1 }
 *               variantName: { type: string }
 *               addons:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     price: { type: number }
 *               notes: { type: string }
 */
router.post('/:sessionId/items', asyncHandler(async (req: Request, res: Response) => {
  const sessionId = req.params['sessionId'] as string;
  const { menuItemId, quantity, variantName, addons, notes } = req.body as {
    menuItemId: string;
    quantity: number;
    variantName?: string;
    addons?: { name: string; price: number }[];
    notes?: string;
  };

  if (!menuItemId || !quantity) {
    res.status(400).json({ success: false, message: 'menuItemId and quantity are required', data: null, errors: null });
    return;
  }

  const cart = await cartService.addItem(sessionId, { menuItemId, quantity, variantName, addons, notes });
  sendSuccess(res, 'Item added to cart', cart);
}));

/**
 * @openapi
 * /cart/{sessionId}/items/{cartItemId}:
 *   put:
 *     tags: [Cart]
 *     summary: Update cart item quantity or notes
 *   delete:
 *     tags: [Cart]
 *     summary: Remove item from cart
 */
router.put('/:sessionId/items/:cartItemId', asyncHandler(async (req: Request, res: Response) => {
  const sessionId = req.params['sessionId'] as string;
  const cartItemId = req.params['cartItemId'] as string;
  const { quantity, notes } = req.body as { quantity: number; notes?: string };

  if (quantity === undefined) {
    res.status(400).json({ success: false, message: 'quantity is required', data: null, errors: null });
    return;
  }

  const cart = await cartService.updateItem(sessionId, cartItemId, quantity, notes);
  sendSuccess(res, 'Cart updated', cart);
}));

router.delete('/:sessionId/items/:cartItemId', asyncHandler(async (req: Request, res: Response) => {
  const sessionId = req.params['sessionId'] as string;
  const cartItemId = req.params['cartItemId'] as string;
  const cart = await cartService.removeItem(sessionId, cartItemId);
  sendSuccess(res, 'Item removed', cart);
}));

/**
 * @openapi
 * /cart/{sessionId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear entire cart
 */
router.delete('/:sessionId', asyncHandler(async (req: Request, res: Response) => {
  const result = await cartService.clearCart(req.params['sessionId'] as string);
  sendSuccess(res, 'Cart cleared', result);
}));

export default router;
