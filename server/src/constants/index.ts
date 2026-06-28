export const ROLE_SLUGS = {
  SUPER_ADMIN: 'super_admin',
  RESTAURANT_OWNER: 'restaurant_owner',
  RESTAURANT_MANAGER: 'restaurant_manager',
  KITCHEN_STAFF: 'kitchen_staff',
  WAITER: 'waiter',
  CASHIER: 'cashier',
  CUSTOMER: 'customer',
} as const;

export const SYSTEM_ROLES = Object.values(ROLE_SLUGS);

export const RESTAURANT_SCOPED_ROLES = [
  ROLE_SLUGS.RESTAURANT_OWNER,
  ROLE_SLUGS.RESTAURANT_MANAGER,
  ROLE_SLUGS.KITCHEN_STAFF,
  ROLE_SLUGS.WAITER,
  ROLE_SLUGS.CASHIER,
  ROLE_SLUGS.CUSTOMER,
] as const;

export const STAFF_ROLES = [
  ROLE_SLUGS.RESTAURANT_OWNER,
  ROLE_SLUGS.RESTAURANT_MANAGER,
  ROLE_SLUGS.KITCHEN_STAFF,
  ROLE_SLUGS.WAITER,
  ROLE_SLUGS.CASHIER,
] as const;

export const ROLE_HIERARCHY: Record<string, number> = {
  [ROLE_SLUGS.SUPER_ADMIN]: 100,
  [ROLE_SLUGS.RESTAURANT_OWNER]: 80,
  [ROLE_SLUGS.RESTAURANT_MANAGER]: 60,
  [ROLE_SLUGS.KITCHEN_STAFF]: 40,
  [ROLE_SLUGS.WAITER]: 40,
  [ROLE_SLUGS.CASHIER]: 35,
  [ROLE_SLUGS.CUSTOMER]: 10,
};

export const ONBOARDING_STEPS = {
  BASIC_INFO: 1,
  BUSINESS_DETAILS: 2,
  ADDRESS: 3,
  RESTAURANT_INFO: 4,
  BRANDING: 5,
  PLAN_SELECTION: 6,
  PAYMENT: 7,
} as const;

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'Resource not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_DEACTIVATED: 'Your account has been deactivated',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  TENANT_REQUIRED: 'Restaurant context is required',
  TENANT_MISMATCH: 'Access denied to this restaurant',
  EMAIL_EXISTS: 'Email already registered',
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_ERROR: 'An unexpected error occurred',
} as const;

export const AUDIT_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
} as const;

export const COOKIE_NAMES = {
  REFRESH_TOKEN: 'tapmenu_refresh_token',
  CSRF_TOKEN: 'tapmenu_csrf_token',
} as const;
