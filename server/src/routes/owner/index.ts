import { Router } from 'express';
import { authenticate, attachRestaurant, requireRestaurantOwner, requireApprovedRestaurant } from '../../middlewares';
import dashboardRoutes from './dashboard.routes';
import categoriesRoutes from './categories.routes';
import menuRoutes from './menu.routes';
import tablesRoutes from './tables.routes';
import qrRoutes from './qr.routes';
import staffRoutes from './staff.routes';
import analyticsRoutes from './analytics.routes';
// Phase 7
import inventoryRoutes from './inventory.routes';
import recipesRoutes from './recipes.routes';
import suppliersRoutes from './suppliers.routes';
import purchaseOrdersRoutes from './purchaseOrders.routes';
import expensesRoutes from './expenses.routes';
import branchesRoutes from './branches.routes';
import attendanceRoutes from './attendance.routes';
import posRoutes from './pos.routes';
import aiRoutes from './ai.routes';

const router = Router();

router.use(authenticate);
router.use(attachRestaurant);
router.use(requireRestaurantOwner);
router.use(requireApprovedRestaurant);

router.use('/dashboard', dashboardRoutes);
router.use('/categories', categoriesRoutes);
router.use('/menu', menuRoutes);
router.use('/tables', tablesRoutes);
router.use('/qr', qrRoutes);
router.use('/staff', staffRoutes);
router.use('/analytics', analyticsRoutes);
// Phase 7
router.use('/inventory', inventoryRoutes);
router.use('/recipes', recipesRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/purchase-orders', purchaseOrdersRoutes);
router.use('/expenses', expensesRoutes);
router.use('/branches', branchesRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/pos', posRoutes);
router.use('/ai', aiRoutes);

export default router;
