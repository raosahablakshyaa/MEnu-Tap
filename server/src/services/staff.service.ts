import crypto from 'crypto';
import { User } from '../models/user.model';
import { Role } from '../models/role.model';
import { StaffInvitation } from '../models/staffInvitation.model';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { STAFF_ROLES } from '../constants';

export class StaffService {
  async list(restaurantId: string) {
    const staff = await User.find({ restaurantId, isDeleted: false })
      .populate('roleId', 'name slug')
      .select('-password')
      .lean();
    return staff;
  }

  async invite(restaurantId: string, data: { email: string; roleSlug: string }, invitedBy: string) {
    if (!STAFF_ROLES.includes(data.roleSlug as (typeof STAFF_ROLES)[number])) {
      throw new BadRequestError('Invalid role');
    }
    const role = await Role.findOne({ slug: data.roleSlug });
    if (!role) throw new NotFoundError('Role not found');

    // Cancel any existing pending invite
    await StaffInvitation.updateMany(
      { restaurantId, email: data.email, status: 'pending' },
      { status: 'cancelled' }
    );

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await StaffInvitation.create({
      restaurantId,
      email: data.email,
      roleSlug: data.roleSlug,
      roleId: role._id,
      token,
      status: 'pending',
      invitedBy,
      expiresAt,
    });

    return { invitation, inviteUrl: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/staff/accept-invite?token=${token}` };
  }

  async getInvitations(restaurantId: string) {
    return StaffInvitation.find({ restaurantId })
      .populate('roleId', 'name slug')
      .sort({ createdAt: -1 })
      .lean();
  }

  async updateRole(restaurantId: string, staffId: string, roleSlug: string) {
    const role = await Role.findOne({ slug: roleSlug });
    if (!role) throw new NotFoundError('Role not found');
    const user = await User.findOne({ _id: staffId, restaurantId });
    if (!user) throw new NotFoundError('Staff member not found');
    user.roleId = role._id as typeof user.roleId;
    await user.save();
    return user;
  }

  async suspend(restaurantId: string, staffId: string) {
    const user = await User.findOne({ _id: staffId, restaurantId });
    if (!user) throw new NotFoundError('Staff member not found');
    user.isActive = false;
    await user.save();
    return { suspended: true };
  }

  async activate(restaurantId: string, staffId: string) {
    const user = await User.findOne({ _id: staffId, restaurantId });
    if (!user) throw new NotFoundError('Staff member not found');
    user.isActive = true;
    await user.save();
    return { activated: true };
  }

  async remove(restaurantId: string, staffId: string) {
    const user = await User.findOne({ _id: staffId, restaurantId });
    if (!user) throw new NotFoundError('Staff member not found');
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.isActive = false;
    user.restaurantId = undefined;
    await user.save();
    return { removed: true };
  }

  async cancelInvitation(restaurantId: string, invitationId: string) {
    const inv = await StaffInvitation.findOne({ _id: invitationId, restaurantId });
    if (!inv) throw new NotFoundError('Invitation not found');
    inv.status = 'cancelled';
    await inv.save();
    return { cancelled: true };
  }
}

export const staffService = new StaffService();
