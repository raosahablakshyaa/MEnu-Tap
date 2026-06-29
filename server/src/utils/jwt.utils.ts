import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { JwtPayload } from '../types';

export function generateTokenId(): string {
  return uuidv4();
}

export function signAccessToken(payload: Omit<JwtPayload, 'tokenId'> & { tokenId?: string }): string {
  const tokenPayload: JwtPayload = {
    ...payload,
    tokenId: payload.tokenId || generateTokenId(),
  };

  return jwt.sign(tokenPayload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
    issuer: 'tapmenu',
    audience: 'tapmenu-api',
  });
}

export function signRefreshToken(payload: Omit<JwtPayload, 'tokenId'> & { tokenId?: string }): string {
  const tokenPayload: JwtPayload = {
    ...payload,
    tokenId: payload.tokenId || generateTokenId(),
  };

  return jwt.sign(tokenPayload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'],
    issuer: 'tapmenu',
    audience: 'tapmenu-api',
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.JWT_ACCESS_SECRET, {
    issuer: 'tapmenu',
    audience: 'tapmenu-api',
  }) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, config.JWT_REFRESH_SECRET, {
    issuer: 'tapmenu',
    audience: 'tapmenu-api',
  }) as JwtPayload;
}

export function getAccessTokenExpirySeconds(): number {
  const expiry = config.JWT_ACCESS_EXPIRY;
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 900;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 900;
  }
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}
