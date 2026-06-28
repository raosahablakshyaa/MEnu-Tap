import { Table } from '../models/table.model';
import { NotFoundError, BadRequestError } from '../utils/errors';

export class TableService {
  async list(restaurantId: string) {
    const tables = await Table.find({ restaurantId }).sort({ floor: 1, tableNumber: 1 }).lean();
    // Group by floor
    const floors: Record<number, { floorName: string; tables: typeof tables }> = {};
    for (const t of tables) {
      if (!floors[t.floor]) {
        floors[t.floor] = { floorName: t.floorName || `Floor ${t.floor}`, tables: [] };
      }
      floors[t.floor].tables.push(t);
    }
    return { tables, floors };
  }

  async bulkCreate(restaurantId: string, data: { floors: { floorNumber: number; floorName?: string; tableCount: number; startNumber?: number }[] }, userId: string) {
    const operations = [];
    for (const floor of data.floors) {
      const start = floor.startNumber ?? (floor.floorNumber * 100 + 1);
      for (let i = 0; i < floor.tableCount; i++) {
        const num = start + i;
        const tableNumber = String(num);
        operations.push({
          restaurantId,
          tableNumber,
          displayName: `Table ${tableNumber}`,
          floor: floor.floorNumber,
          floorName: floor.floorName || `Floor ${floor.floorNumber}`,
          createdBy: userId,
        });
      }
    }
    // Upsert-style: skip existing
    const existing = await Table.find({ restaurantId }).select('tableNumber').lean();
    const existingNums = new Set(existing.map(t => t.tableNumber));
    const toInsert = operations.filter(op => !existingNums.has(op.tableNumber));
    if (toInsert.length === 0) return { created: 0, message: 'No new tables to create' };
    const result = await Table.insertMany(toInsert);
    return { created: result.length };
  }

  async create(restaurantId: string, data: Record<string, unknown>, userId: string) {
    const exists = await Table.findOne({ restaurantId, tableNumber: data.tableNumber as string });
    if (exists) throw new BadRequestError('Table number already exists');
    const table = await Table.create({
      restaurantId,
      tableNumber: data.tableNumber,
      displayName: data.displayName || `Table ${data.tableNumber}`,
      floor: data.floor ?? 0,
      floorName: data.floorName,
      capacity: data.capacity || 4,
      createdBy: userId,
    });
    return table;
  }

  async update(restaurantId: string, tableId: string, data: Record<string, unknown>, userId: string) {
    const table = await Table.findOne({ _id: tableId, restaurantId });
    if (!table) throw new NotFoundError('Table not found');
    const allowed = ['displayName', 'capacity', 'status', 'floorName', 'isActive'];
    for (const key of allowed) {
      if (data[key] !== undefined) (table as unknown as Record<string, unknown>)[key] = data[key];
    }
    table.updatedBy = userId as unknown as typeof table.updatedBy;
    await table.save();
    return table;
  }

  async delete(restaurantId: string, tableId: string) {
    const table = await Table.findOne({ _id: tableId, restaurantId });
    if (!table) throw new NotFoundError('Table not found');
    table.isDeleted = true;
    table.deletedAt = new Date();
    await table.save();
    return { deleted: true };
  }
}

export const tableService = new TableService();
