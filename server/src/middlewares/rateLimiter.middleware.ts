import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { HTTP_STATUS } from '../constants';

export const globalRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.NODE_ENV === 'development' ? 10000 : config.RATE_LIMIT_MAX_REQUESTS,
  skip: () => config.NODE_ENV === 'development',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    data: null,
    errors: null,
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

export const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: config.NODE_ENV === 'development' ? 1000 : 10, // 1000 in dev, 10 in prod
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.NODE_ENV === 'development', // skip entirely in dev
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after a minute',
    data: null,
    errors: null,
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests, please try again after an hour',
    data: null,
    errors: null,
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});
