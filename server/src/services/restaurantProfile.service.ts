import { Restaurant, RestaurantSettings } from '../models';
import { SubscriptionPlan, Subscription } from '../models';
import { NotFoundError } from '../utils/errors';
import { AuthenticatedRequest } from '../types';

export class RestaurantProfileService {
  async getProfile(userId: string) {
    const restaurant = await Restaurant.findOne({ ownerId: userId })
      .populate({ path: 'subscriptionId', populate: { path: 'planId' } });
    if (!restaurant) throw new NotFoundError('Restaurant not found');
    return restaurant;
  }

  async updateProfile(restaurantId: string, data: Record<string, unknown>, req: AuthenticatedRequest) {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) throw new NotFoundError('Restaurant not found');
    if (restaurant.ownerId.toString() !== req.user!._id.toString()) {
      throw new NotFoundError('Access denied');
    }

    const allowed = ['name', 'description', 'contact', 'address', 'businessDetails', 'operationalInfo', 'branding'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        (restaurant as unknown as Record<string, unknown>)[key] = data[key];
      }
    }
    restaurant.updatedBy = req.user!._id;
    await restaurant.save();
    return restaurant;
  }

  async getSettings(restaurantId: string) {
    const settings = await RestaurantSettings.findOne({ restaurantId });
    if (!settings) throw new NotFoundError('Settings not found');
    return settings;
  }

  async updateSettings(restaurantId: string, data: Record<string, unknown>, req: AuthenticatedRequest) {
    const settings = await RestaurantSettings.findOneAndUpdate(
      { restaurantId },
      { ...data, updatedBy: req.user!._id },
      { new: true, upsert: true, runValidators: true }
    );
    return settings;
  }

  async listPlans() {
    return SubscriptionPlan.find({ isActive: true, isPaused: false, isDeleted: false })
      .sort({ sortOrder: 1, price: 1 })
      .lean();
  }

  async getCurrentSubscription(restaurantId: string) {
    return Subscription.findOne({ restaurantId, status: 'active', isDeleted: false })
      .populate('planId')
      .lean();
  }

  async getSubscriptionHistory(restaurantId: string) {
    return Subscription.find({ restaurantId, isDeleted: false })
      .populate('planId', 'name price duration')
      .sort({ createdAt: -1 })
      .lean();
  }
}

export const restaurantProfileService = new RestaurantProfileService();
