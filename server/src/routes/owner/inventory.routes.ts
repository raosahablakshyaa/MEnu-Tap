import { Router } from 'express';
import {
  listIngredients, getIngredient, createIngredient, updateIngredient, deleteIngredient,
  adjustStock, getStockMovements, getLowStockAlerts, getInventoryValuation,
} from '../../controllers/inventory.controller';

const router = Router();

router.get('/', listIngredients);
router.get('/alerts/low-stock', getLowStockAlerts);
router.get('/valuation', getInventoryValuation);
router.get('/movements', getStockMovements);
router.get('/movements/:ingredientId', getStockMovements);
router.post('/', createIngredient);
router.get('/:id', getIngredient);
router.put('/:id', updateIngredient);
router.delete('/:id', deleteIngredient);
router.post('/:id/adjust', adjustStock);

export default router;
