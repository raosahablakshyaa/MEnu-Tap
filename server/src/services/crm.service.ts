import crypto from 'crypto';
import { Types } from 'mongoose';
import { Customer, ICustomer } from '../models/customer.model';
import { CustomerTimeline } from '../models/customerTimeline.model';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

function makeReferralCode(phone: string): string {
  const hash = crypto.createHash('md5').update(phone + Date.now()).digest('hex');
  return hash.substring(0, 8).toUpperCase();
}

export interface UpsertCustomerInput {
  restaurantId: string;
  phone: string;
  name?: string;
  email?: string;
  birthday?: string;
  anniversary?: string;
  marketingConsent?: boolean;
  whatsappConsent?: boolean;
  emailConsent?: boolean;
  smsConsent?: boolean;
  consentGiven?: boolean;
  sessionId?: string;
}

export class CrmService {
  /**
   * Upsert customer — called after every order completion.
   * Creates profile on first visit, updates metrics on repeat.
   */
  async upsertCustomer(input: UpsertCustomerInput): Promise<ICustomer> {
    const existing = await Customer.findOne({
      restaurantId: input.restaurantId,
      phone: input.phone,
    });

    const consent = input.consentGiven ?? input.marketingConsent ?? false;

    if (existing) {
      // Update contact fields if provided
      if (input.name && !existing.name) existing.name = input.name;
      if (input.email && !existing.email) existing.email = input.email;
      if (input.birthday && !existing.birthday) existing.birthday = new Date(input.birthday);
      if (input.anniversary && !existing.anniversary) existing.anniversary = new Date(input.anniversary);
      if (consent) {
        existing.marketingConsent = true;
        existing.whatsappConsent = input.whatsappConsent ?? false;
        existing.emailConsent = input.emailConsent ?? false;
        existing.smsConsent = input.smsConsent ?? false;
        existing.consentUpdatedAt = new Date();
      }
      existing.lastVisitAt = new Date();
      existing.totalVisits += 1;
      await existing.save();

      await CustomerTimeline.create({
        restaurantId: input.restaurantId,
        customerId: existing._id,
        eventType: 'visit',
        title: 'Restaurant visit',
        metadata: { sessionId: input.sessionId },
      });

      return existing;
    }

    // New customer
    const referralCode = makeReferralCode(input.phone);
    const customer = await Customer.create({
      restaurantId: input.restaurantId,
      name: input.name || 'Guest',
      phone: input.phone,
      email: input.email,
      birthday: input.birthday ? new Date(input.birthday) : undefined,
      anniversary: input.anniversary ? new Date(input.anniversary) : undefined,
      referralCode,
      membershipTier: 'bronze',
      loyaltyPoints: 0,
      totalVisits: 1,
      totalOrders: 0,
      totalAmountSpent: 0,
      averageOrderValue: 0,
      firstVisitAt: new Date(),
      lastVisitAt: new Date(),
      tags: ['new'],
      marketingConsent: consent,
      whatsappConsent: input.whatsappConsent ?? false,
      emailConsent: input.emailConsent ?? false,
      smsConsent: input.smsConsent ?? false,
      consentUpdatedAt: consent ? new Date() : undefined,
    });

    await CustomerTimeline.create({
      restaurantId: input.restaurantId,
      customerId: customer._id,
      eventType: 'visit',
      title: 'First visit',
      description: `New customer joined`,
      metadata: { sessionId: input.sessionId },
    });

    logger.info(`New CRM customer: ${customer.phone} @ restaurant ${input.restaurantId}`);
    return customer;
  }

  /** Called after order is completed — updates spend metrics and tags */
  async recordOrder(
    restaurantId: string,
    customerId: string,
    orderId: string,
    amount: number
  ): Promise<void> {
    const customer = await Customer.findOne({ _id: customerId, restaurantId });
    if (!customer) return;

    customer.totalOrders += 1;
    customer.totalAmountSpent = parseFloat((customer.totalAmountSpent + amount).toFixed(2));
    customer.averageOrderValue = parseFloat(
      (customer.totalAmountSpent / customer.totalOrders).toFixed(2)
    );
    customer.lastOrderAt = new Date();
    customer.lastOrderId = new Types.ObjectId(orderId);

    // Auto-tag progression
    if (customer.totalOrders >= 10 && !customer.tags.includes('vip')) {
      customer.tags = customer.tags.filter(t => t !== 'new' && t !== 'regular');
      customer.tags.push('vip');
      await CustomerTimeline.create({
        restaurantId,
        customerId: customer._id,
        eventType: 'tag_changed',
        title: 'Became VIP customer',
        metadata: { tag: 'vip', totalOrders: customer.totalOrders },
      });
    } else if (customer.totalOrders >= 3 && !customer.tags.includes('regular')) {
      customer.tags = customer.tags.filter(t => t !== 'new');
      if (!customer.tags.includes('regular')) customer.tags.push('regular');
    }

    await customer.save();

    await CustomerTimeline.create({
      restaurantId,
      customerId: customer._id,
      eventType: 'order',
      title: 'Order placed',
      referenceId: new Types.ObjectId(orderId),
      referenceModel: 'Order',
      amount,
      metadata: { orderId, amount },
    });
  }

