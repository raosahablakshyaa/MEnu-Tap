import { IRestaurant } from '../models';
import { logger } from '../utils/logger';
import { config } from '../config';
import { getIO } from '../socket';

export class NotificationService {
  async sendWelcomeEmail(email: string, ownerName: string, restaurantName: string) {
    logger.info(`[EMAIL] Welcome to ${ownerName} (${email}) - Restaurant: ${restaurantName}`);
    return { sent: true, channel: 'email' };
  }

  async sendEmailVerification(email: string, token: string) {
    const verifyUrl = `${config.CLIENT_URL}/onboarding/verify-email?token=${token}`;
    logger.info(`[EMAIL] Verification link for ${email}: ${verifyUrl}`);
    return { sent: true, verifyUrl: config.NODE_ENV === 'development' ? verifyUrl : undefined };
  }

  async sendOtpSms(phone: string, otp: string) {
    logger.info(`[SMS] OTP to ${phone}: ${otp}`);
    return { sent: true, channel: 'sms' };
  }

  async sendRegistrationConfirmation(restaurant: IRestaurant) {
    logger.info(`[EMAIL] Registration confirmation for ${restaurant.contact.email}`);
    return { sent: true };
  }

  async sendPaymentSuccess(restaurant: IRestaurant, plan: { name: string; price: number }, invoice: { invoiceNumber: string; totalAmount: number }) {
    logger.info(`[EMAIL] Payment success for ${restaurant.contact.email} - Plan: ${plan.name}, Invoice: ${invoice.invoiceNumber}, Amount: ${invoice.totalAmount}`);
    return { sent: true };
  }

  async sendInvoiceEmail(email: string, invoiceNumber: string, amount: number) {
    logger.info(`[EMAIL] Invoice ${invoiceNumber} to ${email} - ₹${amount}`);
    return { sent: true };
  }

  async notifyAdminNewRestaurant(restaurant: IRestaurant) {
    logger.info(`[ADMIN NOTIFY] New restaurant pending approval: ${restaurant.name} (${restaurant._id})`);
    try {
      getIO().to('admin').emit('restaurant:pending', {
        restaurantId: restaurant._id.toString(),
        name: restaurant.name,
        slug: restaurant.slug,
        status: restaurant.status,
      });
    } catch { /* socket not ready */ }
    return { notified: true };
  }

  async sendSubscriptionExpiryReminder(restaurant: IRestaurant, endDate: Date) {
    logger.info(`[EMAIL] Subscription expiry reminder for ${restaurant.contact.email} - expires ${endDate.toISOString()}`);
    return { sent: true };
  }

  async sendApprovalNotification(restaurant: IRestaurant, action: 'approved' | 'rejected' | 'info_requested', reason?: string) {
    logger.info(`[EMAIL] Restaurant ${action} notification to ${restaurant.contact.email}${reason ? `: ${reason}` : ''}`);
    return { sent: true };
  }
}

export const notificationService = new NotificationService();
