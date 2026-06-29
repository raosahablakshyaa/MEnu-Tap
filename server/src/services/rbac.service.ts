import { permissionRepository } from '../repositories/permission.repository';
import { roleRepository } from '../repositories/role.repository';
import { DEFAULT_PERMISSIONS, ROLE_PERMISSION_MAP } from '../constants/permissions';
import { ROLE_SLUGS } from '../constants';
import { logger } from '../utils/logger';

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  [ROLE_SLUGS.SUPER_ADMIN]: 'Super Admin',
  [ROLE_SLUGS.RESTAURANT_OWNER]: 'Restaurant Owner',
  [ROLE_SLUGS.RESTAURANT_MANAGER]: 'Restaurant Manager',
  [ROLE_SLUGS.KITCHEN_STAFF]: 'Kitchen Staff',
  [ROLE_SLUGS.WAITER]: 'Waiter',
  [ROLE_SLUGS.CASHIER]: 'Cashier',
  [ROLE_SLUGS.CUSTOMER]: 'Customer',
};

export class RbacService {
  async seedPermissions(): Promise<void> {
    const existing = await permissionRepository.findAll();
    if (existing.length >= DEFAULT_PERMISSIONS.length) {
      logger.info('Permissions already seeded');
      return;
    }

    const permissionsToCreate = DEFAULT_PERMISSIONS.map((p) => ({
      ...p,
      isSystem: true,
      isActive: true,
    }));

    try {
      await permissionRepository.bulkCreate(permissionsToCreate);
      logger.info(`Seeded ${permissionsToCreate.length} permissions`);
    } catch (error) {
      logger.warn('Some permissions may already exist during seed');
    }
  }

  async seedRoles(): Promise<void> {
    const existingRoles = await roleRepository.findAll({ isSystem: true, restaurantId: null });
    if (existingRoles.length >= Object.keys(ROLE_PERMISSION_MAP).length) {
      logger.info('Roles already seeded');
      return;
    }

    const allPermissions = await permissionRepository.findAll();
    const permissionMap = new Map(allPermissions.map((p) => [p.slug, p._id]));

    for (const [slug, permissionSlugs] of Object.entries(ROLE_PERMISSION_MAP)) {
      const existing = await roleRepository.findSystemRoleBySlug(slug);
      if (existing) continue;

      const permissionIds = permissionSlugs
        .map((s) => permissionMap.get(s))
        .filter(Boolean);

      await roleRepository.create({
        name: ROLE_DISPLAY_NAMES[slug] || slug,
        slug,
        description: `System role: ${ROLE_DISPLAY_NAMES[slug]}`,
        permissions: permissionIds as never[],
        isSystem: true,
        isActive: true,
        restaurantId: undefined,
      });

      logger.info(`Seeded role: ${slug}`);
    }
  }

  async getUserPermissions(roleSlug: string, roleId?: string): Promise<string[]> {
    if (roleId) {
      const role = await roleRepository.findById(roleId);
      if (role?.permissions) {
        const populated = role.permissions as unknown as Array<{ slug: string }>;
        return populated.map((p) => p.slug);
      }
    }
    return ROLE_PERMISSION_MAP[roleSlug] || [];
  }

  async hasPermission(userPermissions: string[], required: string): Promise<boolean> {
    if (userPermissions.includes(required)) return true;
    const [module] = required.split(':');
    return userPermissions.includes(`${module}:manage`);
  }
}

export const rbacService = new RbacService();
