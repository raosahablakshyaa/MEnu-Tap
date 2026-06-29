import { Router } from 'express';
import {
  listRecipes, getRecipeByMenuItem, upsertRecipe, deleteRecipe, getProfitAnalysis,
} from '../../controllers/recipe.controller';

const router = Router();

router.get('/', listRecipes);
router.get('/profit-analysis', getProfitAnalysis);
router.get('/:menuItemId', getRecipeByMenuItem);
router.put('/:menuItemId', upsertRecipe);
router.delete('/:menuItemId', deleteRecipe);

export default router;
