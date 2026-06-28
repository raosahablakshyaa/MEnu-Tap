import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, AuditLogEntry } from '../types';
import { logger } from '../utils/logger';
import { getClientIp } from '../helpers';
import { AUDIT_ACTIONS } from '../constants';

function logAudit(entry: AuditLogEntry): void {
  logger.info('[AUDIT]', {
    ...entry,
    timestamp: new Date().toISOString(),
  });
}

export function auditLogger(action: string, resource: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entry: AuditLogEntry = {
          action,
          resource,
          resourceId: String(req.params.id || req.params.userId || ''),
          userId: req.user?._id?.toString(),
          restaurantId: req.restaurantId?.toString() || req.user?.restaurantId?.toString(),
          metadata: {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
          },
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'],
        };
        logAudit(entry);
      }
      return originalJson(body);
    };

    next();
  };
}

export function auditAuthEvent(action: keyof typeof AUDIT_ACTIONS) {
  return auditLogger(AUDIT_ACTIONS[action], 'auth');
}

export function auditMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (req.user && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    logAudit({
      action: req.method.toLowerCase(),
      resource: req.baseUrl,
      userId: req.user._id.toString(),
      restaurantId: req.restaurantId?.toString(),
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });
  }
  next();
}
