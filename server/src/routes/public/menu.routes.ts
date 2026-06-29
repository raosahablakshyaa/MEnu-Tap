/**
 * @openapi
 * tags:
 *   name: PublicMenu
 *   description: Customer-facing menu endpoints (no authentication required)
 */
import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { customerSessionService } from '../../services/customerSession.service';
import { publicMenuService } from '../../services/publicMenu.service';

const router = Router();

/**
 * @openapi
 * /menu/{token}:
 *   get:
 *     tags: [PublicMenu]
 *     summary: Validate QR token and return restaurant + table info
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Restaurant and table details
 *       400:
 *         description: Invalid or expired QR
 *       404:
 *         description: Not found
 */
router.get('/:token', asyncHandler(async (req: Request, res: Response) => {
  const token = req.params['token'] as string;
  const userAgent = req.headers['user-agent'] ?? '';
  const ipAddress = req.ip ?? '';

  const result = await customerSessionService.validateQrToken(token, userAgent, ipAddress);
  sendSuccess(res, 'QR validated', result);
}));

/**
 * @openapi
 * /menu/{token}/session:
 *   post:
 *     tags: [PublicMenu]
 *     summary: Create a customer session after QR scan
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session created
 */
router.post('/:token/session', asyncHandler(async (req: Request, res: Response) => {
  const token = req.params['token'] as string;
  const userAgent = req.headers['user-agent'] ?? '';
  const ipAddress = req.ip ?? '';
  const language = (req.headers['accept-language'] ?? 'en').split(',')[0];

  const session = await customerSessionService.createSession(token, userAgent, ipAddress, language);
  sendSuccess(res, 'Session created', session);
}));

/**
 * @openapi
 * /menu/{token}/menu:
 *   get:
 *     tags: [PublicMenu]
 *     summary: Get the full public menu for a restaurant (via QR token)
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: foodType
 *         schema: { type: string, enum: [veg, non_veg, vegan, jain, egg] }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [popular, price_asc, price_desc, newest] }
 *     responses:
 *       200:
 *         description: Full menu with categories and items
 */
router.get('/:token/menu', asyncHandler(async (req: Request, res: Response) => {
  const token = req.params['token'] as string;

  // Get restaurant ID from the QR token (re-validate lightly)
  const { QrCode } = await import('../../models/qrCode.model');
  const qr = await QrCode.findOne({ token, isActive: true, isDeleted: false }).lean();
  if (!qr) {
    res.status(404).json({ success: false, message: 'QR code not found', data: null, errors: null });
    return;
  }

  const { search, foodType, categoryId, sortBy, isBestSeller, isChefRecommended, isFeatured } = req.query;

  const result = await publicMenuService.getMenu(qr.restaurantId.toString(), {
    search: search as string,
    foodType: foodType as string,
    categoryId: categoryId as string,
    sortBy: sortBy as string,
    isBestSeller: isBestSeller === 'true',
    isChefRecommended: isChefRecommended === 'true',
    isFeatured: isFeatured === 'true',
  });

  sendSuccess(res, 'Menu retrieved', result);
}));

/**
 * @openapi
 * /menu/{token}/item/{itemId}:
 *   get:
 *     tags: [PublicMenu]
 *     summary: Get single menu item details
 */
router.get('/:token/item/:itemId', asyncHandler(async (req: Request, res: Response) => {
  const token = req.params['token'] as string;
  const itemId = req.params['itemId'] as string;

  const { QrCode } = await import('../../models/qrCode.model');
  const qr = await QrCode.findOne({ token, isActive: true, isDeleted: false }).lean();
  if (!qr) {
    res.status(404).json({ success: false, message: 'QR code not found', data: null, errors: null });
    return;
  }

  const item = await publicMenuService.getMenuItem(qr.restaurantId.toString(), itemId);
  sendSuccess(res, 'Item retrieved', item);
}));

/**
 * @openapi
 * /menu/{token}/upsell:
 *   post:
 *     tags: [PublicMenu]
 *     summary: Get AI upsell suggestions based on current cart
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cartItemIds:
 *                 type: array
 *                 items: { type: string }
 */
router.post('/:token/upsell', asyncHandler(async (req: Request, res: Response) => {
  const token = req.params['token'] as string;
  const cartItemIds: string[] = req.body.cartItemIds ?? [];

  const { QrCode } = await import('../../models/qrCode.model');
  const qr = await QrCode.findOne({ token, isActive: true, isDeleted: false }).lean();
  if (!qr) {
    res.status(404).json({ success: false, message: 'QR code not found', data: null, errors: null });
    return;
  }

  const suggestions = await publicMenuService.getUpsellSuggestions(qr.restaurantId.toString(), cartItemIds);
  sendSuccess(res, 'Suggestions retrieved', suggestions);
}));

export default router;
