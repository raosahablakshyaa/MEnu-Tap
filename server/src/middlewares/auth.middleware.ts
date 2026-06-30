import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../types';
import { verifyAccessToken } from '../utils/jwt.utils';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { userRepository } from '../repositories/user.repository';
import { ROLE_SLUGS, ERROR_MESSAGES } from '../constants';
import { getRedisClient, isRedisAvailable, BLACKLIST_TOKEN_PREFIX } from '../config/redis';
import { IRole } from '../models/role.model';
import { IPermission } from '../models/permission.model';

function extractPermissions(role: IRole | null): string[] {
  if (!role || !role.permissions) return [];
  return (role.permissions as unknown as IPermission[]).map((p) => p.slug);
}

function normalizeObjectId(value: unknown): Types.ObjectId | undefined {
  if (!value) return undefined;
  if (value instanceof Types.ObjectId) return value;

  if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
    return new Types.ObjectId(value);
  }

  if (typeof value === 'object' && '_id' in value) {
    const id = (value as { _id?: unknown })._id;
    if (id instanceof Types.ObjectId) return id;
    if (typeof id === 'string' && Types.ObjectId.isValid(id)) {
      return new Types.ObjectId(id);
    }
  }

  return undefined;
}

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Only check blacklist if Redis is available
    if (isRedisAvailable()) {
      const redis = getRedisClient();
      try {
        const isBlacklisted = await redis!.get(`${BLACKLIST_TOKEN_PREFIX}${decoded.tokenId}`);
        if (isBlacklisted) {
          throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_INVALID);
        }
      } catch (redisErr) {
        if (redisErr instanceof UnauthorizedError) throw redisErr;
        // Redis error — allow request through (token still JWT-verified)
      }
    }

    const user = await userRepository.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError(ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
    }

    const role = user.roleId as unknown as IRole;
    const roleSlug = role?.slug || decoded.roleSlug;
    const permissions = extractPermissions(role);
    const restaurantId = normalizeObjectId(user.restaurantId);

    req.user = {
      _id: user._id as Types.ObjectId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId as Types.ObjectId,
      roleSlug,
      restaurantId,
      permissions,
      isSuperAdmin: roleSlug === ROLE_SLUGS.SUPER_ADMIN,
    };
    req.tokenId = decoded.tokenId;

    if (restaurantId) {
      req.restaurantId = restaurantId;
    }

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError(ERROR_MESSAGES.TOKEN_INVALID));
    }
  }
}

export function optionalAuthenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }
  authenticate(req, res, next);
}

export function requireActiveAccount(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new UnauthorizedError());
  }
  next();
}

export function requireSuperAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user?.isSuperAdmin) {
    return next(new ForbiddenError());
  }
  next();
}
