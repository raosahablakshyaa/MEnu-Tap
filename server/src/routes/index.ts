import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import rbacRoutes from './rbac.routes';
import adminRoutes from './admin';
import restaurantRoutes from './restaurant.routes';
import subscriptionRoutes, { paymentRouter } from './subscription.routes';
import ownerRoutes from './owner';
import publicRoutes from './public';
import kitchenRoutes from './kitchen';
import exportRoutes from './owner/export.routes';
import { getHealthStatus } from '../services/health.service';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// ── Health (deep) ────────────────────────────────────────────────────────────
router.get('/health', asyncHandler(async (_req: Request, res: Response) => {
  const health = await getHealthStatus();
  const status = health.status === 'unhealthy' ? 503 : 200;
  res.status(status).json({ success: health.status !== 'unhealthy', message: 'TapMenu API health check', data: health, errors: null });
}));

// Simple liveness probe (no DB calls) for load balancers
router.get('/ping', (_req: Request, res: Response) => {
  res.json({ pong: true, ts: Date.now() });
});

// ── Authenticated staff/owner routes ────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/rbac', rbacRoutes);
router.use('/admin', adminRoutes);
router.use('/restaurant', restaurantRoutes);
router.use('/plans', subscriptionRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/payments', paymentRouter);
router.use('/owner', ownerRoutes);
router.use('/owner', exportRoutes);
router.use('/kitchen', kitchenRoutes);

// ── Public customer-facing routes (no auth) ──────────────────────────────────
router.use('/', publicRoutes);

export default router;
