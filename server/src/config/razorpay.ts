import Razorpay from 'razorpay';
import { config } from './index';
import { logger } from '../utils/logger';

let razorpayInstance: Razorpay | null = null;

export function getRazorpayInstance(): Razorpay | null {
  if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
    logger.warn('Razorpay credentials not configured — payments will be unavailable');
    return null;
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET,
    });
    logger.info('Razorpay configured successfully');
  }

  return razorpayInstance;
}
