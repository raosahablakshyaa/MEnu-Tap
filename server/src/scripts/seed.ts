import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { connectRedis, disconnectRedis } from '../config/redis';
import { rbacService } from '../services/rbac.service';
import { hashPassword } from '../utils/password.utils';
import { userRepository } from '../repositories/user.repository';
import { roleRepository } from '../repositories/role.repository';
import { ROLE_SLUGS } from '../constants';
import { logger } from '../utils/logger';

import { SubscriptionPlan, PlatformSettings } from '../models';
import { slugify } from '../helpers/tenant.helper';

const DEFAULT_PLANS = [
  { name: 'Starter', duration: 'monthly' as const, durationDays: 30, price: 999, features: { maxTables: 5, maxStaff: 3, maxMenuItems: 50, maxBranches: 1, storageLimitMb: 200, qrLimit: 10, analyticsAccess: false, posAccess: true, ownerAppAccess: true, customerAppAccess: true } },
  { name: 'Professional', duration: 'monthly' as const, durationDays: 30, price: 2499, isPopular: true, features: { maxTables: 20, maxStaff: 10, maxMenuItems: 200, maxBranches: 2, storageLimitMb: 1000, qrLimit: 50, analyticsAccess: true, posAccess: true, inventoryAccess: true, ownerAppAccess: true, customerAppAccess: true } },
  { name: 'Enterprise', duration: '12_months' as const, durationDays: 365, price: 24999, features: { maxTables: 100, maxStaff: 50, maxMenuItems: 1000, maxBranches: 10, storageLimitMb: 5000, qrLimit: 200, analyticsAccess: true, aiFeatures: true, loyaltyAccess: true, whatsappMarketing: true, posAccess: true, inventoryAccess: true, ownerAppAccess: true, customerAppAccess: true } },
];

async function seedPlans() {
  for (const plan of DEFAULT_PLANS) {
    const slug = slugify(plan.name);
    const existing = await SubscriptionPlan.findOne({ slug });
    if (!existing) {
      await SubscriptionPlan.create({
        ...plan,
        slug,
        currency: 'INR',
        featureList: [`Up to ${plan.features.maxTables} tables`, `${plan.features.maxStaff} staff members`],
        isActive: true,
      });
      logger.info(`Plan seeded: ${plan.name}`);
    }
  }
}

async function seedSettings() {
  const existing = await PlatformSettings.findOne();
  if (!existing) {
    await PlatformSettings.create({ platformName: 'TapMenu', currency: 'INR', taxRate: 18 });
    logger.info('Platform settings seeded');
  }
}
async function seed() {
  try {
    await connectDatabase();
    await connectRedis();

    logger.info('Starting database seed...');

    await rbacService.seedPermissions();
    await rbacService.seedRoles();

    const superAdminRole = await roleRepository.findSystemRoleBySlug(ROLE_SLUGS.SUPER_ADMIN);
    if (!superAdminRole) {
      throw new Error('Super admin role not found after seeding');
    }

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@tapmenu.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';

    const existingAdmin = await userRepository.findByEmail(adminEmail);
    if (!existingAdmin) {
      const hashedPassword = await hashPassword(adminPassword);
      await userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        roleId: superAdminRole._id as mongoose.Types.ObjectId,
        isEmailVerified: true,
        isActive: true,
      });
      logger.info(`Super admin created: ${adminEmail}`);
    } else {
      logger.info('Super admin already exists');
    }

    await seedPlans();
    await seedSettings();

    logger.info('Database seed completed successfully');
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
    await disconnectRedis();
    process.exit(0);
  }
}

seed();
