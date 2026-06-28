import { Types, FilterQuery } from 'mongoose';
import { Restaurant, Order, User, IRestaurant } from '../../models';
import { restaurantRepository } from '../../repositories/restaurant.repository';
import { userRepository } from '../../repositories/user.repository';
import { auditLogService } from '../auditLog.service';
import { signAccessToken, generateTokenId } from '../../utils/jwt.utils';
import { getAccessTokenExpirySeconds } from '../../utils/jwt.utils';
import { buildSearchFilter, getPaginationParams, paginateResult, QueryOptions } from '../../utils/pagination';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../types';
import { ROLE_SLUGS } from '../../constants';
import { notificationService } from '../notification.service';

function pushApprovalHistory(
  restaurant: IRestaurant,
  action: 'approved' | 'rejected' | 'suspended' | 'activated' | 'info_requested',
  performedBy: Types.ObjectId,
  reason?: string,
  notes?: string
) {
  restaurant.approvalHistory.push({
    action,
    reason,
    notes,
    performedBy,
    performedAt: new Date(),
  });
}

export class AdminRestaurantService {
  async list(options: QueryOptions & { status?: string; city?: string; state?: string }) {
    const { page, limit, skip, sort } = getPaginationParams(options);
    const filter: FilterQuery<IRestaurant> = { isDeleted: false };

    if (options.status) filter.status = options.status;
    if (options.city) filter['address.city'] = new RegExp(options.city, 'i');
    if (options.state) filter['address.state'] = new RegExp(options.state, 'i');

    const searchFilter = buildSearchFilter(options.search, ['name', 'slug', 'contact.email']);
    Object.assign(filter, searchFilter);

    const [items, total] = await Promise.all([
      Restaurant.find(filter)
        .populate('ownerId', 'firstName lastName email phone')
        .populate({ path: 'subscriptionId', populate: { path: 'planId', select: 'name price duration' } })
        .skip(skip).limit(limit).sort(sort).lean(),
      Restaurant.countDocuments(filter),
    ]);

    return paginateResult(items, total, page, limit);
  }

  async getById(id: string) {
    const restaurant = await Restaurant.findById(id)
      .populate('ownerId', 'firstName lastName email phone avatar')
      .populate({ path: 'subscriptionId', populate: { path: 'planId' } })
      .populate('approvedBy', 'firstName lastName')
      .populate('suspendedBy', 'firstName lastName');
    if (!restaurant) throw new NotFoundError('Restaurant not found');
    return restaurant;
  }

  async approve(id: string, req: AuthenticatedRequest, notes?: string) {
    const restaurant = await this.getById(id);
    if (restaurant.status === 'approved') throw new BadRequestError('Restaurant already approved');

    restaurant.status = 'approved';
    restaurant.isActive = true;
    restaurant.isVerified = true;
    restaurant.approvedAt = new Date();
    restaurant.approvedBy = req.user!._id;
    if (notes) restaurant.statusReason = notes;
    pushApprovalHistory(restaurant, 'approved', req.user!._id, undefined, notes);
    await restaurant.save();

    await notificationService.sendApprovalNotification(restaurant, 'approved');
    await auditLogService.logFromRequest(req, 'restaurant_approved', 'restaurant', id);
    return restaurant;
  }

  async reject(id: string, req: AuthenticatedRequest, reason: string) {
    const restaurant = await this.getById(id);
    restaurant.status = 'rejected';
    restaurant.isActive = false;
    restaurant.rejectedAt = new Date();
    restaurant.rejectedBy = req.user!._id;
    restaurant.statusReason = reason;
    pushApprovalHistory(restaurant, 'rejected', req.user!._id, reason);
    await restaurant.save();

    await notificationService.sendApprovalNotification(restaurant, 'rejected', reason);
    await auditLogService.logFromRequest(req, 'restaurant_rejected', 'restaurant', id, { reason });
    return restaurant;
  }

  async suspend(id: string, req: AuthenticatedRequest, reason: string) {
    const restaurant = await this.getById(id);
    restaurant.status = 'suspended';
    restaurant.isActive = false;
    restaurant.suspendedAt = new Date();
    restaurant.suspendedBy = req.user!._id;
    restaurant.statusReason = reason;
    pushApprovalHistory(restaurant, 'suspended', req.user!._id, reason);
    await restaurant.save();
    return restaurant;
  }

  async activate(id: string, req: AuthenticatedRequest) {
    const restaurant = await this.getById(id);
    restaurant.status = 'approved';
    restaurant.isActive = true;
    restaurant.suspendedAt = undefined;
    restaurant.suspendedBy = undefined;
    pushApprovalHistory(restaurant, 'activated', req.user!._id);
    await restaurant.save();
    return restaurant;
  }

