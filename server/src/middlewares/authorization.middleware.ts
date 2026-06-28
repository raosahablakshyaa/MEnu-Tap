import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError } from '../utils/errors';

export function authorize(...requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ForbiddenError());
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    const hasPermission = requiredPermissions.some((permission) =>
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      const hasManagePermission = requiredPermissions.some((permission) => {
        const [module] = permission.split(':');
        return req.user!.permissions.includes(`${module}:manage`);
      });

      if (!hasManagePermission) {
        return next(new ForbiddenError());
      }
    }

    next();
  };
}

export function authorizeAll(...requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ForbiddenError());
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    const hasAllPermissions = requiredPermissions.every((permission) => {
      if (req.user!.permissions.includes(permission)) return true;
      const [module] = permission.split(':');
      return req.user!.permissions.includes(`${module}:manage`);
    });

    if (!hasAllPermissions) {
      return next(new ForbiddenError());
    }

    next();
  };
}

export function authorizeRoles(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ForbiddenError());
    }

    if (req.user.isSuperAdmin || allowedRoles.includes(req.user.roleSlug)) {
      return next();
    }

    next(new ForbiddenError());
  };
}
