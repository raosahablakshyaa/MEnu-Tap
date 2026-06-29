import { Response } from 'express';
import { Types } from 'mongoose';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateTokenId,
  getAccessTokenExpirySeconds,
} from '../utils/jwt.utils';
import { getRedisClient, isRedisAvailable, REFRESH_TOKEN_PREFIX, BLACKLIST_TOKEN_PREFIX } from '../config/redis';
import { RefreshToken } from '../models/refreshToken.model';
import { config } from '../config';
import { COOKIE_NAMES } from '../constants';
import { TokenPair } from '../types';
import { parseDurationToMs } from '../helpers';
import { UnauthorizedError } from '../utils/errors';
import { ERROR_MESSAGES } from '../constants';
import { logger } from '../utils/logger';

interface TokenUserData {
  userId: string;
  email: string;
  roleSlug: string;
  restaurantId?: string;
}

/** Safely attempt a Redis operation. Logs warning and continues if Redis is unavailable. */
async function redisOp(fn: (client: NonNullable<ReturnType<typeof getRedisClient>>) => Promise<unknown>): Promise<void> {
  if (!isRedisAvailable()) return;
  const client = getRedisClient();
  if (!client) return;
  try {
    await fn(client);
  } catch (err) {
    logger.warn(`Redis op failed (non-fatal): ${(err as Error).message}`);
  }
}

export class TokenService {
  async generateTokenPair(
    userData: TokenUserData,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<TokenPair> {
    const tokenId = generateTokenId();

    const accessToken = signAccessToken({ ...userData, tokenId });
    const refreshToken = signRefreshToken({ ...userData, tokenId });

    const expiresAt = new Date(Date.now() + parseDurationToMs(config.JWT_REFRESH_EXPIRY));

    await RefreshToken.create({
      tokenId,
      userId: new Types.ObjectId(userData.userId),
      token: refreshToken,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
      expiresAt,
    });

    // Redis cache — optional, falls back to MongoDB-only verification
    await redisOp(client =>
      client.setex(
        `${REFRESH_TOKEN_PREFIX}${tokenId}`,
        Math.floor(parseDurationToMs(config.JWT_REFRESH_EXPIRY) / 1000),
        userData.userId
      )
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: getAccessTokenExpirySeconds(),
    };
  }

  async refreshAccessToken(
    refreshToken: string,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<TokenPair> {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_INVALID);
    }

    const storedToken = await RefreshToken.findOne({
      tokenId: decoded.tokenId,
      isRevoked: false,
    });

    if (!storedToken || storedToken.token !== refreshToken) {
      throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_INVALID);
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_EXPIRED);
    }

    await this.revokeToken(decoded.tokenId);

    return this.generateTokenPair(
      {
        userId: decoded.userId,
        email: decoded.email,
        roleSlug: decoded.roleSlug,
        restaurantId: decoded.restaurantId,
      },
      meta
    );
  }

  async revokeToken(tokenId: string): Promise<void> {
    await RefreshToken.updateOne(
      { tokenId },
      { isRevoked: true, revokedAt: new Date() }
    );

    await redisOp(async client => {
      await client.del(`${REFRESH_TOKEN_PREFIX}${tokenId}`);
      const accessTokenTtl = getAccessTokenExpirySeconds();
      await client.setex(`${BLACKLIST_TOKEN_PREFIX}${tokenId}`, accessTokenTtl, '1');
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const tokens = await RefreshToken.find({ userId, isRevoked: false });

    await RefreshToken.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );

    if (tokens.length) {
      await redisOp(async client => {
        for (const token of tokens) {
          await client.del(`${REFRESH_TOKEN_PREFIX}${token.tokenId}`);
        }
      });
    }
  }

  setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: config.COOKIE_SAME_SITE,
      domain: config.COOKIE_DOMAIN,
      maxAge: parseDurationToMs(config.JWT_REFRESH_EXPIRY),
      path: '/api/v1/auth',
    });
  }

  clearRefreshTokenCookie(res: Response): void {
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: config.COOKIE_SAME_SITE,
      domain: config.COOKIE_DOMAIN,
      path: '/api/v1/auth',
    });
  }
}

export const tokenService = new TokenService();
