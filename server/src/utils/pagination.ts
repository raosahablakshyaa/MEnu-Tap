import { FilterQuery, Model, SortOrder } from 'mongoose';
import { PaginatedResult, PaginationOptions } from '../types';

export interface QueryOptions extends PaginationOptions {
  search?: string;
  searchFields?: string[];
  filter?: FilterQuery<Record<string, unknown>>;
}

export function getPaginationParams(options: QueryOptions) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder: SortOrder = options.sortOrder === 'asc' ? 1 : -1;
  const sort: Record<string, SortOrder> = { [sortBy]: sortOrder };
  return { page, limit, skip, sort };
}

export function buildSearchFilter(
  search: string | undefined,
  fields: string[]
): FilterQuery<Record<string, unknown>> {
  if (!search?.trim()) return {};
  const regex = new RegExp(search.trim(), 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
}

export function paginateResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export function generateNumber(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

/** Generic paginate helper used across Phase 7 services */
export async function paginate<T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options: {
    page?: number;
    limit?: number;
    sort?: Record<string, SortOrder | number>;
    select?: string;
    populate?: string | string[];
  } = {}
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  let query = model.find(filter).skip(skip).limit(limit);
  if (options.sort) query = query.sort(options.sort as Record<string, SortOrder>);
  if (options.select) query = query.select(options.select);
  if (options.populate) {
    const pops = Array.isArray(options.populate) ? options.populate : [options.populate];
    for (const p of pops) query = query.populate(p) as typeof query;
  }

  const [items, total] = await Promise.all([query.lean() as Promise<T[]>, model.countDocuments(filter)]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}
