import { AuditLog } from '../../models';
import { getPaginationParams, paginateResult, buildSearchFilter, QueryOptions } from '../../utils/pagination';

export class AdminAuditService {
  async list(options: QueryOptions & { action?: string; resource?: string; userId?: string; status?: string }) {
    const { page, limit, skip, sort } = getPaginationParams(options);
    const filter: Record<string, unknown> = {};
    if (options.action) filter.action = options.action;
    if (options.resource) filter.resource = options.resource;
    if (options.userId) filter.userId = options.userId;
    if (options.status) filter.status = options.status;
    Object.assign(filter, buildSearchFilter(options.search, ['userEmail', 'action', 'resource']));

    const [items, total] = await Promise.all([
      AuditLog.find(filter).skip(skip).limit(limit).sort(sort).lean(),
      AuditLog.countDocuments(filter),
    ]);
    return paginateResult(items, total, page, limit);
  }

  async getLoginHistory(options: QueryOptions) {
    return this.list({ ...options, action: 'login' });
  }

  async getFailedLogins(options: QueryOptions) {
    return this.list({ ...options, action: 'login', status: 'failure' });
  }
}

export const adminAuditService = new AdminAuditService();
