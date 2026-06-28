import { userRepository } from '../repositories/user.repository';
import { roleRepository } from '../repositories/role.repository';
import { restaurantRepository } from '../repositories/restaurant.repository';
import { tokenService } from './token.service';
import { hashPassword, comparePassword } from '../utils/password.utils';
import { generateSecureToken, hashSecureToken, getClientIp } from '../helpers';
import { slugify } from '../helpers/tenant.helper';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from '../validators/auth.validator';
import {
  ConflictError,
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
} from '../utils/errors';
import { ERROR_MESSAGES, ROLE_SLUGS } from '../constants';
import { config } from '../config';
import { logger } from '../utils/logger';
import { Response } from 'express';
import { auditLogService } from './auditLog.service';
import { sendEmail, welcomeEmail, passwordResetEmail } from './email.service';
import { IRole } from '../models/role.model';
import { IUser } from '../models/user.model';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface AuthMeta {
  userAgent?: string;
  ipAddress?: string;
}

function formatUserResponse(user: IUser) {
  const role = user.roleId as unknown as IRole;
  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    phone: user.phone,
    avatar: user.avatar,
    role: role ? { id: role._id, name: role.name, slug: role.slug } : null,
    restaurantId: user.restaurantId,
    isEmailVerified: user.isEmailVerified,
    lastLoginAt: user.lastLoginAt,
  };
}

export class AuthService {
  async register(input: RegisterInput, meta: AuthMeta, res: Response) {
    const emailExists = await userRepository.emailExists(input.email);
    if (emailExists) {
      throw new ConflictError(ERROR_MESSAGES.EMAIL_EXISTS);
    }

    const role = await roleRepository.findSystemRoleBySlug(input.roleSlug);
    if (!role) {
      throw new BadRequestError('Invalid role specified');
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await userRepository.create({
      email: input.email.toLowerCase(),
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      roleId: role._id,
    });

    if (input.roleSlug === ROLE_SLUGS.RESTAURANT_OWNER) {
      if (!input.restaurantName) {
        throw new BadRequestError('Restaurant name is required for restaurant owners');
      }

      const slug = input.restaurantSlug || slugify(input.restaurantName);
      const slugTaken = await restaurantRepository.slugExists(slug);
      if (slugTaken) {
        throw new ConflictError('Restaurant slug already taken');
      }

      const restaurant = await restaurantRepository.create({
        name: input.restaurantName,
        slug,
        ownerId: user._id,
        status: 'pending',
        contact: {
          email: input.email.toLowerCase(),
          phone: input.phone || '',
        },
        address: {
          street: '',
          city: '',
          state: '',
          country: 'India',
          postalCode: '',
        },
        createdBy: user._id,
      });

      await userRepository.updateById(user._id, { restaurantId: restaurant._id });
      user.restaurantId = restaurant._id;
    }

    const tokens = await tokenService.generateTokenPair(
      {
        userId: user._id.toString(),
        email: user.email,
        roleSlug: role.slug,
        restaurantId: user.restaurantId?.toString(),
      },
      meta
    );

    tokenService.setRefreshTokenCookie(res, tokens.refreshToken);

    await userRepository.updateById(user._id, { lastLoginAt: new Date() });

    const populatedUser = await userRepository.findById(user._id);

    // Send welcome email (non-blocking)
    sendEmail({ to: user.email, ...welcomeEmail(input.firstName, input.restaurantName) }).catch(() => {});

    return {
      user: formatUserResponse(populatedUser!),
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async login(input: LoginInput, meta: AuthMeta, res: Response) {
    const user = await userRepository.findByEmail(input.email, true);
    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new UnauthorizedError(ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
    }

    // Check account lock
    const userWithSecurity = user as IUser & { failedLoginAttempts?: number; lockedUntil?: Date };
    if (userWithSecurity.lockedUntil && userWithSecurity.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((userWithSecurity.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedError(`Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`);
    }

    const isPasswordValid = await comparePassword(input.password, user.password);
    if (!isPasswordValid) {
      const attempts = (userWithSecurity.failedLoginAttempts ?? 0) + 1;
      const lockUpdate: Record<string, unknown> = { failedLoginAttempts: attempts };
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        lockUpdate['lockedUntil'] = new Date(Date.now() + LOCK_DURATION_MS);
      }
      await userRepository.updateById(user._id, lockUpdate);
      await auditLogService.create({
        action: 'login',
        resource: 'auth',
        userEmail: input.email,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        status: 'failure',
        metadata: { reason: 'invalid_credentials', attempt: attempts },
      });
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Reset lockout on successful login
    await userRepository.updateById(user._id, { failedLoginAttempts: 0, lockedUntil: null });

    const role = user.roleId as unknown as IRole;

    const tokens = await tokenService.generateTokenPair(
      {
        userId: user._id.toString(),
        email: user.email,
        roleSlug: role.slug,
        restaurantId: user.restaurantId?.toString(),
      },
      meta
    );

    tokenService.setRefreshTokenCookie(res, tokens.refreshToken);

    await userRepository.updateById(user._id, { lastLoginAt: new Date() });

    await auditLogService.create({
      action: 'login',
      resource: 'auth',
      userId: user._id.toString(),
      userEmail: user.email,
      userRole: role.slug,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      status: 'success',
    });

    return {
      user: formatUserResponse(user),
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async logout(tokenId: string | undefined, res: Response) {
    if (tokenId) {
      await tokenService.revokeToken(tokenId);
    }
    tokenService.clearRefreshTokenCookie(res);
    return { message: 'Logged out successfully' };
  }

  async refreshToken(refreshToken: string, meta: AuthMeta, res: Response) {
    const tokens = await tokenService.refreshAccessToken(refreshToken, meta);
    tokenService.setRefreshTokenCookie(res, tokens.refreshToken);
    return {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = generateSecureToken();
    const hashedToken = hashSecureToken(resetToken);

    await userRepository.updateById(user._id, {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
    });

    const resetUrl = `${config.CLIENT_URL}/reset-password?token=${resetToken}`;

    // Send password reset email (non-blocking)
    sendEmail({ to: user.email, ...passwordResetEmail(user.firstName, resetUrl) }).catch(() => {});
    logger.info(`Password reset requested for ${user.email}`);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(input: ResetPasswordInput) {
    const hashedToken = hashSecureToken(input.token);
    const user = await userRepository.findByResetToken(hashedToken);

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(input.password);

    await userRepository.updateById(user._id, {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
      passwordChangedAt: new Date(),
    });

    await tokenService.revokeAllUserTokens(user._id.toString());

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await userRepository.findByEmail(
      (await userRepository.findById(userId))!.email,
      true
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isCurrentValid = await comparePassword(input.currentPassword, user.password);
    if (!isCurrentValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    const hashedPassword = await hashPassword(input.newPassword);

    await userRepository.updateById(user._id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });

    await tokenService.revokeAllUserTokens(user._id.toString());

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return formatUserResponse(user);
  }

  getClientMeta(req: { headers: Record<string, string | string[] | undefined>; ip?: string }): AuthMeta {
    return {
      userAgent: req.headers['user-agent'] as string,
      ipAddress: getClientIp(req),
    };
  }
}

export const authService = new AuthService();
