import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { generateSecureToken } from '../helpers';
import { COOKIE_NAMES } from '../constants';
import { config } from '../config';

const CSRF_HEADER = 'x-csrf-token';

export function csrfProtection(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    if (!req.cookies?.[COOKIE_NAMES.CSRF_TOKEN]) {
      const csrfToken = generateSecureToken(32);
      res.cookie(COOKIE_NAMES.CSRF_TOKEN, csrfToken, {
        httpOnly: false,
        secure: config.COOKIE_SECURE,
        sameSite: config.COOKIE_SAME_SITE,
        domain: config.COOKIE_DOMAIN,
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
    return next();
  }

  const cookieToken = req.cookies?.[COOKIE_NAMES.CSRF_TOKEN];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
      data: null,
      errors: null,
    });
    return;
  }

  next();
}

export function setCsrfToken(_req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const csrfToken = generateSecureToken(32);
  res.cookie(COOKIE_NAMES.CSRF_TOKEN, csrfToken, {
    httpOnly: false,
    secure: config.COOKIE_SECURE,
    sameSite: config.COOKIE_SAME_SITE,
    domain: config.COOKIE_DOMAIN,
    maxAge: 24 * 60 * 60 * 1000,
  });
  next();
}
