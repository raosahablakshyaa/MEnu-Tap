import { MenuCategory } from '../models/menuCategory.model';
import { MenuItem } from '../models/menuItem.model';
import { NotFoundError, BadRequestError } from '../utils/errors';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export class MenuCategoryService {
  async list(restaurantId: string) {
    return MenuCategory.find({ restaurantId }).sort({ sortOrder: 1, createdAt: 1 }).lean();
  }

  async create(restaurantId: string, data: Record<string, unknown>, userId: string) {
    const slug = slugify((data.name as string) + '-' + Date.now());
    const maxOrder = await MenuCategory.findOne({ restaurantId }).sort({ sortOrder: -1 }).lean();
    const sortOrder = maxOrder ? (maxOrder.sortOrder + 1) : 0;
    const category = await MenuCategory.create({
      restaurantId,
      name: data.name,
      slug,
      description: data.description,
      image: data.image,
      sortOrder: data.sortOrder ?? sortOrder,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdBy: userId,
    });
    return category;
  }

  async update(restaurantId: string, categoryId: string, data: Record<string, unknown>, userId: string) {
    const category = await MenuCategory.findOne({ _id: categoryId, restaurantId });
    if (!category) throw new NotFoundError('Category not found');
    const allowed = ['name', 'description', 'image', 'sortOrder', 'isActive'];
    for (const key of allowed) {
      if (data[key] !== undefined) (category as unknown as Record<string, unknown>)[key] = data[key];
    }
    category.updatedBy = userId as unknown as typeof category.updatedBy;
    await category.save();
    return category;
  }

  async delete(restaurantId: string, categoryId: string) {
    const category = await MenuCategory.findOne({ _id: categoryId, restaurantId });
    if (!category) throw new NotFoundError('Category not found');
    const itemCount = await MenuItem.countDocuments({ categoryId, restaurantId });
    if (itemCount > 0) throw new BadRequestError(`Cannot delete: ${itemCount} items in this category`);
    category.isDeleted = true;
    category.deletedAt = new Date();
    await category.save();
    return { deleted: true };
  }

  async reorder(restaurantId: string, orders: { id: string; sortOrder: number }[]) {
    await Promise.all(
      orders.map(({ id, sortOrder }) =>
        MenuCategory.findOneAndUpdate({ _id: id, restaurantId }, { sortOrder })
      )
    );
    return this.list(restaurantId);
  }
}

export const menuCategoryService = new MenuCategoryService();