  async softDelete(id: string, req: AuthenticatedRequest) {
    await this.getById(id);
    await Restaurant.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      isActive: false,
      updatedBy: req.user!._id,
    });
    await auditLogService.logFromRequest(req, 'restaurant_deleted', 'restaurant', id);
    return { message: 'Restaurant deleted' };
  }

  async restore(id: string, req: AuthenticatedRequest) {
    const restaurant = await Restaurant.findOne({ _id: id, isDeleted: true });
    if (!restaurant) throw new NotFoundError('Deleted restaurant not found');

    restaurant.isDeleted = false;
    restaurant.deletedAt = undefined;
    restaurant.isActive = true;
    restaurant.status = 'pending';
    await restaurant.save();

    await auditLogService.logFromRequest(req, 'restaurant_restored', 'restaurant', id);
    return restaurant;
  }

  async getAnalytics(id: string) {
    const restaurant = await this.getById(id);
    const rid = new Types.ObjectId(id);

    const [orderStats, revenueStats, staffCount, customerCount] = await Promise.all([
      Order.aggregate([
        { $match: { restaurantId: rid, isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { restaurantId: rid, isDeleted: false } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      User.countDocuments({ restaurantId: rid, isDeleted: false }),
      User.aggregate([
        { $lookup: { from: 'roles', localField: 'roleId', foreignField: '_id', as: 'role' } },
        { $unwind: '$role' },
        { $match: { restaurantId: rid, isDeleted: false, 'role.slug': ROLE_SLUGS.CUSTOMER } },
        { $count: 'total' },
      ]).then((r) => r[0]?.total || 0),
    ]);

    return { restaurant, orderStats, revenueStats, staffCount, customerCount };
  }

  async getOrders(id: string, options: QueryOptions) {
    const { page, limit, skip, sort } = getPaginationParams(options);
    const filter = { restaurantId: new Types.ObjectId(id), isDeleted: false };
    const [items, total] = await Promise.all([
      Order.find(filter).skip(skip).limit(limit).sort(sort).lean(),
      Order.countDocuments(filter),
    ]);
    return paginateResult(items, total, page, limit);
  }

  async getStaff(id: string, options: QueryOptions) {
    const { page, limit, skip, sort } = getPaginationParams(options);
    const filter = { restaurantId: new Types.ObjectId(id), isDeleted: false };
    const [items, total] = await Promise.all([
      User.find(filter).populate('roleId', 'name slug').skip(skip).limit(limit).sort(sort).lean(),
      User.countDocuments(filter),
    ]);
    return paginateResult(items, total, page, limit);
  }

  async impersonate(id: string, req: AuthenticatedRequest) {
    const restaurant = await this.getById(id);
    const owner = await userRepository.findById(restaurant.ownerId.toString());
    if (!owner) throw new NotFoundError('Restaurant owner not found');

    const role = owner.roleId as unknown as { slug: string };
    const tokenId = generateTokenId();
    const accessToken = signAccessToken({
      userId: owner._id.toString(),
      email: owner.email,
      roleSlug: role.slug,
      restaurantId: restaurant._id.toString(),
      tokenId,
    });

    await auditLogService.logFromRequest(req, 'restaurant_impersonate', 'restaurant', id, {
      impersonatedUserId: owner._id.toString(),
    });

    return {
      accessToken,
      expiresIn: getAccessTokenExpirySeconds(),
      user: {
        id: owner._id,
        email: owner.email,
        firstName: owner.firstName,
        lastName: owner.lastName,
        restaurantId: restaurant._id,
        role: role.slug,
      },
      impersonatedBy: req.user!._id,
    };
  }

  async listPending(options: QueryOptions) {
    return this.list({ ...options, status: 'pending_approval' });
  }

  async requestInfo(id: string, req: AuthenticatedRequest, notes: string) {
    const restaurant = await this.getById(id);
    pushApprovalHistory(restaurant, 'info_requested', req.user!._id, undefined, notes);
    restaurant.statusReason = notes;
    await restaurant.save();
    await notificationService.sendApprovalNotification(restaurant, 'info_requested', notes);
    await auditLogService.logFromRequest(req, 'restaurant_info_requested', 'restaurant', id, { notes });
    return restaurant;
  }

  async exportList(options: QueryOptions & { status?: string }) {
    const result = await this.list({ ...options, page: 1, limit: 10000 });
    return result.items;
  }

  async update(id: string, data: Partial<IRestaurant>, req: AuthenticatedRequest) {
    const restaurant = await restaurantRepository.updateById(id, {
      ...data,
      updatedBy: req.user!._id,
    });
    if (!restaurant) throw new NotFoundError('Restaurant not found');
    await auditLogService.logFromRequest(req, 'restaurant_updated', 'restaurant', id);
    return restaurant;
  }
}

export const adminRestaurantService = new AdminRestaurantService();
