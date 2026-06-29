import crypto from 'crypto';
import { Types } from 'mongoose';
import { getRazorpayInstance } from '../config/razorpay';
import { config } from '../config';
import {
  PaymentTransaction, SubscriptionPlan, Restaurant,
} from '../models';
import { tenantProvisioningService } from './tenantProvisioning.service';
import { auditLogService } from './auditLog.service';
import { generateNumber } from '../utils/pagination';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

interface CreateOrderInput {
  planId: string;
  restaurantId: string;
  userId: string;
  couponCode?: string;
}

export class PaymentService {
  async createOrder(input: CreateOrderInput) {
    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      throw new BadRequestError('Payment gateway is not configured');
    }

    const [plan, restaurant] = await Promise.all([
      SubscriptionPlan.findById(input.planId),
      Restaurant.findById(input.restaurantId),
    ]);

    if (!plan || !plan.isActive || plan.isPaused) {
      throw new NotFoundError('Plan not found or unavailable');
    }
    if (!restaurant) throw new NotFoundError('Restaurant not found');

    const amountInPaise = Math.round(plan.price * 100);
    const receipt = `rcpt_${restaurant._id}_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: plan.currency,
      receipt,
      notes: {
        restaurantId: restaurant._id.toString(),
        planId: plan._id.toString(),
        userId: input.userId,
      },
    });

    const transaction = await PaymentTransaction.create({
      transactionId: generateNumber('TXN'),
      restaurantId: restaurant._id,
      type: 'subscription',
      status: 'pending',
      amount: plan.price,
      currency: plan.currency,
      gateway: 'razorpay',
      gatewayOrderId: order.id,
      metadata: { planId: plan._id.toString(), receipt },
      createdBy: new Types.ObjectId(input.userId),
    });

    return {
      orderId: order.id,
      amount: amountInPaise,
      currency: plan.currency,
      keyId: config.RAZORPAY_KEY_ID,
      transactionId: transaction.transactionId,
      plan: { id: plan._id, name: plan.name, price: plan.price },
    };
  }

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    req?: AuthenticatedRequest
  ) {
    const razorpay = getRazorpayInstance();
    if (!razorpay) throw new BadRequestError('Payment gateway is not configured');

    const expectedSignature = crypto
      .createHmac('sha256', config.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      await PaymentTransaction.updateOne(
        { gatewayOrderId: razorpayOrderId },
        { status: 'failed', failureReason: 'Invalid signature' }
      );
      throw new BadRequestError('Payment verification failed');
    }

    const transaction = await PaymentTransaction.findOne({ gatewayOrderId: razorpayOrderId });
    if (!transaction) throw new NotFoundError('Transaction not found');

    if (transaction.status === 'success') {
      return { alreadyProcessed: true, transaction };
    }

    transaction.status = 'success';
    transaction.gatewayPaymentId = razorpayPaymentId;
    transaction.gatewaySignature = razorpaySignature;
    await transaction.save();

    const planId = transaction.metadata?.planId as string;
    const restaurantId = transaction.restaurantId.toString();

    const result = await tenantProvisioningService.provisionAfterPayment(
      restaurantId,
      planId,
      transaction._id.toString(),
      req?.user?._id?.toString()
    );

    if (req) {
      await auditLogService.logFromRequest(req, 'payment_success', 'payment', transaction.transactionId, {
        restaurantId,
        planId,
      });
    }

    logger.info(`Payment verified for restaurant ${restaurantId}, plan ${planId}`);

    return { success: true, transaction, ...result };
  }

  async handleWebhook(body: Record<string, unknown>, signature: string) {
    const expected = crypto
      .createHmac('sha256', config.RAZORPAY_KEY_SECRET!)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expected !== signature) {
      throw new BadRequestError('Invalid webhook signature');
    }

    const event = body.event as string;
    const payload = body.payload as Record<string, Record<string, Record<string, unknown>>>;

    if (event === 'payment.failed') {
      const payment = payload.payment?.entity;
      if (payment?.order_id) {
        await PaymentTransaction.updateOne(
          { gatewayOrderId: payment.order_id as string },
          { status: 'failed', failureReason: (payment.error_description as string) || 'Payment failed' }
        );
      }
    }

    return { received: true };
  }

  async refund(transactionId: string, amount?: number) {
    const razorpay = getRazorpayInstance();
    if (!razorpay) throw new BadRequestError('Payment gateway is not configured');

    const transaction = await PaymentTransaction.findOne({ transactionId });
    if (!transaction || transaction.status !== 'success') {
      throw new BadRequestError('Transaction not eligible for refund');
    }

    const refundAmount = amount ? Math.round(amount * 100) : Math.round(transaction.amount * 100);

    await razorpay.payments.refund(transaction.gatewayPaymentId!, {
      amount: refundAmount,
    });

    transaction.status = 'refunded';
    transaction.refundAmount = refundAmount / 100;
    transaction.refundedAt = new Date();
    await transaction.save();

    return transaction;
  }
}

export const paymentService = new PaymentService();
