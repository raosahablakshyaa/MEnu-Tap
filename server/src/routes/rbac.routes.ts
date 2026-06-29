import { Router } from 'express';
import { getPermissions, getRoles, getRoleById } from '../controllers/rbac.controller';
import { authenticate, authorize, enforceTenant } from '../middlewares';

const router = Router();

router.use(authenticate);
router.use(enforceTenant);

router.get('/permissions', authorize('permissions:read'), getPermissions);

router.get('/roles', authorize('roles:read'), getRoles);

router.get('/roles/:id', authorize('roles:read'), getRoleById);

export default router;
