import { FilterQuery, UpdateQuery } from 'mongoose';
import { Permission, IPermission } from '../models/permission.model';

export class PermissionRepository {
  async create(data: Partial<IPermission>): Promise<IPermission> {
    return Permission.create(data);
  }

  async findBySlug(slug: string): Promise<IPermission | null> {
    return Permission.findOne({ slug: slug.toLowerCase() });
  }

  async findBySlugs(slugs: string[]): Promise<IPermission[]> {
    return Permission.find({ slug: { $in: slugs.map((s) => s.toLowerCase()) } });
  }

  async findAll(filter: FilterQuery<IPermission> = {}): Promise<IPermission[]> {
    return Permission.find(filter).sort({ module: 1, action: 1 });
  }

  async updateById(id: string, data: UpdateQuery<IPermission>): Promise<IPermission | null> {
    return Permission.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async bulkCreate(permissions: Partial<IPermission>[]): Promise<IPermission[]> {
    return Permission.insertMany(permissions, { ordered: false }) as unknown as Promise<IPermission[]>;
  }
}

export const permissionRepository = new PermissionRepository();
