import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../../middlewares';
import dashboardRoutes from './dashboard.routes';
import restaurantRoutes from './restaurant.routes';
import subscriptionRoutes from './subscription.routes';
import revenueRoutes from './revenue.routes';
import userRoutes from './user.routes';
import couponRoutes from './coupon.routes';
import notificationRoutes from './notification.routes';
import supportRoutes from './support.routes';
import auditRoutes from './audit.routes';
import reportRoutes from './report.routes';
import settingsRoutes from './settings.routes';

const router = Router();

router.use(authenticate);
router.use(requireSuperAdmin);

router.use('/dashboard', dashboardRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/revenue', revenueRoutes);
router.use('/users', userRoutes);
router.use('/coupons', couponRoutes);
router.use('/notifications', notificationRoutes);
router.use('/support', supportRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);

export default router;
