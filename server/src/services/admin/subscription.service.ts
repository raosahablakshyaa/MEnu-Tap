import { Types } from 'mongoose';
import {
  SubscriptionPlan, Subscription, Invoice, Restaurant,
  ISubscriptionPlan,
} from '../../models';
import { auditLogService } from '../auditLog.service';
import { generateNumber, getPaginationParams, paginateResult, buildSearchFilter, QueryOptions } from '../../utils/pagination';
import { NotFoundError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../types';
import { slugify } from '../../helpers/tenant.helper';

const DURATION_DAYS: Record<string, number> = {
  monthly: 30,
  '3_months': 90,
  '6_months': 180,
  '12_months': 365,
};

export class AdminSubscriptionService {
  // Plans
  async listPlans(options: QueryOptions) {
    const { page, limit, skip, sort } = getPaginationParams(options);
    const filter: Record<string, unknown> = { isDeleted: false };
    Object.assign(filter, buildSearchFilter(options.search, ['name', 'slug']));

    const [items, total] = await Promise.all([
      SubscriptionPlan.find(filter).skip(skip).limit(limit).sort(sort).lean(),
      SubscriptionPlan.countDocuments(filter),
    ]);
    return paginateResult(items, total, page, limit);
  }

  async createPlan(data: Partial<ISubscriptionPlan>, req: AuthenticatedRequest) {
    const slug = data.slug || slugify(data.name!);
    const durationDays = data.durationDays || DURATION_DAYS[data.duration!] || 30;

    const plan = await SubscriptionPlan.create({
      ...data,
      slug,
      durationDays,
      createdBy: req.user!._id,
    });

    await auditLogService.logFromRequest(req, 'plan_created', 'subscription_plan', plan._id.toString());
    return plan;
  }

  async updatePlan(id: string, data: Partial<ISubscriptionPlan>, req: AuthenticatedRequest) {
    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      { ...data, updatedBy: req.user!._id },
      { new: true, runValidators: true }
    );
    if (!plan) throw new NotFoundError('Plan not found');
    await auditLogService.logFromRequest(req, 'plan_updated', 'subscription_plan', id);
    return plan;
  }

  async deletePlan(id: string, req: AuthenticatedRequest) {
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) throw new NotFoundError('Plan not found');
    plan.isDeleted = true;
    plan.deletedAt = new Date();
    plan.isActive = false;
    await plan.save();
    await auditLogService.logFromRequest(req, 'plan_deleted', 'subscription_plan', id);
    return { message: 'Plan deleted' };
  }

  async pausePlan(id: string, req: AuthenticatedRequest) {
    const plan = await SubscriptionPlan.findByIdAndUpdate(id, { isPaused: true, updatedBy: req.user!._id }, { new: true });
    if (!plan) throw new NotFoundError('Plan not found');
    await auditLogService.logFromRequest(req, 'plan_paused', 'subscription_plan', id);
    return plan;
  }

  async duplicatePlan(id: string, req: AuthenticatedRequest) {
    const original = await SubscriptionPlan.findById(id).lean();
    if (!original) throw new NotFoundError('Plan not found');

    const { _id, createdAt, updatedAt, slug, ...rest } = original;
    const newSlug = `${slug}-copy-${Date.now()}`;
    const plan = await SubscriptionPlan.create({
      ...rest,
      name: `${rest.name} (Copy)`,
      slug: newSlug,
      createdBy: req.user!._id,
    });

    await auditLogService.logFromRequest(req, 'plan_duplicated', 'subscription_plan', plan._id.toString());
    return plan;
  }

  // Subscriptions
  async listSubscriptions(options: QueryOptions & { status?: string; restaurantId?: string }) {
    const { page, limit, skip, sort } = getPaginationParams(options);
    const filter: Record<string, unknown> = { isDeleted: false };
    if (options.status) filter.status = options.status;
    if (options.restaurantId) filter.restaurantId = new Types.ObjectId(options.restaurantId);

    const [items, total] = await Promise.all([
      Subscription.find(filter)
        .populate('restaurantId', 'name slug')
        .populate('planId', 'name price duration')
        .skip(skip).limit(limit).sort(sort).lean(),
      Subscription.countDocuments(filter),
    ]);
    return paginateResult(items, total, page, limit);
  }

  async assignPlan(
    restaurantId: string,
    planId: string,
    req: AuthenticatedRequest,
    autoRenew = true
  ) {
    const [restaurant, plan] = await Promise.all([
      Restaurant.findById(restaurantId),
      SubscriptionPlan.findById(planId),
    ]);
    if (!restaurant) throw new NotFoundError('Restaurant not found');
    if (!plan || !plan.isActive) throw new NotFoundError('Plan not found or inactive');

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.create({
      restaurantId: new Types.ObjectId(restaurantId),
      planId: plan._id,
      status: 'active',
      startDate,
      endDate,
      autoRenew,
      amount: plan.price,
      currency: plan.currency,
      createdBy: req.user!._id,
    });

    restaurant.subscriptionId = subscription._id as Types.ObjectId;
    restaurant.status = 'approved';
    restaurant.isActive = true;
    await restaurant.save();

    await auditLogService.logFromRequest(req, 'subscription_assigned', 'subscription', subscription._id.toString());
    return subscription;
  }

  async renewSubscription(id: string, req: AuthenticatedRequest) {
    const sub = await Subscription.findById(id).populate('planId');
    if (!sub) throw new NotFoundError('Subscription not found');

    const plan = sub.planId as unknown as ISubscriptionPlan;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    sub.status = 'active';
    sub.startDate = startDate;
    sub.endDate = endDate;
    sub.updatedBy = req.user!._id;
    await sub.save();

    await auditLogService.logFromRequest(req, 'subscription_renewed', 'subscription', id);
    return sub;
  }

  async cancelSubscription(id: string, req: AuthenticatedRequest, reason?: string) {
    const sub = await Subscription.findById(id);
    if (!sub) throw new NotFoundError('Subscription not found');

    sub.status = 'cancelled';
    sub.cancelledAt = new Date();
    sub.cancelledBy = req.user!._id;
    sub.cancelReason = reason;
    await sub.save();

    await auditLogService.logFromRequest(req, 'subscription_cancelled', 'subscription', id, { reason });
    return sub;
  }

  async upgradeSubscription(id: string, newPlanId: string, req: AuthenticatedRequest) {
    const sub = await Subscription.findById(id);
    if (!sub) throw new NotFoundError('Subscription not found');

    const newPlan = await SubscriptionPlan.findById(newPlanId);
    if (!newPlan) throw new NotFoundError('New plan not found');

    sub.status = 'cancelled';
    sub.cancelledAt = new Date();
    sub.cancelledBy = req.user!._id;
    sub.cancelReason = 'Upgraded to new plan';
    await sub.save();

    return this.assignPlan(sub.restaurantId.toString(), newPlanId, req, sub.autoRenew);
  }

  async generateInvoice(subscriptionId: string, req: AuthenticatedRequest) {
    const sub = await Subscription.findById(subscriptionId).populate('planId').populate('restaurantId');
    if (!sub) throw new NotFoundError('Subscription not found');

    const plan = sub.planId as unknown as ISubscriptionPlan;
    const invoice = await Invoice.create({
      invoiceNumber: generateNumber('INV'),
      restaurantId: sub.restaurantId,
      subscriptionId: sub._id,
      planId: plan._id,
      status: 'issued',
      lineItems: [{ description: `${plan.name} subscription`, quantity: 1, unitPrice: plan.price, amount: plan.price }],
      subtotal: plan.price,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: plan.price,
      currency: plan.currency,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: req.user!._id,
    });

    await auditLogService.logFromRequest(req, 'invoice_generated', 'invoice', invoice._id.toString());
    return invoice;
  }
}

export const adminSubscriptionService = new AdminSubscriptionService();
