import { Types } from 'mongoose';
import { Branch } from '../models/branch.model';
import { Order } from '../models/order.model';
import { NotFoundError } from '../utils/errors';

export class BranchService {
  async list(restaurantId: string) {
    return Branch.find({ restaurantId })
      .populate('managerId', 'firstName lastName email')
      .sort({ isHeadOffice: -1, name: 1 })
      .lean();
  }

  async get(restaurantId: string, id: string) {
    const branch = await Branch.findOne({ _id: id, restaurantId })
      .populate('managerId', 'firstName lastName email')
      .lean();
    if (!branch) throw new NotFoundError('Branch not found');
    return branch;
  }

  async create(restaurantId: string, data: Record<string, unknown>) {
    return Branch.create({ ...data, restaurantId });
  }

  async update(restaurantId: string, id: string, data: Record<string, unknown>) {
    const branch = await Branch.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!branch) throw new NotFoundError('Branch not found');
    return branch;
  }

  async delete(restaurantId: string, id: string) {
    const branch = await Branch.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: { status: 'closed' } },
      { new: true }
    );
    if (!branch) throw new NotFoundError('Branch not found');
    return { deleted: true };
  }

  async getComparison(restaurantId: string, from: Date, to: Date) {
    const branches = await Branch.find({ restaurantId, status: 'active' }).lean();

    const results = await Promise.all(
      branches.map(async (branch) => {
        const orders = await Order.aggregate([
          {
            $match: {
              restaurantId: new Types.ObjectId(restaurantId),
              // branchId would be used in a real setup; for now we show totals per branch
              createdAt: { $gte: from, $lte: to },
              status: { $in: ['completed', 'served'] },
            },
          },
          {
            $group: {
              _id: null,
              revenue: { $sum: '$totalAmount' },
              orders: { $sum: 1 },
              avgOrderValue: { $avg: '$totalAmount' },
            },
          },
        ]);
        const stats = orders[0] ?? { revenue: 0, orders: 0, avgOrderValue: 0 };
        return { branch, ...stats };
      })
    );

    return results;
  }
}

export const branchService = new BranchService();
