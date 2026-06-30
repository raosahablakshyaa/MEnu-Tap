import crypto from 'crypto';
import QRCode from 'qrcode';
import { Types } from 'mongoose';
import { QrCode } from '../models/qrCode.model';
import { Table } from '../models/table.model';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

const APP_BASE_URL = process.env.APP_BASE_URL || process.env.CLIENT_URL || 'http://localhost:3000';

function generateToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

async function generateQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: 'svg', margin: 2, width: 300 });
}

export class QrCodeService {
  async list(restaurantId: string) {
    const qrCodes = await QrCode.find({ restaurantId })
      .populate('tableId', 'tableNumber displayName floor floorName status')
      .sort({ createdAt: -1 })
      .lean();

    const currentByTable = new Map<string, (typeof qrCodes)[number]>();

    for (const qr of qrCodes) {
      const tableId = qr.tableId?._id?.toString() ?? qr.tableId?.toString();
      if (!tableId) continue;

      const existing = currentByTable.get(tableId);
      if (!existing || (qr.isActive && !existing.isActive)) {
        currentByTable.set(tableId, qr);
      }
    }

    return Array.from(currentByTable.values());
  }

  async generateForTable(restaurantId: string, tableId: string, userId: string) {
    const table = await Table.findOne({ _id: tableId, restaurantId });
    if (!table) throw new NotFoundError('Table not found');

    const token = generateToken();
    const url = `${APP_BASE_URL}/menu/${token}`;
    const svgData = await generateQrSvg(url);

    const existingQr = await QrCode.findOne({ restaurantId, tableId }).sort({ createdAt: -1 });
    let qr;

    if (existingQr) {
      existingQr.tableNumber = table.tableNumber;
      existingQr.token = token;
      existingQr.url = url;
      existingQr.svgData = svgData;
      existingQr.isActive = true;
      existingQr.updatedBy = new Types.ObjectId(userId);
      qr = await existingQr.save();

      await QrCode.updateMany(
        { restaurantId, tableId, _id: { $ne: existingQr._id } },
        { isActive: false }
      );
    } else {
      qr = await QrCode.create({
        restaurantId,
        tableId,
        tableNumber: table.tableNumber,
        token,
        url,
        svgData,
        isActive: true,
        createdBy: userId,
      });
    }

    // Update table with latest qrCodeId
    table.qrCodeId = qr._id as typeof table.qrCodeId;
    await table.save();

    logger.info(`QR generated for table ${table.tableNumber} (restaurant: ${restaurantId})`);
    return qr;
  }

  async generateAll(restaurantId: string, userId: string) {
    const tables = await Table.find({ restaurantId, isDeleted: false, isActive: true }).lean();
    const results = await Promise.all(
      tables.map(t => this.generateForTable(restaurantId, t._id.toString(), userId))
    );
    return { generated: results.length, qrCodes: results };
  }

  async getById(restaurantId: string, qrId: string) {
    const qr = await QrCode.findOne({ _id: qrId, restaurantId })
      .populate('tableId', 'tableNumber displayName floor floorName capacity');
    if (!qr) throw new NotFoundError('QR code not found');
    return qr;
  }

  async regenerate(restaurantId: string, qrId: string, userId: string) {
    const qr = await QrCode.findOne({ _id: qrId, restaurantId });
    if (!qr) throw new NotFoundError('QR code not found');

    const table = await Table.findOne({ _id: qr.tableId, restaurantId });
    if (!table) throw new NotFoundError('Table not found');

    const token = generateToken();
    const url = `${APP_BASE_URL}/menu/${token}`;
    const svgData = await generateQrSvg(url);

    qr.tableNumber = table.tableNumber;
    qr.token = token;
    qr.url = url;
    qr.svgData = svgData;
    qr.isActive = true;
    qr.updatedBy = new Types.ObjectId(userId);
    await qr.save();

    await QrCode.updateMany(
      { restaurantId, tableId: qr.tableId, _id: { $ne: qr._id } },
      { isActive: false }
    );

    table.qrCodeId = qr._id as typeof table.qrCodeId;
    await table.save();

    return qr;
  }

  async deactivate(restaurantId: string, qrId: string) {
    const qr = await QrCode.findOne({ _id: qrId, restaurantId });
    if (!qr) throw new NotFoundError('QR code not found');
    qr.isActive = false;
    await qr.save();
    return { deactivated: true };
  }

  async activate(restaurantId: string, qrId: string) {
    const qr = await QrCode.findOne({ _id: qrId, restaurantId });
    if (!qr) throw new NotFoundError('QR code not found');
    await QrCode.updateMany(
      { restaurantId, tableId: qr.tableId, _id: { $ne: qr._id } },
      { isActive: false }
    );
    qr.isActive = true;
    await qr.save();
    return { activated: true };
  }

  async setExpiry(restaurantId: string, qrId: string, expiresAt: Date) {
    const qr = await QrCode.findOne({ _id: qrId, restaurantId });
    if (!qr) throw new NotFoundError('QR code not found');
    if (expiresAt <= new Date()) throw new BadRequestError('Expiry must be in the future');
    qr.expiresAt = expiresAt;
    await qr.save();
    return { expiresAt };
  }

  async delete(restaurantId: string, qrId: string) {
    const qr = await QrCode.findOne({ _id: qrId, restaurantId });
    if (!qr) throw new NotFoundError('QR code not found');
    qr.isDeleted = true;
    qr.deletedAt = new Date();
    qr.isActive = false;
    await qr.save();
    return { deleted: true };
  }

  /** Get scan analytics summary for a restaurant */
  async getAnalytics(restaurantId: string) {
    const qrCodes = await QrCode.find({ restaurantId })
      .select('tableNumber scansCount lastScannedAt lastDevice lastBrowser isActive')
      .lean();

    const totalScans = qrCodes.reduce((s, q) => s + q.scansCount, 0);
    const activeCount = qrCodes.filter(q => q.isActive).length;
    const topScanned = [...qrCodes].sort((a, b) => b.scansCount - a.scansCount).slice(0, 5);

    return { totalScans, activeCount, totalQrCodes: qrCodes.length, topScanned };
  }
}

export const qrCodeService = new QrCodeService();
