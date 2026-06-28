import { Recipe } from '../models/recipe.model';
import { Ingredient } from '../models/ingredient.model';
import { NotFoundError } from '../utils/errors';

export class RecipeService {
  async list(restaurantId: string) {
    return Recipe.find({ restaurantId, isActive: true })
      .populate('menuItemId', 'name price')
      .lean();
  }

  async getByMenuItem(restaurantId: string, menuItemId: string) {
    const recipe = await Recipe.findOne({ restaurantId, menuItemId, isActive: true })
      .populate('ingredients.ingredientId', 'name unit currentStock unitCost')
      .lean();
    if (!recipe) throw new NotFoundError('Recipe not found');
    return recipe;
  }

  async upsert(restaurantId: string, menuItemId: string, data: Record<string, unknown>, userId: string) {
    // Calculate preparation cost from ingredients
    const ingredients = (data['ingredients'] as Array<Record<string, unknown>>) ?? [];
    let preparationCost = 0;
    for (const ri of ingredients) {
      const ing = await Ingredient.findById(ri['ingredientId']).lean();
      if (ing) {
        const qty = (ri['grossQuantity'] as number) ?? (ri['quantity'] as number) ?? 0;
        preparationCost += qty * ing.averageCost;
      }
    }

    const recipe = await Recipe.findOneAndUpdate(
      { restaurantId, menuItemId },
      {
        $set: {
          ...data,
          restaurantId,
          menuItemId,
          preparationCost: parseFloat(preparationCost.toFixed(2)),
          isActive: true,
          createdBy: userId,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
    return recipe;
  }

  async delete(restaurantId: string, menuItemId: string) {
    await Recipe.findOneAndUpdate({ restaurantId, menuItemId }, { $set: { isActive: false } });
    return { deleted: true };
  }

  async getProfitAnalysis(restaurantId: string) {
    const { MenuItem } = await import('../models/menuItem.model');
    const recipes = await Recipe.find({ restaurantId, isActive: true }).lean();
    const menuItemIds = recipes.map(r => r.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds }, restaurantId }).lean();
    const itemMap = new Map(menuItems.map(m => [m._id.toString(), m]));

    return recipes.map(recipe => {
      const menuItem = itemMap.get(recipe.menuItemId.toString());
      const sellingPrice = menuItem?.price ?? 0;
      const cost = recipe.preparationCost;
      const grossProfit = sellingPrice - cost;
      const marginPercent = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
      return {
        menuItemId: recipe.menuItemId,
        menuItemName: recipe.menuItemName,
        sellingPrice,
        preparationCost: cost,
        grossProfit: parseFloat(grossProfit.toFixed(2)),
        marginPercent: parseFloat(marginPercent.toFixed(2)),
        ingredients: recipe.ingredients.length,
      };
    }).sort((a, b) => b.marginPercent - a.marginPercent);
  }
}

export const recipeService = new RecipeService();
