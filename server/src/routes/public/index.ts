import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import menuRoutes from './menu.routes';
import cartRoutes from './cart.routes';
import orderRoutes from './order.routes';

const router = Router();

// Slightly relaxed rate-limit for public customer-facing endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests', data: null, errors: null },
});

router.use(publicLimiter);

router.use('/menu', menuRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);

export default router;
