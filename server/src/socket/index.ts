import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';
import { JwtPayload } from '../types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  restaurantId?: string;
  roleSlug?: string;
  sessionId?: string;   // customer session (no-auth)
}

let io: Server | null = null;

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ── Middleware: staff auth (JWT) OR customer session token ────────────────
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    const sessionId = socket.handshake.auth.sessionId as string | undefined;

    // Customer session — no JWT required
    if (!token && sessionId) {
      socket.sessionId = sessionId;
      return next();
    }

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET, {
        issuer: 'tapmenu',
        audience: 'tapmenu-api',
      }) as JwtPayload;

      socket.userId = decoded.userId;
      socket.restaurantId = decoded.restaurantId;
      socket.roleSlug = decoded.roleSlug;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    // ── Customer session room ─────────────────────────────────────────────
    if (socket.sessionId) {
      socket.join(`session:${socket.sessionId}`);
      logger.debug(`Customer session connected: ${socket.sessionId}`);

      // Customer can subscribe to a specific order for live tracking
      socket.on('order:track', (orderId: string) => {
        socket.join(`order:${orderId}`);
        logger.debug(`Customer tracking order: ${orderId}`);
      });

      socket.on('order:untrack', (orderId: string) => {
        socket.leave(`order:${orderId}`);
      });

      socket.on('disconnect', () => {
        logger.debug(`Customer session disconnected: ${socket.sessionId}`);
      });

      return; // Don't fall through to staff logic
    }

    // ── Staff / owner rooms ───────────────────────────────────────────────
    logger.info(`Socket connected: ${socket.id} (user: ${socket.userId})`);

    if (socket.restaurantId) {
      // Main restaurant room — receives all restaurant events (KDS, orders, payments)
      socket.join(`restaurant:${socket.restaurantId}`);

      // Role-specific sub-rooms
      if (socket.roleSlug === 'kitchen_staff') {
        socket.join(`kitchen:${socket.restaurantId}`);
      }
      if (socket.roleSlug === 'waiter') {
        socket.join(`waiter:${socket.restaurantId}`);
      }

      logger.debug(`User ${socket.userId} joined restaurant:${socket.restaurantId} (${socket.roleSlug})`);
    }

    if (socket.roleSlug === 'super_admin') {
      socket.join('admin');
    }

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (reason: ${reason})`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error: ${socket.id}`, error);
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

/** Emit to all staff/kitchen of a restaurant */
export function emitToRestaurant(restaurantId: string, event: string, data: unknown): void {
  io?.to(`restaurant:${restaurantId}`).emit(event, data);
}

/** Emit specifically to kitchen staff of a restaurant */
export function emitToKitchen(restaurantId: string, event: string, data: unknown): void {
  io?.to(`kitchen:${restaurantId}`).emit(event, data);
}

/** Emit to a specific customer session */
export function emitToSession(sessionId: string, event: string, data: unknown): void {
  io?.to(`session:${sessionId}`).emit(event, data);
}

/** Emit to everyone tracking a specific order */
export function emitToOrder(orderId: string, event: string, data: unknown): void {
  io?.to(`order:${orderId}`).emit(event, data);
}

/** Emit to a specific authenticated user */
export function emitToUser(userId: string, event: string, data: unknown): void {
  io?.to(`user:${userId}`).emit(event, data);
}
