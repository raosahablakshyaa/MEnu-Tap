import { Types } from 'mongoose';
import { AuditLog, IAuditLog } from '../models/auditLog.model';
import { AuthenticatedRequest } from '../types';
import { getClientIp } from '../helpers';
import { logger } from '../utils/logger';

export interface CreateAuditLogInput {
  action: string;
  resource: string;
  resourceId?: string;
  userId?: Types.ObjectId | string;
  userEmail?: string;
  userRole?: string;
  restaurantId?: Types.ObjectId | string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failure';
}

export class AuditLogService {
  async create(input: CreateAuditLogInput): Promise<IAuditLog> {
    return AuditLog.create({
      ...input,
      userId: input.userId ? new Types.ObjectId(input.userId) : undefined,
      restaurantId: input.restaurantId ? new Types.ObjectId(input.restaurantId) : undefined,
      status: input.status || 'success',
    });
  }

  async logFromRequest(
    req: AuthenticatedRequest,
    action: string,
    resource: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.create({
        action,
        resource,
        resourceId,
        userId: req.user?._id,
        userEmail: req.user?.email,
        userRole: req.user?.roleSlug,
        restaurantId: req.restaurantId,
        metadata,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] as string,
      });
    } catch (error) {
      logger.error('Failed to persist audit log:', error);
    }
  }
}

export const auditLogService = new AuditLogService();
