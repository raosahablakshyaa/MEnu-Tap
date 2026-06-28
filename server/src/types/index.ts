import { Request } from 'express';
import { Types } from 'mongoose';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  errors: Record<string, string[]> | null;
}

export interface JwtPayload {
  userId: string;
  email: string;
  roleSlug: string;
  restaurantId?: string;
  tokenId: string;
}

export interface AuthenticatedUser {
  _id: Types.ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  roleId: Types.ObjectId;
  roleSlug: string;
  restaurantId?: Types.ObjectId;
  permissions: string[];
  isSuperAdmin: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  restaurantId?: Types.ObjectId;
  tokenId?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogEntry {
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  restaurantId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export type RoleSlug =
  | 'super_admin'
  | 'restaurant_owner'
  | 'restaurant_manager'
  | 'kitchen_staff'
  | 'waiter'
  | 'customer';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
