import { Types } from 'mongoose';
import {
  Restaurant, RestaurantSettings, Subscription, SubscriptionPlan,
  Invoice, MenuCategory, Role, PaymentTransaction,
} from '../models';
import { roleRepository } from '../repositories/role.repository';
import { generateNumber } from '../utils/pagination';
import { slugify } from '../helpers/tenant.helper';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service';

const DEFAULT_CATEGORIES = [
  { name: 'Starters', sortOrder: 1 },
  { name: 'Main Course', sortOrder: 2 },
  { name: 'Beverages', sortOrder: 3 },
  { name: 'Desserts', sortOrder: 4 },
];

export class TenantProvisioningService {
  async provisionAfterPayment(
    restaurantId: string,
    planId: string,
    paymentTransactionId: string,
    userId?: string
  ) {
    const [restaurant, plan] = await Promise.all([
      Restaurant.findById(restaurantId),
      SubscriptionPlan.findById(planId),
    ]);

    if (!restaurant || !plan) {
      throw new Error('Restaurant or plan not found for provisioning');
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.create({
      restaurantId: restaurant._id,
      planId: plan._id,
      status: 'active',
      startDate,
      endDate,
      autoRenew: true,
      amount: plan.price,
      currency: plan.currency,
      createdBy: userId ? new Types.ObjectId(userId) : restaurant.ownerId,
    });

    const invoice = await Invoice.create({
      invoiceNumber: generateNumber('INV'),
      restaurantId: restaurant._id,
      subscriptionId: subscription._id,
      planId: plan._id,
      status: 'paid',
      lineItems: [{
        description: `${plan.name} subscription`,
        quantity: 1,
        unitPrice: plan.price,
        amount: plan.price,
      }],
      subtotal: plan.price,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: plan.price,
      currency: plan.currency,
      dueDate: new Date(),
      paidAt: new Date(),
      createdBy: userId ? new Types.ObjectId(userId) : restaurant.ownerId,
    });

    await PaymentTransaction.findByIdAndUpdate(paymentTransactionId, {
      subscriptionId: subscription._id,
      invoiceId: invoice._id,
    });

    restaurant.subscriptionId = subscription._id as Types.ObjectId;
    restaurant.onboardingStep = 7;
    restaurant.onboardingCompleted = true;
    restaurant.onboardingChecklist.completeProfile = true;
    restaurant.status = 'pending_approval';
    await restaurant.save();

    await this.ensureRestaurantSettings(restaurant._id, restaurant.ownerId, restaurant.branding);
    await this.seedDefaultCategories(restaurant._id, restaurant.ownerId);
    await this.ensureTenantRoles(restaurant._id);

    await notificationService.sendPaymentSuccess(restaurant, plan, invoice);
    await notificationService.notifyAdminNewRestaurant(restaurant);

    logger.info(`Tenant provisioned for restaurant ${restaurantId}`);

    return { subscription, invoice, restaurant };
  }

  async ensureRestaurantSettings(
    restaurantId: Types.ObjectId,
    ownerId: Types.ObjectId,
    branding?: { themeColor?: string; accentColor?: string }
  ) {
    const existing = await RestaurantSettings.findOne({ restaurantId });
    if (existing) return existing;

    return RestaurantSettings.create({
      restaurantId,
      themeColor: branding?.themeColor || '#f97316',
      accentColor: branding?.accentColor || '#ea580c',
      createdBy: ownerId,
    });
  }

  async seedDefaultCategories(restaurantId: Types.ObjectId, ownerId: Types.ObjectId) {
    const existing = await MenuCategory.countDocuments({ restaurantId });
    if (existing > 0) return;

    await MenuCategory.insertMany(
      DEFAULT_CATEGORIES.map((cat) => ({
        restaurantId,
        name: cat.name,
        slug: slugify(cat.name),
        sortOrder: cat.sortOrder,
        isActive: true,
        createdBy: ownerId,
      }))
    );
  }

  async ensureTenantRoles(restaurantId: Types.ObjectId) {
    const systemRoles = await roleRepository.findAll({ isSystem: true, restaurantId: null });
    const tenantRoleSlugs = ['restaurant_manager', 'kitchen_staff', 'waiter', 'cashier'];

    for (const slug of tenantRoleSlugs) {
      const systemRole = systemRoles.find((r) => r.slug === slug);
      if (!systemRole) continue;

      const exists = await Role.findOne({ slug, restaurantId });
      if (!exists) {
        await Role.create({
          name: systemRole.name,
          slug: systemRole.slug,
          description: `Tenant role: ${systemRole.name}`,
          permissions: systemRole.permissions,
          restaurantId,
          isSystem: false,
          isActive: true,
        });
      }
    }
  }
}

export const tenantProvisioningService = new TenantProvisioningService();
