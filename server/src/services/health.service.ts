import mongoose from 'mongoose';
import { isRedisAvailable, getRedisClient } from '../config/redis';
import { getIO } from '../socket';
import { logger } from '../utils/logger';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    socket: ServiceHealth;
  };
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  latencyMs?: number;
  message?: string;
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const start = Date.now();

  // MongoDB ping
  let dbHealth: ServiceHealth;
  try {
    const t0 = Date.now();
    await mongoose.connection.db?.admin().ping();
    dbHealth = { status: 'up', latencyMs: Date.now() - t0 };
  } catch (err) {
    logger.warn('Health check: MongoDB ping failed', err);
    dbHealth = { status: 'down', message: 'Ping failed' };
  }

  // Redis
  let redisHealth: ServiceHealth;
  if (isRedisAvailable()) {
    try {
      const t0 = Date.now();
      await getRedisClient()!.ping();
      redisHealth = { status: 'up', latencyMs: Date.now() - t0 };
    } catch {
      redisHealth = { status: 'degraded', message: 'Ping failed' };
    }
  } else {
    redisHealth = { status: 'degraded', message: 'Not connected — running without token blacklisting' };
  }

  // Socket.IO
  let socketHealth: ServiceHealth;
  try {
    const io = getIO();
    const sockets = await io.fetchSockets();
    socketHealth = { status: 'up', message: `${sockets.length} active connections` };
  } catch {
    socketHealth = { status: 'degraded', message: 'Socket.IO not initialised' };
  }

  const allUp = dbHealth.status === 'up' && socketHealth.status !== 'down';
  const anyDown = dbHealth.status === 'down';

  return {
    status: anyDown ? 'unhealthy' : allUp ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    version: '8.0.0',
    services: {
      database: dbHealth,
      redis: redisHealth,
      socket: socketHealth,
    },
  };
}
