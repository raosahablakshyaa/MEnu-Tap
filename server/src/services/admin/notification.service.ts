import { Notification, Restaurant, INotification } from '../../models';
import { auditLogService } from '../auditLog.service';
import { getPaginationParams, paginateResult, QueryOptions } from '../../utils/pagination';
import { NotFoundError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../types';

export class AdminNotificationService {
  async list(options: QueryOptions & { status?: string }) {
    const { page, limit, skip, sort } = getPaginationParams(options);
    const filter: Record<string, unknown> = { isDeleted: false };
    if (options.status) filter.status = options.status;

    const [items, total] = await Promise.all([
      Notification.find(filter).skip(skip).limit(limit).sort(sort).lean(),
      Notification.countDocuments(filter),
    ]);
    return paginateResult(items, total, page, limit);
  }

  async create(data: Partial<INotification>, req: AuthenticatedRequest) {
    const notification = await Notification.create({
      ...data,
      createdBy: req.user!._id,
      status: data.scheduledAt ? 'scheduled' : 'draft',
    });
    await auditLogService.logFromRequest(req, 'notification_created', 'notification', notification._id.toString());
    return notification;
  }

  async send(id: string, req: AuthenticatedRequest) {
    const notification = await Notification.findById(id);
    if (!notification) throw new NotFoundError('Notification not found');

    const recipients = await this.resolveRecipients(notification);
    notification.recipientCount = recipients.length;
    notification.successCount = recipients.length;
    notification.status = 'sent';
    notification.sentAt = new Date();
    await notification.save();

    await auditLogService.logFromRequest(req, 'notification_sent', 'notification', id, {
      recipientCount: recipients.length,
    });
    return notification;
  }

  private async resolveRecipients(notification: INotification): Promise<string[]> {
    switch (notification.targetType) {
      case 'all': {
        const restaurants = await Restaurant.find({ isDeleted: false, status: 'approved' }).select('_id').lean();
        return restaurants.map((r) => r._id.toString());
      }
      case 'restaurants':
        return notification.targetIds;
      case 'city': {
        const restaurants = await Restaurant.find({
          isDeleted: false,
          'address.city': new RegExp(notification.targetFilter?.city || '', 'i'),
        }).select('_id').lean();
        return restaurants.map((r) => r._id.toString());
      }
      case 'state': {
        const restaurants = await Restaurant.find({
          isDeleted: false,
          'address.state': new RegExp(notification.targetFilter?.state || '', 'i'),
        }).select('_id').lean();
        return restaurants.map((r) => r._id.toString());
      }
      default:
        return [];
    }
  }

  async cancel(id: string, req: AuthenticatedRequest) {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { status: 'cancelled', updatedBy: req.user!._id },
      { new: true }
    );
    if (!notification) throw new NotFoundError('Notification not found');
    await auditLogService.logFromRequest(req, 'notification_cancelled', 'notification', id);
    return notification;
  }
}

export const adminNotificationService = new AdminNotificationService();
