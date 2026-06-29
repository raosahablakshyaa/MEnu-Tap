import { FilterQuery, UpdateQuery, Types } from 'mongoose';
import { User, IUser } from '../models/user.model';

export class UserRepository {
  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }

  async findById(id: string | Types.ObjectId): Promise<IUser | null> {
    return User.findById(id)
      .populate('roleId', 'name slug permissions')
      .populate('restaurantId', 'name slug');
  }

  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = User.findOne({ email: email.toLowerCase() })
      .populate('roleId', 'name slug permissions')
      .populate({
        path: 'roleId',
        populate: { path: 'permissions', select: 'slug name module action' },
      });

    if (includePassword) {
      query.select('+password +passwordResetToken +passwordResetExpires');
    }

    return query.exec();
  }

  async findByResetToken(hashedToken: string): Promise<IUser | null> {
    return User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    })
      .select('+passwordResetToken +passwordResetExpires +password')
      .populate('roleId', 'name slug permissions');
  }

  async updateById(
    id: string | Types.ObjectId,
    data: UpdateQuery<IUser>
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('roleId', 'name slug permissions');
  }

  async findAll(
    filter: FilterQuery<IUser> = {},
    options: { page?: number; limit?: number } = {}
  ): Promise<{ users: IUser[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('roleId', 'name slug')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    return { users, total };
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const filter: FilterQuery<IUser> = { email: email.toLowerCase() };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const count = await User.countDocuments(filter);
    return count > 0;
  }
}

export const userRepository = new UserRepository();
