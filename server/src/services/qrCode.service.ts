import crypto from 'crypto';
import QRCode from 'qrcode';
import { QrCode } from '../models/qrCode.model';
import { Table } from '../models/table.model';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

const APP_BASE_URL = process.env.APP_BASE_URL || 'https://menu.tapmenu.app';

function generateToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

async function generateQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: 'svg', margin: 2, width: 300 });
}

export class QrCodeService {
  async list(restaurantId: string) {
    return QrCode.find({ restaurantId })
      .populate('tableId', 'tableNumber displayName floor floorName status')
      .sort({ createdAt: -1 })
      .lean();
  }

  async generateForTable(restaurantId: string, tableId: string, userId: string) {
    const table = await Table.findOne({ _id: tableId, restaurantId });
    if (!table) throw new NotFoundError('Table not found');

    // Deactivate existing QR codes for this table
    await QrCode.updateMany({ restaurantId, tableId }, { isActive: false });

    const token = generateToken();
    const url = `${APP_BASE_URL}/menu/${token}`;
    const svgData = await generateQrSvg(url);

    const qr = await QrCode.create({
      restaurantId,
      tableId,
      tableNumber: table.tableNumber,
      token,
      url,
      svgData,
      isActive: true,
      createdBy: userId,
    });

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
    return this.generateForTable(restaurantId, qr.tableId.toString(), userId);
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
