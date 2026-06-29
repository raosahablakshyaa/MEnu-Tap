import { FilterQuery, UpdateQuery, Types } from 'mongoose';
import { Restaurant, IRestaurant } from '../models/restaurant.model';

export class RestaurantRepository {
  async create(data: Partial<IRestaurant>): Promise<IRestaurant> {
    return Restaurant.create(data);
  }

  async findById(id: string | Types.ObjectId): Promise<IRestaurant | null> {
    return Restaurant.findById(id).populate('ownerId', 'firstName lastName email');
  }

  async findBySlug(slug: string): Promise<IRestaurant | null> {
    return Restaurant.findOne({ slug: slug.toLowerCase() });
  }

  async updateById(
    id: string | Types.ObjectId,
    data: UpdateQuery<IRestaurant>
  ): Promise<IRestaurant | null> {
    return Restaurant.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async findAll(
    filter: FilterQuery<IRestaurant> = {},
    options: { page?: number; limit?: number } = {}
  ): Promise<{ restaurants: IRestaurant[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Restaurant.countDocuments(filter),
    ]);

    return { restaurants, total };
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const filter: FilterQuery<IRestaurant> = { slug: slug.toLowerCase() };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const count = await Restaurant.countDocuments(filter);
    return count > 0;
  }
}

export const restaurantRepository = new RestaurantRepository();
