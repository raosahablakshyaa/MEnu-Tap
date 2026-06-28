import http from 'http';
import app from './app';
import { config } from './config';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { configureCloudinary } from './config/cloudinary';
import { getRazorpayInstance } from './config/razorpay';
import { initializeSocket } from './socket';
import { initializeCronJobs } from './cron';
import { rbacService } from './services/rbac.service';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    await connectDatabase();

    // Redis is optional — server runs without it (token blacklisting disabled)
    try {
      await connectRedis();
    } catch (redisErr) {
      logger.warn('Redis unavailable — server will run without token blacklisting. Start Redis for full functionality.');
      logger.warn(String(redisErr));
    }

    configureCloudinary();
    getRazorpayInstance();

    await rbacService.seedPermissions();
    await rbacService.seedRoles();

    const httpServer = http.createServer(app);
    initializeSocket(httpServer);
    initializeCronJobs();

    httpServer.listen(config.PORT, () => {
      logger.info(`TapMenu API server running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`API prefix: ${config.API_PREFIX}`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      httpServer.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
