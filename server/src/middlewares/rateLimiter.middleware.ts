import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { HTTP_STATUS } from '../constants';

export const globalRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
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
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
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
