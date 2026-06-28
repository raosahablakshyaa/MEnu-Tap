import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
} from '../controllers/auth.controller';
import {
  validateBody,
  authenticate,
  authRateLimiter,
  passwordResetRateLimiter,
  auditAuthEvent,
  csrfProtection,
} from '../middlewares';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', authRateLimiter, validateBody(registerSchema), register);

router.post('/login', authRateLimiter, validateBody(loginSchema), auditAuthEvent('LOGIN'), login);

router.post('/logout', authenticate, auditAuthEvent('LOGOUT'), logout);

router.post('/refresh', csrfProtection, refreshToken);

router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validateBody(forgotPasswordSchema),
  forgotPassword
);

router.post(
  '/reset-password',
  passwordResetRateLimiter,
  validateBody(resetPasswordSchema),
  auditAuthEvent('PASSWORD_RESET'),
  resetPassword
);

router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  auditAuthEvent('PASSWORD_CHANGE'),
  changePassword
);

router.get('/me', authenticate, getMe);

export default router;
