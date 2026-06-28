import { Coupon, ICoupon } from '../../models';
import { auditLogService } from '../auditLog.service';
import { getPaginationParams, paginateResult, buildSearchFilter, QueryOptions } from '../../utils/pagination';
import { NotFoundError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../types';

export class AdminCouponService {
  async list(options: QueryOptions & { status?: string; type?: string }) {
    const { page, limit, skip, sort } = getPaginationParams(options);
    const filter: Record<string, unknown> = { isDeleted: false };
    if (options.status) filter.status = options.status;
    if (options.type) filter.type = options.type;
    Object.assign(filter, buildSearchFilter(options.search, ['code', 'name']));

    const [items, total] = await Promise.all([
      Coupon.find(filter).skip(skip).limit(limit).sort(sort).lean(),
      Coupon.countDocuments(filter),
    ]);
    return paginateResult(items, total, page, limit);
  }

  async create(data: Partial<ICoupon>, req: AuthenticatedRequest) {
    const coupon = await Coupon.create({ ...data, createdBy: req.user!._id });
    await auditLogService.logFromRequest(req, 'coupon_created', 'coupon', coupon._id.toString());
    return coupon;
  }

  async update(id: string, data: Partial<ICoupon>, req: AuthenticatedRequest) {
    const coupon = await Coupon.findByIdAndUpdate(id, { ...data, updatedBy: req.user!._id }, { new: true, runValidators: true });
    if (!coupon) throw new NotFoundError('Coupon not found');
    await auditLogService.logFromRequest(req, 'coupon_updated', 'coupon', id);
    return coupon;
  }

  async delete(id: string, req: AuthenticatedRequest) {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new NotFoundError('Coupon not found');
    coupon.isDeleted = true;
    coupon.deletedAt = new Date();
    coupon.status = 'expired';
    await coupon.save();
    await auditLogService.logFromRequest(req, 'coupon_deleted', 'coupon', id);
    return { message: 'Coupon deleted' };
  }

  async getAnalytics(id: string) {
    const coupon = await Coupon.findById(id).lean();
    if (!coupon) throw new NotFoundError('Coupon not found');
    return {
      coupon,
      usageRate: coupon.usageLimit > 0 ? (coupon.usageCount / coupon.usageLimit) * 100 : 0,
      remainingUses: Math.max(0, coupon.usageLimit - coupon.usageCount),
      isExpired: new Date() > coupon.endDate,
    };
  }
}

export const adminCouponService = new AdminCouponService();
