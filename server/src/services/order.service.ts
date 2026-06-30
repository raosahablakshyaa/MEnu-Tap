import { Types } from 'mongoose';
import { Order, IOrder } from '../models/order.model';
import { Cart } from '../models/cart.model';
import { Table } from '../models/table.model';
import { CustomerSession } from '../models/customerSession.model';
import { Restaurant } from '../models/restaurant.model';
import { MenuItem } from '../models/menuItem.model';
import { CustomerFeedback } from '../models/customerFeedback.model';
import { GstInvoice } from '../models/gstInvoice.model';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { generateNumber } from '../utils/pagination';
import { emitToRestaurant } from '../socket';
import { logger } from '../utils/logger';

export interface PlaceOrderInput {
  sessionId: string;
  paymentMethod: string;
  couponCode?: string;
  notes?: string;
}

export interface OrderStatusUpdate {
  status: IOrder['status'];
  cancelReason?: string;
  staffId?: string;
}

export class OrderService {
  /** Place a new order from the current cart */
  async placeOrder(input: PlaceOrderInput): Promise<IOrder> {
    const session = await CustomerSession.findOne({ sessionId: input.sessionId, isActive: true });
    if (!session) throw new NotFoundError('Session not found or expired');
    if (!session.name?.trim() || !session.phone?.trim()) {
      throw new BadRequestError('Customer name and mobile number are required before placing an order');
    }

    const cart = await Cart.findOne({ sessionId: input.sessionId });
    if (!cart || cart.items.length === 0) throw new BadRequestError('Cart is empty');

    const restaurant = await Restaurant.findById(session.restaurantId).select(
      'name operationalInfo businessDetails address'
    );
    if (!restaurant) throw new NotFoundError('Restaurant not found');

    // Calculate totals – per-item tax already on MenuItem.taxRate
    let subtotal = 0;
    let taxAmount = 0;
    const orderItems = await Promise.all(
      cart.items.map(async cartItem => {
        const menuItem = await MenuItem.findById(cartItem.menuItemId).select('taxRate name');
        const taxRate = menuItem?.taxRate ?? 0;
        const itemTotal = cartItem.subtotal;
        const itemTax = parseFloat(((itemTotal * taxRate) / 100).toFixed(2));
        subtotal += itemTotal;
        taxAmount += itemTax;

        return {
          menuItemId: cartItem.menuItemId,
          name: cartItem.name,
          quantity: cartItem.quantity,
          price: cartItem.price,
          variantName: cartItem.variantName,
          addons: cartItem.addons,
          notes: cartItem.notes,
          subtotal: cartItem.subtotal,
        };
      })
    );

    subtotal = parseFloat(subtotal.toFixed(2));
    taxAmount = parseFloat(taxAmount.toFixed(2));
    const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));

    const orderNumber = generateNumber('ORD');
    const estimatedPrepTime = restaurant.operationalInfo?.avgPrepTimeMinutes ?? 20;

    const order = await Order.create({
      orderNumber,
      restaurantId: session.restaurantId,
      tableId: session.tableId,
      tableNumber: session.tableNumber,
      sessionId: input.sessionId,
      customerName: session.name,
      customerPhone: session.phone,
      customerEmail: session.email,
      status: 'pending',
      items: orderItems,
      subtotal,
      taxAmount,
      taxRate: 0, // blended; per-item taxRate was applied above
      discountAmount: 0,
      couponCode: input.couponCode,
      packingCharges: 0,
      serviceCharges: 0,
      totalAmount,
      currency: 'INR',
      paymentStatus: input.paymentMethod === 'cash' ? 'pending' : 'pending',
      paymentMethod: input.paymentMethod as IOrder['paymentMethod'],
      estimatedPrepTime,
      notes: input.notes,
      feedbackGiven: false,
    });

    // Mark table as occupied
    await Table.findByIdAndUpdate(session.tableId, {
      status: 'occupied',
      currentOrderId: order._id,
    });

    // Clear cart
    await Cart.deleteOne({ sessionId: input.sessionId });

    try {
      const invoice = await this.generateOrderInvoice(order._id.toString());
      order.gstInvoiceId = invoice._id as Types.ObjectId;
      order.gstInvoiceNumber = invoice.invoiceNumber;
    } catch (error) {
      logger.warn(`Invoice generation failed for order ${order.orderNumber}: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Emit to restaurant room → kitchen will pick it up
    emitToRestaurant(session.restaurantId.toString(), 'order:new', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      items: order.items,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      notes: order.notes,
      createdAt: order.createdAt,
    });

    logger.info(`Order placed: ${orderNumber} | Table: ${order.tableNumber} | Amount: ₹${totalAmount}`);

    return order;
  }

  /** Generate a GST invoice for an order. Safe to call multiple times. */
  async generateOrderInvoice(orderId: string) {
    const existing = await GstInvoice.findOne({ orderId });
    if (existing) return existing;

    const order = await Order.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');

    const restaurant = await Restaurant.findById(order.restaurantId).select('name businessDetails address');
    if (!restaurant) throw new NotFoundError('Restaurant not found');

    const totalTaxRate = order.subtotal > 0 ? (order.taxAmount / order.subtotal) * 100 : 0;
    const items = order.items.map((item) => {
      const share = order.subtotal > 0 ? item.subtotal / order.subtotal : 0;
      const itemTax = parseFloat((order.taxAmount * share).toFixed(2));
      const halfTax = parseFloat((itemTax / 2).toFixed(2));

      return {
        description: item.name,
        quantity: item.quantity,
        unit: 'nos',
        unitPrice: item.price,
        taxableAmount: item.subtotal,
        gstRate: parseFloat(totalTaxRate.toFixed(2)),
        cgstAmount: halfTax,
        sgstAmount: parseFloat((itemTax - halfTax).toFixed(2)),
        igstAmount: 0,
        totalAmount: parseFloat((item.subtotal + itemTax).toFixed(2)),
      };
    });

    const address = restaurant.address;
    const sellerAddress = [
      address?.street,
      address?.city,
      address?.state,
      address?.postalCode,
      address?.country,
    ].filter(Boolean).join(', ') || 'Restaurant address';

    const invoice = await GstInvoice.create({
      restaurantId: order.restaurantId,
      orderId: order._id,
      invoiceNumber: generateNumber('INV'),
      invoiceType: 'B2C',
      invoiceDate: new Date(),
      status: 'issued',
      sellerName: restaurant.name,
      sellerGST: restaurant.businessDetails?.gstNumber || 'UNREGISTERED',
      sellerAddress,
      buyerName: order.customerName,
      items,
      subtotal: order.subtotal,
      totalCgst: parseFloat((order.taxAmount / 2).toFixed(2)),
      totalSgst: parseFloat((order.taxAmount - order.taxAmount / 2).toFixed(2)),
      totalIgst: 0,
      totalTax: order.taxAmount,
      roundOff: 0,
      grandTotal: order.totalAmount,
      amountInWords: `INR ${order.totalAmount.toFixed(2)}`,
    });

    order.gstInvoiceId = invoice._id as Types.ObjectId;
    order.gstInvoiceNumber = invoice.invoiceNumber;
    await order.save();

    return invoice;
  }

  /** Get a single order by ID (customer-facing, session-gated) */
  async getOrderBySession(orderId: string, sessionId: string): Promise<IOrder> {
    const order = await Order.findOne({ _id: orderId, sessionId });
    if (!order) throw new NotFoundError('Order not found');
    return order;
  }

  /** Get all orders for a session */
  async getSessionOrders(sessionId: string): Promise<IOrder[]> {
    return Order.find({ sessionId }).sort({ createdAt: -1 }).lean() as unknown as IOrder[];
  }

  /** Update order status (kitchen / staff) */
  async updateStatus(
    restaurantId: string,
    orderId: string,
    update: OrderStatusUpdate
  ): Promise<IOrder> {
    const order = await Order.findOne({ _id: orderId, restaurantId });
    if (!order) throw new NotFoundError('Order not found');

    const allowed = this.getAllowedTransitions(order.status);
    if (!allowed.includes(update.status)) {
      throw new BadRequestError(
        `Cannot transition from "${order.status}" to "${update.status}"`
      );
    }

    order.status = update.status;
    const now = new Date();

    switch (update.status) {
      case 'confirmed':
        order.acceptedAt = now;
        if (update.staffId) order.acceptedBy = new Types.ObjectId(update.staffId);
        break;
      case 'preparing':
        order.preparingAt = now;
        break;
      case 'ready':
        order.readyAt = now;
        break;
      case 'served':
        order.servedAt = now;
        if (update.staffId) order.servedBy = new Types.ObjectId(update.staffId);
        break;
      case 'completed':
        order.completedAt = now;
        // Free table
        await Table.findByIdAndUpdate(order.tableId, {
          status: 'available',
          currentOrderId: undefined,
        });
        break;
      case 'cancelled':
        order.cancelledAt = now;
        order.cancelReason = update.cancelReason;
        // Free table
        await Table.findByIdAndUpdate(order.tableId, {
          status: 'available',
          currentOrderId: undefined,
        });
        break;
    }

    await order.save();

    if (!order.gstInvoiceNumber && order.status !== 'cancelled') {
      try {
        const invoice = await this.generateOrderInvoice(order._id.toString());
        order.gstInvoiceId = invoice._id as Types.ObjectId;
        order.gstInvoiceNumber = invoice.invoiceNumber;
      } catch (error) {
        logger.warn(`Invoice generation failed for order ${order.orderNumber}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Emit to restaurant room (KDS + customer tracking)
    emitToRestaurant(restaurantId, 'order:statusUpdate', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      tableNumber: order.tableNumber,
      sessionId: order.sessionId,
      updatedAt: now,
    });

    // Also emit directly to the customer's session room
    if (order.sessionId) {
      const io = (await import('../socket')).getIO();
      io.to(`session:${order.sessionId}`).emit('order:statusUpdate', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: now,
      });
    }

    logger.info(`Order ${order.orderNumber} status → ${update.status}`);
    return order;
  }

  /** Kitchen queue: active orders for a restaurant */
  async getKitchenOrders(restaurantId: string) {
    return Order.find({
      restaurantId,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] },
    })
      .sort({ createdAt: 1 })
      .lean();
  }

  /** Restaurant order history with filters */
  async getRestaurantOrders(
    restaurantId: string,
    query: {
      status?: string;
      page?: number;
      limit?: number;
      dateFrom?: string;
      dateTo?: string;
    }
  ) {
    const filter: Record<string, unknown> = { restaurantId };
    if (query.status) filter['status'] = query.status;

    if (query.dateFrom || query.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (query.dateFrom) dateFilter['$gte'] = new Date(query.dateFrom);
      if (query.dateTo) dateFilter['$lte'] = new Date(query.dateTo);
      filter['createdAt'] = dateFilter;
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** Submit feedback after order completion */
  async submitFeedback(
    orderId: string,
    sessionId: string,
    data: {
      foodRating: number;
      serviceRating: number;
      ambienceRating: number;
      comment?: string;
    }
  ) {
    const order = await Order.findOne({ _id: orderId, sessionId });
    if (!order) throw new NotFoundError('Order not found');
    if (!['served', 'completed'].includes(order.status)) {
      throw new BadRequestError('Feedback can only be submitted after order is served');
    }
    if (order.feedbackGiven) throw new BadRequestError('Feedback already submitted for this order');

    const overall = parseFloat(
      ((data.foodRating + data.serviceRating + data.ambienceRating) / 3).toFixed(1)
    );

    const session = await CustomerSession.findOne({ sessionId }).lean();

    const feedback = await CustomerFeedback.create({
      restaurantId: order.restaurantId,
      orderId: order._id,
      sessionId,
      customerName: session?.name,
      customerPhone: session?.phone,
      foodRating: data.foodRating,
      serviceRating: data.serviceRating,
      ambienceRating: data.ambienceRating,
      overallRating: overall,
      comment: data.comment,
      images: [],
    });

    order.feedbackGiven = true;
    await order.save();

    return feedback;
  }

  /** Get feedback for a restaurant */
  async getRestaurantFeedback(restaurantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      CustomerFeedback.find({ restaurantId, isPublished: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CustomerFeedback.countDocuments({ restaurantId, isPublished: true }),
    ]);
    return { reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private getAllowedTransitions(current: IOrder['status']): IOrder['status'][] {
    const map: Record<IOrder['status'], IOrder['status'][]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['served', 'cancelled'],
      served: ['completed'],
      completed: [],
      cancelled: [],
    };
    return map[current] ?? [];
  }
}

export const orderService = new OrderService();
