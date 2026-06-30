import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError } from '../utils/errors';
import { ROLE_SLUGS } from '../constants';
import { Restaurant } from '../models';

const OWNER_ROLES: string[] = [ROLE_SLUGS.RESTAURANT_OWNER, ROLE_SLUGS.RESTAURANT_MANAGER];

export function requireRestaurantOwner(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) return next(new ForbiddenError());
  if (req.user.isSuperAdmin || OWNER_ROLES.includes(req.user.roleSlug)) {
    return next();
  }
  next(new ForbiddenError());
}

export async function requireApprovedRestaurant(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  if (req.user?.isSuperAdmin) return next();
  if (!req.user?.restaurantId) return next(new ForbiddenError('Restaurant context required'));

  const restaurant = await Restaurant.findById(req.user.restaurantId);
  if (!restaurant) return next(new ForbiddenError('Restaurant not found'));

  if (restaurant.status === 'suspended') {
    return next(new ForbiddenError('Restaurant is suspended'));
  }

  if (restaurant.status === 'rejected') {
    return next(new ForbiddenError('Restaurant registration was rejected'));
  }

  req.restaurantId = restaurant._id as typeof req.restaurantId;
  next();
}

export async function attachRestaurant(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  if (req.user?.restaurantId) {
    req.restaurantId = req.user.restaurantId;
  }
  next();
}
