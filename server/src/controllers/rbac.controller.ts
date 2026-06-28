import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { permissionRepository } from '../repositories/permission.repository';
import { roleRepository } from '../repositories/role.repository';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const getPermissions = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const permissions = await permissionRepository.findAll({ isActive: true });
  sendSuccess(res, 'Permissions retrieved successfully', permissions);
});

export const getRoles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filter: Record<string, unknown> = { isActive: true };

  if (!req.user?.isSuperAdmin && req.restaurantId) {
    filter.$or = [
      { isSystem: true, restaurantId: null },
      { restaurantId: req.restaurantId },
    ];
  } else if (req.user?.isSuperAdmin) {
    filter.isSystem = true;
    filter.restaurantId = null;
  }

  const roles = await roleRepository.findAll(filter);
  sendSuccess(res, 'Roles retrieved successfully', roles);
});

export const getRoleById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const role = await roleRepository.findById(String(req.params.id));
  if (!role) {
    res.status(404).json({
      success: false,
      message: 'Role not found',
      data: null,
      errors: null,
    });
    return;
  }
  sendSuccess(res, 'Role retrieved successfully', role);
});
