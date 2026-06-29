import { Types } from 'mongoose';
import { User, Role } from '../../models';
import { userRepository } from '../../repositories/user.repository';
import { roleRepository } from '../../repositories/role.repository';
import { hashPassword } from '../../utils/password.utils';
import { auditLogService } from '../auditLog.service';
import { getPaginationParams, paginateResult, buildSearchFilter, QueryOptions } from '../../utils/pagination';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../types';

export class AdminUserService {
  async list(options: QueryOptions & { roleSlug?: string; restaurantId?: string; isActive?: boolean }) {
    const { page, limit, skip, sort } = getPaginationParams(options);
    const filter: Record<string, unknown> = { isDeleted: false };

    if (options.restaurantId) filter.restaurantId = new Types.ObjectId(options.restaurantId);
    if (options.isActive !== undefined) filter.isActive = options.isActive;
    Object.assign(filter, buildSearchFilter(options.search, ['email', 'firstName', 'lastName', 'phone']));

    let query = User.find(filter).populate('roleId', 'name slug').populate('restaurantId', 'name slug');

    if (options.roleSlug) {
      const role = await roleRepository.findSystemRoleBySlug(options.roleSlug);
      if (role) filter.roleId = role._id;
      query = User.find(filter).populate('roleId', 'name slug').populate('restaurantId', 'name slug');
    }

    const [items, total] = await Promise.all([
      query.skip(skip).limit(limit).sort(sort).lean(),
      User.countDocuments(filter),
    ]);
    return paginateResult(items, total, page, limit);
  }

  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async create(data: {
    email: string; password: string; firstName: string; lastName: string;
    roleSlug: string; restaurantId?: string; phone?: string;
  }, req: AuthenticatedRequest) {
    const exists = await userRepository.emailExists(data.email);
    if (exists) throw new ConflictError('Email already registered');

    const role = await roleRepository.findSystemRoleBySlug(data.roleSlug);
    if (!role) throw new NotFoundError('Role not found');

    const hashedPassword = await hashPassword(data.password);
    const user = await userRepository.create({
      email: data.email.toLowerCase(),
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      roleId: role._id as Types.ObjectId,
      restaurantId: data.restaurantId ? new Types.ObjectId(data.restaurantId) : undefined,
      createdBy: req.user!._id,
    });

    await auditLogService.logFromRequest(req, 'user_created', 'user', user._id.toString());
    return user;
  }

  async update(id: string, data: Record<string, unknown>, req: AuthenticatedRequest) {
    const user = await userRepository.updateById(id, { ...data, updatedBy: req.user!._id });
    if (!user) throw new NotFoundError('User not found');
    await auditLogService.logFromRequest(req, 'user_updated', 'user', id);
    return user;
  }

  async suspend(id: string, req: AuthenticatedRequest) {
    const user = await userRepository.updateById(id, { isActive: false, updatedBy: req.user!._id });
    if (!user) throw new NotFoundError('User not found');
    await auditLogService.logFromRequest(req, 'user_suspended', 'user', id);
    return user;
  }

  async activate(id: string, req: AuthenticatedRequest) {
    const user = await userRepository.updateById(id, { isActive: true, updatedBy: req.user!._id });
    if (!user) throw new NotFoundError('User not found');
    await auditLogService.logFromRequest(req, 'user_activated', 'user', id);
    return user;
  }

  async delete(id: string, req: AuthenticatedRequest) {
    const user = await User.findById(id);
    if (!user) throw new NotFoundError('User not found');
    await User.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      isActive: false,
      updatedBy: req.user!._id,
    });
    await auditLogService.logFromRequest(req, 'user_deleted', 'user', id);
    return { message: 'User deleted' };
  }

  async resetPassword(id: string, newPassword: string, req: AuthenticatedRequest) {
    const hashedPassword = await hashPassword(newPassword);
    const user = await userRepository.updateById(id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
      updatedBy: req.user!._id,
    });
    if (!user) throw new NotFoundError('User not found');
    await auditLogService.logFromRequest(req, 'user_password_reset', 'user', id);
    return { message: 'Password reset successfully' };
  }

  async assignRole(id: string, roleSlug: string, req: AuthenticatedRequest) {
    const role = await roleRepository.findSystemRoleBySlug(roleSlug);
    if (!role) throw new NotFoundError('Role not found');

    const user = await userRepository.updateById(id, { roleId: role._id, updatedBy: req.user!._id });
    if (!user) throw new NotFoundError('User not found');
    await auditLogService.logFromRequest(req, 'user_role_changed', 'user', id, { roleSlug });
    return user;
  }

  async exportUsers(options: QueryOptions & { roleSlug?: string }) {
    const result = await this.list({ ...options, page: 1, limit: 10000 });
    return result.items;
  }

  async getRoleStats() {
    const roles = await Role.find({ isSystem: true, restaurantId: null }).lean();
    const stats = await Promise.all(
      roles.map(async (role) => ({
        role: role.name,
        slug: role.slug,
        count: await User.countDocuments({ roleId: role._id, isDeleted: false }),
      }))
    );
    return stats;
  }
}

export const adminUserService = new AdminUserService();
