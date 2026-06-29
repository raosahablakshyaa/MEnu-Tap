/**
 * @openapi
 * tags:
 *   name: OwnerQR
 *   description: QR code management for restaurant owners
 */
import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { qrCodeService } from '../../services/qrCode.service';

const router = Router();

/**
 * @openapi
 * /owner/qr:
 *   get:
 *     tags: [OwnerQR]
 *     summary: List all QR codes for the restaurant
 *     security:
 *       - bearerAuth: []
 */
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const qrs = await qrCodeService.list(req.restaurantId!.toString());
  sendSuccess(res, 'QR codes retrieved', qrs);
}));

/**
 * @openapi
 * /owner/qr/analytics:
 *   get:
 *     tags: [OwnerQR]
 *     summary: Get QR scan analytics
 */
router.get('/analytics', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const analytics = await qrCodeService.getAnalytics(req.restaurantId!.toString());
  sendSuccess(res, 'QR analytics retrieved', analytics);
}));

/**
 * @openapi
 * /owner/qr/generate:
 *   post:
 *     tags: [OwnerQR]
 *     summary: Generate QR for a single table
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tableId]
 *             properties:
 *               tableId: { type: string }
 */
router.post('/generate', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const qr = await qrCodeService.generateForTable(
    req.restaurantId!.toString(),
    req.body.tableId as string,
    req.user!._id.toString()
  );
  sendCreated(res, 'QR code generated', qr);
}));

/**
 * @openapi
 * /owner/qr/generate-all:
 *   post:
 *     tags: [OwnerQR]
 *     summary: Bulk-generate QR codes for all active tables
 */
router.post('/generate-all', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await qrCodeService.generateAll(
    req.restaurantId!.toString(),
    req.user!._id.toString()
  );
  sendCreated(res, 'All QR codes generated', result);
}));

/**
 * @openapi
 * /owner/qr/{id}:
 *   get:
 *     tags: [OwnerQR]
 *     summary: Get a single QR code by ID
 */
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const qr = await qrCodeService.getById(req.restaurantId!.toString(), req.params['id'] as string);
  sendSuccess(res, 'QR code retrieved', qr);
}));

/**
 * @openapi
 * /owner/qr/{id}/regenerate:
 *   post:
 *     tags: [OwnerQR]
 *     summary: Regenerate (rotate token) for a QR code
 */
router.post('/:id/regenerate', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const qr = await qrCodeService.regenerate(
    req.restaurantId!.toString(),
    req.params['id'] as string,
    req.user!._id.toString()
  );
  sendSuccess(res, 'QR code regenerated', qr);
}));

/**
 * @openapi
 * /owner/qr/{id}/deactivate:
 *   put:
 *     tags: [OwnerQR]
 *     summary: Deactivate a QR code
 */
router.put('/:id/deactivate', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await qrCodeService.deactivate(
    req.restaurantId!.toString(),
    req.params['id'] as string
  );
  sendSuccess(res, 'QR code deactivated', result);
}));

/**
 * @openapi
 * /owner/qr/{id}/activate:
 *   put:
 *     tags: [OwnerQR]
 *     summary: Activate a deactivated QR code
 */
router.put('/:id/activate', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await qrCodeService.activate(
    req.restaurantId!.toString(),
    req.params['id'] as string
  );
  sendSuccess(res, 'QR code activated', result);
}));

/**
 * @openapi
 * /owner/qr/{id}/expiry:
 *   put:
 *     tags: [OwnerQR]
 *     summary: Set expiry date for a QR code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [expiresAt]
 *             properties:
 *               expiresAt: { type: string, format: date-time }
 */
router.put('/:id/expiry', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { expiresAt } = req.body as { expiresAt: string };
  if (!expiresAt) {
    res.status(400).json({ success: false, message: 'expiresAt is required', data: null, errors: null });
    return;
  }
  const result = await qrCodeService.setExpiry(
    req.restaurantId!.toString(),
    req.params['id'] as string,
    new Date(expiresAt)
  );
  sendSuccess(res, 'QR expiry set', result);
}));

/**
 * @openapi
 * /owner/qr/{id}:
 *   delete:
 *     tags: [OwnerQR]
 *     summary: Delete a QR code
 */
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await qrCodeService.delete(
    req.restaurantId!.toString(),
    req.params['id'] as string
  );
  sendSuccess(res, 'QR code deleted', result);
}));

export default router;
