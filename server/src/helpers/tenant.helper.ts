import { Types, FilterQuery } from 'mongoose';
import { AuthenticatedUser } from '../types';
import { ROLE_SLUGS } from '../constants';

export function buildTenantFilter(
  user: AuthenticatedUser,
  baseFilter: FilterQuery<Record<string, unknown>> = {}
): FilterQuery<Record<string, unknown>> {
  if (user.isSuperAdmin) {
    return baseFilter;
  }

  if (!user.restaurantId) {
    return { ...baseFilter, restaurantId: null };
  }

  return {
    ...baseFilter,
    restaurantId: user.restaurantId,
  };
}

export function assertTenantAccess(
  user: AuthenticatedUser,
  resourceRestaurantId?: Types.ObjectId | string | null
): boolean {
  if (user.isSuperAdmin) {
    return true;
  }

  if (!user.restaurantId) {
    return false;
  }

  if (!resourceRestaurantId) {
    return false;
  }

  return user.restaurantId.toString() === resourceRestaurantId.toString();
}

export function requiresRestaurantContext(roleSlug: string): boolean {
  return roleSlug !== ROLE_SLUGS.SUPER_ADMIN;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export { generateSecureToken as generateResetToken, hashSecureToken as hashToken } from './index';
