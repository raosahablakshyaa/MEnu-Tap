import { MenuItem } from '../models/menuItem.model';
import { MenuCategory } from '../models/menuCategory.model';
import { NotFoundError } from '../utils/errors';
import { Types } from 'mongoose';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export class MenuItemService {
  async list(restaurantId: string, query: Record<string, unknown> = {}) {
    const filter: Record<string, unknown> = { restaurantId };
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.isAvailable !== undefined) filter.isAvailable = query.isAvailable === 'true';
    if (query.foodType) filter.foodType = query.foodType;
    if (query.search) filter.name = { $regex: query.search, $options: 'i' };
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      MenuItem.find(filter)
        .populate('categoryId', 'name slug')
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MenuItem.countDocuments(filter),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getById(restaurantId: string, itemId: string) {
    const item = await MenuItem.findOne({ _id: itemId, restaurantId }).populate('categoryId', 'name slug');
    if (!item) throw new NotFoundError('Menu item not found');
    return item;
  }

  async create(restaurantId: string, data: Record<string, unknown>, userId: string) {
    const category = await MenuCategory.findOne({ _id: data.categoryId as string, restaurantId });
    if (!category) throw new NotFoundError('Category not found');
    const baseSlug = slugify(data.name as string);
    const slug = `${baseSlug}-${Date.now()}`;
    const item = await MenuItem.create({
      restaurantId,
      categoryId: data.categoryId,
      name: data.name,
      slug,
      description: data.description,
      images: data.images || [],
      video: data.video,
      ingredients: data.ingredients,
      calories: data.calories,
      preparationTime: data.preparationTime,
      cookingInstructions: data.cookingInstructions,
      foodType: data.foodType || 'veg',
      spiceLevel: data.spiceLevel,
      price: data.price,
      discountPrice: data.discountPrice,
      taxRate: data.taxRate || 0,
      sku: data.sku,
      barcode: data.barcode,
      servingSize: data.servingSize,
      variants: data.variants || [],
      addons: data.addons || [],
      availability: data.availability || {},
      isBestSeller: data.isBestSeller || false,
      isChefRecommended: data.isChefRecommended || false,
      isFeatured: data.isFeatured || false,
      isSeasonal: data.isSeasonal || false,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      isOutOfStock: data.isOutOfStock || false,
      sortOrder: data.sortOrder || 0,
      createdBy: userId,
    });
    return item;
  }

  async update(restaurantId: string, itemId: string, data: Record<string, unknown>, userId: string) {
    const item = await MenuItem.findOne({ _id: itemId, restaurantId });
    if (!item) throw new NotFoundError('Menu item not found');
    const allowed = [
      'name', 'description', 'images', 'video', 'ingredients', 'calories',
      'preparationTime', 'cookingInstructions', 'foodType', 'spiceLevel', 'price',
      'discountPrice', 'taxRate', 'sku', 'barcode', 'servingSize', 'variants',
      'addons', 'availability', 'isBestSeller', 'isChefRecommended', 'isFeatured',
      'isSeasonal', 'isAvailable', 'isOutOfStock', 'sortOrder', 'categoryId',
    ];
    for (const key of allowed) {
      if (data[key] !== undefined) (item as unknown as Record<string, unknown>)[key] = data[key];
    }
    item.updatedBy = userId as unknown as typeof item.updatedBy;
    await item.save();
    return item;
  }

  async delete(restaurantId: string, itemId: string) {
    const item = await MenuItem.findOne({ _id: itemId, restaurantId });
    if (!item) throw new NotFoundError('Menu item not found');
    item.isDeleted = true;
    item.deletedAt = new Date();
    await item.save();
    return { deleted: true };
  }

  async duplicate(restaurantId: string, itemId: string, userId: string) {
    const item = await MenuItem.findOne({ _id: itemId, restaurantId }).lean();
    if (!item) throw new NotFoundError('Menu item not found');
    const slug = `${item.slug}-copy-${Date.now()}`;
    const { _id, createdAt, updatedAt, ...rest } = item as Record<string, unknown>;
    const newItem = await MenuItem.create({
      ...rest,
      _id: new Types.ObjectId(),
      slug,
      name: `${item.name} (Copy)`,
      createdBy: userId,
    });
    return newItem;
  }
}

export const menuItemService = new MenuItemService();
