import { Supplier } from '../models/supplier.model';
import { NotFoundError } from '../utils/errors';
import { paginate } from '../utils/pagination';

export class SupplierService {
  async list(restaurantId: string, query: Record<string, string> = {}) {
    const filter: Record<string, unknown> = { restaurantId, isActive: true };
    if (query.search) filter['name'] = new RegExp(query.search, 'i');
    return paginate(Supplier, filter, {
      page: parseInt(query.page || '1'),
      limit: parseInt(query.limit || '20'),
      sort: { name: 1 },
    });
  }

  async get(restaurantId: string, id: string) {
    const supplier = await Supplier.findOne({ _id: id, restaurantId }).lean();
    if (!supplier) throw new NotFoundError('Supplier not found');
    return supplier;
  }

  async create(restaurantId: string, data: Record<string, unknown>) {
    return Supplier.create({ ...data, restaurantId });
  }

  async update(restaurantId: string, id: string, data: Record<string, unknown>) {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!supplier) throw new NotFoundError('Supplier not found');
    return supplier;
  }

  async delete(restaurantId: string, id: string) {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!supplier) throw new NotFoundError('Supplier not found');
    return { deleted: true };
  }
}

export const supplierService = new SupplierService();
