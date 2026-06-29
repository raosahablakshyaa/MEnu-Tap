import crypto from 'crypto';
import { OtpVerification } from '../models/otpVerification.model';
import { OTP_EXPIRY_MINUTES, OTP_MAX_ATTEMPTS } from '../constants';
import { BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import { getRedisClient, isRedisAvailable } from '../config/redis';

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export class OtpService {
  async sendPhoneOtp(phone: string, purpose: 'phone_verification' | 'login' = 'phone_verification', email?: string) {
    // Rate-limit via Redis when available; skip when Redis is down
    if (isRedisAvailable()) {
      const redis = getRedisClient()!;
      const rateLimitKey = `otp_rate:${phone}`;
      try {
        const recent = await redis.get(rateLimitKey);
        if (recent) {
          throw new BadRequestError('Please wait before requesting another OTP');
        }
        await redis.setex(rateLimitKey, 60, '1');
      } catch (err) {
        if (err instanceof BadRequestError) throw err;
        // Redis error — continue without rate limiting
        logger.warn(`Redis OTP rate-limit skipped: ${(err as Error).message}`);
      }
    }

    await OtpVerification.updateMany({ phone, purpose, verified: false }, { verified: true });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await OtpVerification.create({
      phone,
      email,
      otpHash: hashOtp(otp),
      purpose,
      expiresAt,
    });

    logger.info(`OTP sent to ${phone} for ${purpose}: ${otp}`);

    return {
      message: 'OTP sent successfully',
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      ...(process.env.NODE_ENV === 'development' ? { devOtp: otp } : {}),
    };
  }

  async verifyPhoneOtp(phone: string, otp: string, purpose: 'phone_verification' | 'login' = 'phone_verification') {
    const record = await OtpVerification.findOne({
      phone,
      purpose,
      verified: false,
      expiresAt: { $gt: new Date() },
    }).select('+otpHash');

    if (!record) {
      throw new BadRequestError('OTP expired or not found');
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestError('Maximum OTP attempts exceeded');
    }

    record.attempts += 1;

    if (record.otpHash !== hashOtp(otp)) {
      await record.save();
      throw new BadRequestError('Invalid OTP');
    }

    record.verified = true;
    await record.save();

    return { verified: true, phone };
  }
}

export const otpService = new OtpService();
