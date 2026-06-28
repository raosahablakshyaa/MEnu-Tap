import { MenuItem } from '../models/menuItem.model';
import { MenuCategory } from '../models/menuCategory.model';
import { Restaurant } from '../models/restaurant.model';
import { NotFoundError } from '../utils/errors';
import { Types } from 'mongoose';

export interface PublicMenuItem {
  _id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  video?: string;
  ingredients?: string;
  calories?: number;
  preparationTime?: number;
  foodType: string;
  spiceLevel?: string;
  price: number;
  discountPrice?: number;
  taxRate: number;
  variants: { name: string; price: number; discountPrice?: number; isAvailable: boolean }[];
  addons: { name: string; price: number; isAvailable: boolean }[];
  isBestSeller: boolean;
  isChefRecommended: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  isOutOfStock: boolean;
  servingSize?: string;
}

export interface PublicMenuCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sortOrder: number;
  items: PublicMenuItem[];
}

export class PublicMenuService {
  /** Get the full public-facing menu for a restaurant */
  async getMenu(
    restaurantId: string,
    filters: {
      search?: string;
      foodType?: string;
      categoryId?: string;
      isBestSeller?: boolean;
      isChefRecommended?: boolean;
      isFeatured?: boolean;
      sortBy?: string;
    } = {}
  ): Promise<{ categories: PublicMenuCategory[]; restaurant: Record<string, unknown> }> {
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      status: 'approved',
      isActive: true,
    }).select('name slug logo coverImage description operationalInfo branding contact businessDetails').lean();

    if (!restaurant) throw new NotFoundError('Restaurant not found');

    const categories = await MenuCategory.find({
      restaurantId,
      isActive: true,
      isDeleted: false,
    })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    const itemFilter: Record<string, unknown> = {
      restaurantId: new Types.ObjectId(restaurantId),
      isAvailable: true,
    };

    if (filters.search) {
      itemFilter['$or'] = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { ingredients: { $regex: filters.search, $options: 'i' } },
      ];
    }
    if (filters.foodType) itemFilter['foodType'] = filters.foodType;
    if (filters.categoryId) itemFilter['categoryId'] = new Types.ObjectId(filters.categoryId);
    if (filters.isBestSeller) itemFilter['isBestSeller'] = true;
    if (filters.isChefRecommended) itemFilter['isChefRecommended'] = true;
    if (filters.isFeatured) itemFilter['isFeatured'] = true;

    let sortOptions: Record<string, 1 | -1> = { sortOrder: 1, createdAt: -1 };
    if (filters.sortBy === 'price_asc') sortOptions = { price: 1 };
    else if (filters.sortBy === 'price_desc') sortOptions = { price: -1 };
    else if (filters.sortBy === 'popular') sortOptions = { popularityScore: -1 };
    else if (filters.sortBy === 'newest') sortOptions = { createdAt: -1 };

    const items = await MenuItem.find(itemFilter)
      .sort(sortOptions)
      .select(
        'categoryId name slug description images video ingredients calories preparationTime foodType spiceLevel price discountPrice taxRate variants addons isBestSeller isChefRecommended isFeatured isAvailable isOutOfStock servingSize sortOrder'
      )
      .lean();

    // Map items into categories
    const categoryMap = new Map<string, PublicMenuCategory>();
    for (const cat of categories) {
      categoryMap.set(cat._id.toString(), {
        _id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        sortOrder: cat.sortOrder,
        items: [],
      });
    }

    for (const item of items) {
      const catId = item.categoryId.toString();
      const cat = categoryMap.get(catId);
      if (cat) {
        cat.items.push({
          _id: item._id.toString(),
          categoryId: catId,
          name: item.name,
          slug: item.slug,
          description: item.description,
          images: item.images || [],
          video: item.video,
          ingredients: item.ingredients,
          calories: item.calories,
          preparationTime: item.preparationTime,
          foodType: item.foodType,
          spiceLevel: item.spiceLevel,
          price: item.price,
          discountPrice: item.discountPrice,
          taxRate: item.taxRate ?? 0,
          variants: item.variants || [],
          addons: item.addons || [],
          isBestSeller: item.isBestSeller,
          isChefRecommended: item.isChefRecommended,
          isFeatured: item.isFeatured,
          isAvailable: item.isAvailable,
          isOutOfStock: item.isOutOfStock,
          servingSize: item.servingSize,
        });
      }
    }

    // Only return categories that have items (unless no filter applied, show all)
    const hasFilter = Object.keys(filters).some(k => filters[k as keyof typeof filters]);
    const result = Array.from(categoryMap.values()).filter(
      cat => !hasFilter || cat.items.length > 0
    );

    return { categories: result, restaurant: restaurant as Record<string, unknown> };
  }

  /** Get a single menu item by ID */
  async getMenuItem(restaurantId: string, itemId: string): Promise<PublicMenuItem> {
    const item = await MenuItem.findOne({
      _id: itemId,
      restaurantId,
      isAvailable: true,
    })
      .populate('categoryId', 'name slug')
      .lean();

    if (!item) throw new NotFoundError('Menu item not found');

    return {
      _id: item._id.toString(),
      categoryId: item.categoryId.toString(),
      name: item.name,
      slug: item.slug,
      description: item.description,
      images: item.images || [],
      video: item.video,
      ingredients: item.ingredients,
      calories: item.calories,
      preparationTime: item.preparationTime,
      foodType: item.foodType,
      spiceLevel: item.spiceLevel,
      price: item.price,
      discountPrice: item.discountPrice,
      taxRate: item.taxRate ?? 0,
      variants: item.variants || [],
      addons: item.addons || [],
      isBestSeller: item.isBestSeller,
      isChefRecommended: item.isChefRecommended,
      isFeatured: item.isFeatured,
      isAvailable: item.isAvailable,
      isOutOfStock: item.isOutOfStock,
      servingSize: item.servingSize,
    };
  }

  /** AI-style upsell suggestions: best sellers + featured not already in cart */
  async getUpsellSuggestions(
    restaurantId: string,
    cartItemIds: string[]
  ): Promise<PublicMenuItem[]> {
    const exclude = cartItemIds.map(id => new Types.ObjectId(id));
    const suggestions = await MenuItem.find({
      restaurantId: new Types.ObjectId(restaurantId),
      isAvailable: true,
      isOutOfStock: false,
      _id: { $nin: exclude },
      $or: [{ isBestSeller: true }, { isChefRecommended: true }, { isFeatured: true }],
    })
      .sort({ popularityScore: -1, isBestSeller: -1 })
      .limit(6)
      .select('_id categoryId name images price discountPrice foodType isBestSeller isChefRecommended isFeatured preparationTime variants addons isAvailable isOutOfStock taxRate slug description spiceLevel')
      .lean();

    return suggestions.map(item => ({
      _id: item._id.toString(),
      categoryId: item.categoryId.toString(),
      name: item.name,
      slug: item.slug,
      description: item.description,
      images: item.images || [],
      foodType: item.foodType,
      spiceLevel: item.spiceLevel,
      price: item.price,
      discountPrice: item.discountPrice,
      taxRate: item.taxRate ?? 0,
      variants: item.variants || [],
      addons: item.addons || [],
      isBestSeller: item.isBestSeller,
      isChefRecommended: item.isChefRecommended,
      isFeatured: item.isFeatured,
      isAvailable: item.isAvailable,
      isOutOfStock: item.isOutOfStock,
      preparationTime: item.preparationTime,
    }));
  }
}

export const publicMenuService = new PublicMenuService();
