import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let redisAvailable = false;

export function getRedisClient(): Redis | null {
  return redisClient;
}

export function isRedisAvailable(): boolean {
  return redisAvailable && redisClient !== null && redisClient.status === 'ready';
}

export async function connectRedis(): Promise<void> {
  redisClient = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false,
    // Stop retrying after 3 attempts to avoid infinite loops
    retryStrategy(times: number) {
      if (times >= 3) return null; // null = stop retrying
      return Math.min(times * 200, 1000);
    },
  });

  redisClient.on('connect', () => {
    redisAvailable = true;
    logger.info('Redis connected successfully');
  });

  redisClient.on('ready', () => {
    redisAvailable = true;
  });

  redisClient.on('error', (err: Error) => {
    redisAvailable = false;
    logger.warn(`Redis error (non-fatal): ${err.message}`);
  });

  redisClient.on('close', () => {
    redisAvailable = false;
  });

  // Attempt connection — throws if refused, caught in server.ts
  await redisClient.connect();
  redisAvailable = true;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit().catch(() => {});
    redisClient = null;
    redisAvailable = false;
    logger.info('Redis connection closed');
  }
}

export const REFRESH_TOKEN_PREFIX = 'refresh_token:';
export const BLACKLIST_TOKEN_PREFIX = 'blacklist:';
