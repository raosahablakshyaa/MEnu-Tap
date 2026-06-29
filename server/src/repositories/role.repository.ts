import { FilterQuery, UpdateQuery, Types } from 'mongoose';
import { Role, IRole } from '../models/role.model';

export class RoleRepository {
  async create(data: Partial<IRole>): Promise<IRole> {
    return Role.create(data);
  }

  async findById(id: string | Types.ObjectId): Promise<IRole | null> {
    return Role.findById(id).populate('permissions', 'slug name module action');
  }

  async findBySlug(slug: string, restaurantId?: Types.ObjectId | null): Promise<IRole | null> {
    const filter: FilterQuery<IRole> = { slug: slug.toLowerCase() };
    if (restaurantId) {
      filter.restaurantId = restaurantId;
    } else {
      filter.restaurantId = null;
    }
    return Role.findOne(filter).populate('permissions', 'slug name module action');
  }

  async findSystemRoleBySlug(slug: string): Promise<IRole | null> {
    return Role.findOne({ slug: slug.toLowerCase(), isSystem: true, restaurantId: null })
      .populate('permissions', 'slug name module action');
  }

  async updateById(
    id: string | Types.ObjectId,
    data: UpdateQuery<IRole>
  ): Promise<IRole | null> {
    return Role.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('permissions', 'slug name module action');
  }

  async findAll(filter: FilterQuery<IRole> = {}): Promise<IRole[]> {
    return Role.find(filter).populate('permissions', 'slug name module action');
  }

  async bulkCreate(roles: Partial<IRole>[]): Promise<IRole[]> {
    return Role.insertMany(roles) as unknown as Promise<IRole[]>;
  }
}

export const roleRepository = new RoleRepository();