  // ── CRM CRUD ────────────────────────────────────────────────────────────

  async list(restaurantId: string, query: Record<string, string> = {}) {
    const filter: Record<string, unknown> = { restaurantId };

    if (query.search) {
      const re = new RegExp(query.search, 'i');
      filter['$or'] = [{ name: re }, { phone: re }, { email: re }];
    }
    if (query.tag) filter['tags'] = query.tag;
    if (query.tier) filter['membershipTier'] = query.tier;
    if (query.segment) filter['segment'] = query.segment;

    const page = Math.max(1, parseInt(query.page || '1'));
    const limit = Math.min(100, parseInt(query.limit || '20'));
    const skip = (page - 1) * limit;

    const sort: Record<string, 1 | -1> = {};
    if (query.sortBy === 'spend') sort['totalAmountSpent'] = -1;
    else if (query.sortBy === 'visits') sort['totalVisits'] = -1;
    else if (query.sortBy === 'recent') sort['lastVisitAt'] = -1;
    else sort['createdAt'] = -1;

    const [customers, total] = await Promise.all([
      Customer.find(filter).sort(sort).skip(skip).limit(limit)
        .select('-__v').lean(),
      Customer.countDocuments(filter),
    ]);

    return { customers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(restaurantId: string, customerId: string) {
    const customer = await Customer.findOne({ _id: customerId, restaurantId })
      .populate('favouriteCategoryIds', 'name')
      .populate('favouriteMenuItemIds', 'name price');
    if (!customer) throw new NotFoundError('Customer not found');
    return customer;
  }

  async update(restaurantId: string, customerId: string, data: Record<string, unknown>, staffId?: string) {
    const customer = await Customer.findOne({ _id: customerId, restaurantId });
    if (!customer) throw new NotFoundError('Customer not found');

    const allowedFields = ['name', 'email', 'gender', 'birthday', 'anniversary',
      'preferredLanguage', 'address', 'notes', 'tags', 'customTags', 'segment',
      'marketingConsent', 'whatsappConsent', 'emailConsent', 'smsConsent'];

    for (const key of allowedFields) {
      if (data[key] !== undefined) (customer as unknown as Record<string, unknown>)[key] = data[key];
    }

    if (data.notes) {
      await CustomerTimeline.create({
        restaurantId,
        customerId: customer._id,
        eventType: 'note_added',
        title: 'Note added by staff',
        description: data.notes as string,
        performedBy: staffId ? new Types.ObjectId(staffId) : undefined,
      });
    }

    await customer.save();
    return customer;
  }

  async getTimeline(restaurantId: string, customerId: string, page = 1, limit = 30) {
    const customer = await Customer.findOne({ _id: customerId, restaurantId });
    if (!customer) throw new NotFoundError('Customer not found');

    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      CustomerTimeline.find({ restaurantId, customerId })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CustomerTimeline.countDocuments({ restaurantId, customerId }),
    ]);

    return { events, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** Auto-segment customers based on visit recency and spend */
  async runSegmentation(restaurantId: string): Promise<{ updated: number }> {
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 86400000);
    const d60 = new Date(now.getTime() - 60 * 86400000);
    const d90 = new Date(now.getTime() - 90 * 86400000);

    const customers = await Customer.find({ restaurantId });
    let updated = 0;

    for (const c of customers) {
      let newSegment = c.segment;
      const lastVisit = c.lastVisitAt;

      if (!lastVisit) { newSegment = 'new'; }
      else if (lastVisit > d30) {
        if (c.totalOrders >= 10) newSegment = 'vip';
        else if (c.totalOrders >= 3) newSegment = 'regular';
        else newSegment = 'returning';
      } else if (lastVisit > d60) {
        newSegment = 'at_risk';
      } else if (lastVisit > d90) {
        newSegment = 'inactive';
      } else {
        newSegment = 'lost';
      }

      if (newSegment !== c.segment) {
        c.segment = newSegment;
        await c.save();
        updated++;
      }
    }

    logger.info(`CRM segmentation: updated ${updated} customers for restaurant ${restaurantId}`);
    return { updated };
  }

  /** Birthday/anniversary customers for today (or this month) */
  async getBirthdayCustomers(restaurantId: string, month?: number): Promise<ICustomer[]> {
    const now = new Date();
    const m = month ?? (now.getMonth() + 1);
    return Customer.find({
      restaurantId,
      $expr: { $eq: [{ $month: '$birthday' }, m] },
      marketingConsent: true,
    }).lean() as unknown as ICustomer[];
  }

  async getAnniversaryCustomers(restaurantId: string, month?: number): Promise<ICustomer[]> {
    const now = new Date();
    const m = month ?? (now.getMonth() + 1);
    return Customer.find({
      restaurantId,
      $expr: { $eq: [{ $month: '$anniversary' }, m] },
      marketingConsent: true,
    }).lean() as unknown as ICustomer[];
  }
}

export const crmService = new CrmService();
