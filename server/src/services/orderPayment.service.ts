import crypto from 'crypto';
import { Types } from 'mongoose';
import { getRazorpayInstance } from '../config/razorpay';
import { config } from '../config';
import { Order } from '../models/order.model';
import { PaymentTransaction } from '../models/paymentTransaction.model';
import { generateNumber } from '../utils/pagination';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { emitToRestaurant } from '../socket';

export class OrderPaymentService {
  /** Create a Razorpay order for table-order payment */
  async createRazorpayOrder(orderId: string, sessionId: string) {
    const razorpay = getRazorpayInstance();
    if (!razorpay) throw new BadRequestError('Payment gateway not configured');

    const order = await Order.findOne({ _id: orderId, sessionId });
    if (!order) throw new NotFoundError('Order not found');
    if (order.paymentStatus === 'paid') throw new BadRequestError('Order already paid');

    const amountInPaise = Math.round(order.totalAmount * 100);
    const receipt = `ord_${order._id}_${Date.now()}`;

    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: order.currency,
      receipt,
      notes: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        restaurantId: order.restaurantId.toString(),
        tableNumber: order.tableNumber ?? '',
        sessionId,
      },
    });

    // Record transaction
    const txn = await PaymentTransaction.create({
      transactionId: generateNumber('TXN'),
      restaurantId: order.restaurantId,
      type: 'order',
      status: 'pending',
      amount: order.totalAmount,
      currency: order.currency,
      gateway: 'razorpay',
      gatewayOrderId: rzpOrder.id,
      metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber },
    });

    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    return {
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: order.currency,
      keyId: config.RAZORPAY_KEY_ID,
      transactionId: txn.transactionId,
      orderNumber: order.orderNumber,
    };
  }

  /** Verify Razorpay payment signature and mark order as paid */
  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    const razorpay = getRazorpayInstance();
    if (!razorpay) throw new BadRequestError('Payment gateway not configured');

    const expectedSig = crypto
      .createHmac('sha256', config.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSig !== razorpaySignature) {
      await PaymentTransaction.updateOne(
        { gatewayOrderId: razorpayOrderId },
        { status: 'failed', failureReason: 'Invalid signature' }
      );
      throw new BadRequestError('Payment verification failed — invalid signature');
    }

    const txn = await PaymentTransaction.findOne({ gatewayOrderId: razorpayOrderId });
    if (!txn) throw new NotFoundError('Transaction not found');
    if (txn.status === 'success') return { alreadyProcessed: true };

    txn.status = 'success';
    txn.gatewayPaymentId = razorpayPaymentId;
    txn.gatewaySignature = razorpaySignature;
    await txn.save();

    const orderId = txn.metadata?.orderId as string;
    const order = await Order.findById(orderId);
    if (order) {
      order.paymentStatus = 'paid';
      order.paymentMethod = 'razorpay';
      order.razorpayPaymentId = razorpayPaymentId;
      order.transactionId = txn.transactionId;
      order.paidAt = new Date();
      await order.save();

      emitToRestaurant(order.restaurantId.toString(), 'order:paid', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        amount: order.totalAmount,
      });

      logger.info(`Order payment verified: ${order.orderNumber} | ₹${order.totalAmount}`);
    }

    return { success: true, orderId, transactionId: txn.transactionId };
  }

  /** Mark order as cash-paid */
  async markCashPaid(orderId: string, restaurantId: string, staffId: string) {
    const order = await Order.findOne({ _id: orderId, restaurantId });
    if (!order) throw new NotFoundError('Order not found');
    if (order.paymentStatus === 'paid') throw new BadRequestError('Already paid');

    const txnId = generateNumber('TXN');
    await PaymentTransaction.create({
      transactionId: txnId,
      restaurantId: order.restaurantId,
      type: 'order',
      status: 'success',
      amount: order.totalAmount,
      currency: order.currency,
      gateway: 'cash',
      metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber },
      createdBy: new Types.ObjectId(staffId),
    });

    order.paymentStatus = 'paid';
    order.paymentMethod = 'cash';
    order.transactionId = txnId;
    order.paidAt = new Date();
    await order.save();

    emitToRestaurant(restaurantId, 'order:paid', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      amount: order.totalAmount,
    });

    return order;
  }
}

export const orderPaymentService = new OrderPaymentService();
