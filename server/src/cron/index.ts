import { logger } from '../utils/logger';
import { RefreshToken, Subscription, Restaurant } from '../models';
import { getIO } from '../socket';
import { adminDashboardService } from '../services/admin/dashboard.service';
import { aiService } from '../services/ai.service';

export function initializeCronJobs(): void {
  scheduleTokenCleanup();
  scheduleSubscriptionExpiry();
  scheduleDashboardBroadcast();
  scheduleAIDailyReports();
  logger.info('Cron jobs initialized');
}

function scheduleTokenCleanup(): void {
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;

  setInterval(async () => {
    try {
      const result = await RefreshToken.deleteMany({
        $or: [
          { expiresAt: { $lt: new Date() } },
          { isRevoked: true, revokedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      });

      if (result.deletedCount > 0) {
        logger.info(`Cleaned up ${result.deletedCount} expired/revoked refresh tokens`);
      }
    } catch (error) {
      logger.error('Token cleanup cron failed:', error);
    }
  }, CLEANUP_INTERVAL);
}

function scheduleSubscriptionExpiry(): void {
  const INTERVAL = 60 * 60 * 1000;

  setInterval(async () => {
    try {
      const now = new Date();
      const expired = await Subscription.updateMany(
        { isDeleted: false, status: 'active', endDate: { $lt: now } },
        { status: 'expired' }
      );

      const expiringSoon = await Subscription.find({
        isDeleted: false,
        status: 'active',
        endDate: { $lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
        reminderSentAt: { $exists: false },
      });

      for (const sub of expiringSoon) {
        sub.reminderSentAt = now;
        await sub.save();
        logger.info(`Subscription expiry reminder: ${sub._id}`);
      }

      if (expired.modifiedCount > 0) {
        logger.info(`Expired ${expired.modifiedCount} subscriptions`);
      }
    } catch (error) {
      logger.error('Subscription expiry cron failed:', error);
    }
  }, INTERVAL);
}

function scheduleDashboardBroadcast(): void {
  const INTERVAL = 30 * 1000;

  setInterval(async () => {
    try {
      const stats = await adminDashboardService.getStats();
      getIO().to('admin').emit('dashboard:stats', stats);
    } catch {
      // Socket or DB not ready
    }
  }, INTERVAL);
}

function scheduleAIDailyReports(): void {
  // Run at 6 AM daily — check every hour if reports need generation
  const INTERVAL = 60 * 60 * 1000;

  setInterval(async () => {
    try {
      const hour = new Date().getHours();
      if (hour !== 6) return;

      const restaurants = await Restaurant.find({ status: 'active' }, '_id').lean();
      for (const r of restaurants) {
        try {
          await aiService.generateDailyReport(r._id.toString());
        } catch (err) {
          logger.warn(`AI report failed for restaurant ${r._id}: ${(err as Error).message}`);
        }
      }
      logger.info(`AI daily reports generated for ${restaurants.length} restaurants`);
    } catch (error) {
      logger.error('AI daily report cron failed:', error);
    }
  }, INTERVAL);
}
