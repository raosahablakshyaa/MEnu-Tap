import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { CustomerSession } from '../models/customerSession.model';
import { QrCode } from '../models/qrCode.model';
import { Table } from '../models/table.model';
import { Restaurant } from '../models/restaurant.model';
import { Subscription } from '../models/subscription.model';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

// 4-hour session
const SESSION_TTL_MS = 4 * 60 * 60 * 1000;

function detectDevice(ua: string): string {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function detectBrowser(ua: string): string {
  if (/chrome\/\d+/i.test(ua) && !/chromium|edg|opr/i.test(ua)) return 'Chrome';
  if (/firefox\/\d+/i.test(ua)) return 'Firefox';
  if (/safari\/\d+/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  if (/edg\/\d+/i.test(ua)) return 'Edge';
  if (/opr\/\d+/i.test(ua)) return 'Opera';
  return 'Unknown';
}

export interface QrValidationResult {
  restaurant: {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    logo?: string;
    coverImage?: string;
    description?: string;
    operationalInfo: Record<string, unknown>;
    branding: Record<string, unknown>;
    contact: Record<string, unknown>;
  };
  table: {
    _id: Types.ObjectId;
    tableNumber: string;
    displayName: string;
    floor: number;
    floorName?: string;
    capacity: number;
    status: string;
  };
  qrCode: {
    _id: Types.ObjectId;
    token: string;
    scansCount: number;
  };
}

export class CustomerSessionService {
  /**
   * Validate a QR token and return restaurant + table info.
   * Also increments the scan counter.
   */
  async validateQrToken(
    token: string,
    userAgent: string,
    _ipAddress: string       // kept in signature for route handler; prefixed with _ to suppress TS6133
  ): Promise<QrValidationResult> {
    const qr = await QrCode.findOne({ token, isActive: true, isDeleted: false });
    if (!qr) throw new NotFoundError('QR code is invalid or has been deactivated');

    // Check expiry
    if (qr.expiresAt && qr.expiresAt < new Date()) {
      throw new BadRequestError('This QR code has expired. Please ask for a new one.');
    }

    const [table, restaurant] = await Promise.all([
      Table.findOne({ _id: qr.tableId, isDeleted: false }),
      Restaurant.findById(qr.restaurantId).select(
        'name slug logo coverImage description operationalInfo branding contact status'
      ),
    ]);

    if (!table) throw new NotFoundError('Table not found');
    if (!restaurant) throw new NotFoundError('Restaurant not found');
    if (restaurant.status === 'suspended') throw new BadRequestError('This restaurant is temporarily unavailable');
    if (restaurant.status !== 'approved') throw new BadRequestError('This restaurant is not active');

    // Verify active subscription
    const activeSub = await Subscription.findOne({
      restaurantId: restaurant._id,
      status: 'active',
      endDate: { $gt: new Date() },
    }).lean();
    if (!activeSub) throw new BadRequestError('Restaurant subscription is inactive');

    // Increment scan count + update analytics
    const device = detectDevice(userAgent);
    const browser = detectBrowser(userAgent);
    await QrCode.updateOne(
      { _id: qr._id },
      {
        $inc: { scansCount: 1 },
        $set: { lastScannedAt: new Date(), lastDevice: device, lastBrowser: browser },
      }
    );

    logger.info(`QR scanned: table ${table.tableNumber}, restaurant ${restaurant.name}`);

    // Cast via unknown to satisfy strict overlap check on operationalInfo
    return {
      restaurant: restaurant.toObject() as unknown as QrValidationResult['restaurant'],
      table: {
        _id: table._id as Types.ObjectId,
        tableNumber: table.tableNumber,
        displayName: table.displayName,
        floor: table.floor,
        floorName: table.floorName,
        capacity: table.capacity,
        status: table.status,
      },
      qrCode: {
        _id: qr._id as Types.ObjectId,
        token: qr.token,
        scansCount: qr.scansCount + 1,
      },
    };
  }

  /**
   * Create a new customer session after QR validation.
   */
  async createSession(
    token: string,
    userAgent: string,
    ipAddress: string,
    language: string
  ): Promise<{ sessionId: string; expiresAt: Date }> {
    const qr = await QrCode.findOne({ token, isActive: true, isDeleted: false });
    if (!qr) throw new NotFoundError('QR code not found');

    // Reuse active session for same table/restaurant if recent
    const existing = await CustomerSession.findOne({
      restaurantId: qr.restaurantId,
      tableId: qr.tableId,
      isActive: true,
      expiresAt: { $gt: new Date() },
      ipAddress,
    });
    if (existing) {
      return { sessionId: existing.sessionId, expiresAt: existing.expiresAt };
    }

    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const device = detectDevice(userAgent);
    const browser = detectBrowser(userAgent);

    await CustomerSession.create({
      sessionId,
      restaurantId: qr.restaurantId,
      tableId: qr.tableId,
      qrCodeId: qr._id,
      tableNumber: qr.tableNumber,
      device,
      browser,
      language,
      userAgent,
      ipAddress,
      expiresAt,
    });

    return { sessionId, expiresAt };
  }

  /**
   * Save customer personal details to the session (called at checkout).
   */
  async saveCustomerDetails(
    sessionId: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      birthday?: string;
      anniversary?: string;
      consentGiven: boolean;
    }
  ) {
    const session = await CustomerSession.findOne({ sessionId, isActive: true });
    if (!session) throw new NotFoundError('Session not found or expired');

    if (data.name) session.name = data.name;
    if (data.phone) session.phone = data.phone;
    if (data.email) session.email = data.email;
    if (data.birthday) session.birthday = new Date(data.birthday);
    if (data.anniversary) session.anniversary = new Date(data.anniversary);
    session.consentGiven = data.consentGiven;

    await session.save();
    return session;
  }

  /** Get session by sessionId */
  async getSession(sessionId: string) {
    const session = await CustomerSession.findOne({ sessionId, isActive: true });
    if (!session) throw new NotFoundError('Session expired or not found');
    if (session.expiresAt < new Date()) {
      session.isActive = false;
      await session.save();
      throw new BadRequestError('Session has expired. Please scan the QR code again.');
    }
    return session;
  }
}

export const customerSessionService = new CustomerSessionService();
