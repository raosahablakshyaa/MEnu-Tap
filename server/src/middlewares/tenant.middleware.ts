import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError, BadRequestError } from '../utils/errors';
import { ERROR_MESSAGES } from '../constants';
import { requiresRestaurantContext } from '../helpers/tenant.helper';

export function enforceTenant(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new ForbiddenError());
  }

  if (req.user.isSuperAdmin) {
    const headerRestaurantId = req.headers['x-restaurant-id'] as string | undefined;
    if (headerRestaurantId && Types.ObjectId.isValid(headerRestaurantId)) {
      req.restaurantId = new Types.ObjectId(headerRestaurantId);
    }
    return next();
  }

  if (requiresRestaurantContext(req.user.roleSlug) && !req.user.restaurantId) {
    return next(new ForbiddenError(ERROR_MESSAGES.TENANT_REQUIRED));
  }

  req.restaurantId = req.user.restaurantId;
  next();
}

export function validateTenantAccess(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new ForbiddenError());
  }

  if (req.user.isSuperAdmin) {
    return next();
  }

  const paramRestaurantId = [req.params.restaurantId, req.body?.restaurantId, req.query.restaurantId]
    .flat()
    .find((value): value is string => typeof value === 'string');

  if (paramRestaurantId) {
    if (!Types.ObjectId.isValid(paramRestaurantId)) {
      return next(new BadRequestError('Invalid restaurant ID'));
    }

    if (paramRestaurantId !== req.user.restaurantId?.toString()) {
      return next(new ForbiddenError(ERROR_MESSAGES.TENANT_MISMATCH));
    }
  }

  next();
}

export function injectTenantFilter(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new ForbiddenError());
  }

  if (req.user.isSuperAdmin) {
    if (req.restaurantId) {
      req.query.restaurantId = req.restaurantId.toString();
    }
    return next();
  }

  if (req.user.restaurantId) {
    req.query.restaurantId = req.user.restaurantId.toString();
    req.body = req.body || {};
    if (typeof req.body === 'object') {
      req.body.restaurantId = req.user.restaurantId.toString();
    }
  }

  next();
}

export function requireRestaurantContext(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.restaurantId && !req.user?.isSuperAdmin) {
    return next(new ForbiddenError(ERROR_MESSAGES.TENANT_REQUIRED));
  }
  next();
}
