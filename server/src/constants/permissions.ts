export interface PermissionDefinition {
  slug: string;
  name: string;
  module: string;
  action: string;
  description: string;
}

export const PERMISSION_MODULES = {
  USERS: 'users',
  RESTAURANTS: 'restaurants',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  MENU: 'menu',
  ORDERS: 'orders',
  TABLES: 'tables',
  PAYMENTS: 'payments',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  AUDIT: 'audit',
  INVENTORY: 'inventory',
  PURCHASING: 'purchasing',
  FINANCE: 'finance',
  BRANCHES: 'branches',
  POS: 'pos',
  ATTENDANCE: 'attendance',
  AI_REPORTS: 'ai_reports',
} as const;

export const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
} as const;

function buildPermission(
  module: string,
  action: string,
  name: string,
  description: string
): PermissionDefinition {
  return {
    slug: `${module}:${action}`,
    name,
    module,
    action,
    description,
  };
}

export const DEFAULT_PERMISSIONS: PermissionDefinition[] = [
  // Users
  buildPermission(PERMISSION_MODULES.USERS, PERMISSION_ACTIONS.CREATE, 'Create Users', 'Create new user accounts'),
  buildPermission(PERMISSION_MODULES.USERS, PERMISSION_ACTIONS.READ, 'View Users', 'View user accounts'),
  buildPermission(PERMISSION_MODULES.USERS, PERMISSION_ACTIONS.UPDATE, 'Update Users', 'Update user accounts'),
  buildPermission(PERMISSION_MODULES.USERS, PERMISSION_ACTIONS.DELETE, 'Delete Users', 'Delete user accounts'),
  buildPermission(PERMISSION_MODULES.USERS, PERMISSION_ACTIONS.MANAGE, 'Manage Users', 'Full user management'),

  // Restaurants
  buildPermission(PERMISSION_MODULES.RESTAURANTS, PERMISSION_ACTIONS.CREATE, 'Create Restaurants', 'Create new restaurants'),
  buildPermission(PERMISSION_MODULES.RESTAURANTS, PERMISSION_ACTIONS.READ, 'View Restaurants', 'View restaurant details'),
  buildPermission(PERMISSION_MODULES.RESTAURANTS, PERMISSION_ACTIONS.UPDATE, 'Update Restaurants', 'Update restaurant settings'),
  buildPermission(PERMISSION_MODULES.RESTAURANTS, PERMISSION_ACTIONS.DELETE, 'Delete Restaurants', 'Delete restaurants'),
  buildPermission(PERMISSION_MODULES.RESTAURANTS, PERMISSION_ACTIONS.MANAGE, 'Manage Restaurants', 'Full restaurant management'),

  // Roles
  buildPermission(PERMISSION_MODULES.ROLES, PERMISSION_ACTIONS.CREATE, 'Create Roles', 'Create custom roles'),
  buildPermission(PERMISSION_MODULES.ROLES, PERMISSION_ACTIONS.READ, 'View Roles', 'View roles'),
  buildPermission(PERMISSION_MODULES.ROLES, PERMISSION_ACTIONS.UPDATE, 'Update Roles', 'Update roles'),
  buildPermission(PERMISSION_MODULES.ROLES, PERMISSION_ACTIONS.DELETE, 'Delete Roles', 'Delete roles'),
  buildPermission(PERMISSION_MODULES.ROLES, PERMISSION_ACTIONS.MANAGE, 'Manage Roles', 'Full role management'),

  // Permissions
  buildPermission(PERMISSION_MODULES.PERMISSIONS, PERMISSION_ACTIONS.READ, 'View Permissions', 'View permissions'),
  buildPermission(PERMISSION_MODULES.PERMISSIONS, PERMISSION_ACTIONS.MANAGE, 'Manage Permissions', 'Manage permissions'),

  // Menu
  buildPermission(PERMISSION_MODULES.MENU, PERMISSION_ACTIONS.CREATE, 'Create Menu Items', 'Create menu items'),
  buildPermission(PERMISSION_MODULES.MENU, PERMISSION_ACTIONS.READ, 'View Menu', 'View menu items'),
  buildPermission(PERMISSION_MODULES.MENU, PERMISSION_ACTIONS.UPDATE, 'Update Menu Items', 'Update menu items'),
  buildPermission(PERMISSION_MODULES.MENU, PERMISSION_ACTIONS.DELETE, 'Delete Menu Items', 'Delete menu items'),
  buildPermission(PERMISSION_MODULES.MENU, PERMISSION_ACTIONS.MANAGE, 'Manage Menu', 'Full menu management'),

  // Orders
  buildPermission(PERMISSION_MODULES.ORDERS, PERMISSION_ACTIONS.CREATE, 'Create Orders', 'Create orders'),
  buildPermission(PERMISSION_MODULES.ORDERS, PERMISSION_ACTIONS.READ, 'View Orders', 'View orders'),
  buildPermission(PERMISSION_MODULES.ORDERS, PERMISSION_ACTIONS.UPDATE, 'Update Orders', 'Update order status'),
  buildPermission(PERMISSION_MODULES.ORDERS, PERMISSION_ACTIONS.DELETE, 'Delete Orders', 'Cancel/delete orders'),
  buildPermission(PERMISSION_MODULES.ORDERS, PERMISSION_ACTIONS.MANAGE, 'Manage Orders', 'Full order management'),

  // Tables
  buildPermission(PERMISSION_MODULES.TABLES, PERMISSION_ACTIONS.CREATE, 'Create Tables', 'Create tables'),
  buildPermission(PERMISSION_MODULES.TABLES, PERMISSION_ACTIONS.READ, 'View Tables', 'View tables'),
  buildPermission(PERMISSION_MODULES.TABLES, PERMISSION_ACTIONS.UPDATE, 'Update Tables', 'Update tables'),
  buildPermission(PERMISSION_MODULES.TABLES, PERMISSION_ACTIONS.DELETE, 'Delete Tables', 'Delete tables'),
  buildPermission(PERMISSION_MODULES.TABLES, PERMISSION_ACTIONS.MANAGE, 'Manage Tables', 'Full table management'),

  // Payments
  buildPermission(PERMISSION_MODULES.PAYMENTS, PERMISSION_ACTIONS.CREATE, 'Process Payments', 'Process payments'),
  buildPermission(PERMISSION_MODULES.PAYMENTS, PERMISSION_ACTIONS.READ, 'View Payments', 'View payment records'),
  buildPermission(PERMISSION_MODULES.PAYMENTS, PERMISSION_ACTIONS.MANAGE, 'Manage Payments', 'Full payment management'),

  // Reports
  buildPermission(PERMISSION_MODULES.REPORTS, PERMISSION_ACTIONS.READ, 'View Reports', 'View reports and analytics'),
  buildPermission(PERMISSION_MODULES.REPORTS, PERMISSION_ACTIONS.MANAGE, 'Manage Reports', 'Full report access'),

  // Settings
  buildPermission(PERMISSION_MODULES.SETTINGS, PERMISSION_ACTIONS.READ, 'View Settings', 'View settings'),
  buildPermission(PERMISSION_MODULES.SETTINGS, PERMISSION_ACTIONS.UPDATE, 'Update Settings', 'Update settings'),
  buildPermission(PERMISSION_MODULES.SETTINGS, PERMISSION_ACTIONS.MANAGE, 'Manage Settings', 'Full settings management'),

  // Audit
  buildPermission(PERMISSION_MODULES.AUDIT, PERMISSION_ACTIONS.READ, 'View Audit Logs', 'View audit logs'),

  // Inventory
  buildPermission(PERMISSION_MODULES.INVENTORY, PERMISSION_ACTIONS.CREATE, 'Create Inventory', 'Create inventory items'),
  buildPermission(PERMISSION_MODULES.INVENTORY, PERMISSION_ACTIONS.READ, 'View Inventory', 'View inventory'),
  buildPermission(PERMISSION_MODULES.INVENTORY, PERMISSION_ACTIONS.UPDATE, 'Update Inventory', 'Update inventory'),
  buildPermission(PERMISSION_MODULES.INVENTORY, PERMISSION_ACTIONS.DELETE, 'Delete Inventory', 'Delete inventory'),
  buildPermission(PERMISSION_MODULES.INVENTORY, PERMISSION_ACTIONS.MANAGE, 'Manage Inventory', 'Full inventory management'),

  // Purchasing
  buildPermission(PERMISSION_MODULES.PURCHASING, PERMISSION_ACTIONS.CREATE, 'Create Purchase Orders', 'Create POs'),
  buildPermission(PERMISSION_MODULES.PURCHASING, PERMISSION_ACTIONS.READ, 'View Purchase Orders', 'View POs'),
  buildPermission(PERMISSION_MODULES.PURCHASING, PERMISSION_ACTIONS.UPDATE, 'Update Purchase Orders', 'Update POs'),
  buildPermission(PERMISSION_MODULES.PURCHASING, PERMISSION_ACTIONS.MANAGE, 'Manage Purchasing', 'Full purchasing management'),

  // Finance
  buildPermission(PERMISSION_MODULES.FINANCE, PERMISSION_ACTIONS.CREATE, 'Record Expenses', 'Record expenses'),
  buildPermission(PERMISSION_MODULES.FINANCE, PERMISSION_ACTIONS.READ, 'View Finance', 'View financial data'),
  buildPermission(PERMISSION_MODULES.FINANCE, PERMISSION_ACTIONS.MANAGE, 'Manage Finance', 'Full finance access'),

  // Branches
  buildPermission(PERMISSION_MODULES.BRANCHES, PERMISSION_ACTIONS.CREATE, 'Create Branches', 'Create branches'),
  buildPermission(PERMISSION_MODULES.BRANCHES, PERMISSION_ACTIONS.READ, 'View Branches', 'View branches'),
  buildPermission(PERMISSION_MODULES.BRANCHES, PERMISSION_ACTIONS.UPDATE, 'Update Branches', 'Update branches'),
  buildPermission(PERMISSION_MODULES.BRANCHES, PERMISSION_ACTIONS.MANAGE, 'Manage Branches', 'Full branch management'),

  // POS
  buildPermission(PERMISSION_MODULES.POS, PERMISSION_ACTIONS.CREATE, 'Create POS Bills', 'Create bills'),
  buildPermission(PERMISSION_MODULES.POS, PERMISSION_ACTIONS.READ, 'View POS', 'View POS transactions'),
  buildPermission(PERMISSION_MODULES.POS, PERMISSION_ACTIONS.MANAGE, 'Manage POS', 'Full POS access'),

  // Attendance
  buildPermission(PERMISSION_MODULES.ATTENDANCE, PERMISSION_ACTIONS.CREATE, 'Mark Attendance', 'Mark staff attendance'),
  buildPermission(PERMISSION_MODULES.ATTENDANCE, PERMISSION_ACTIONS.READ, 'View Attendance', 'View attendance records'),
  buildPermission(PERMISSION_MODULES.ATTENDANCE, PERMISSION_ACTIONS.MANAGE, 'Manage Attendance', 'Full attendance management'),

  // AI Reports
  buildPermission(PERMISSION_MODULES.AI_REPORTS, PERMISSION_ACTIONS.READ, 'View AI Reports', 'View AI-generated reports'),
  buildPermission(PERMISSION_MODULES.AI_REPORTS, PERMISSION_ACTIONS.MANAGE, 'Manage AI Reports', 'Full AI report access'),
];

export const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  super_admin: DEFAULT_PERMISSIONS.map((p) => p.slug),

  restaurant_owner: DEFAULT_PERMISSIONS.filter(
    (p) => p.module !== PERMISSION_MODULES.RESTAURANTS || p.action !== PERMISSION_ACTIONS.CREATE
  ).map((p) => p.slug),

  restaurant_manager: [
    'users:read', 'users:create', 'users:update',
    'menu:manage',
    'orders:manage',
    'tables:manage',
    'payments:read', 'payments:create',
    'reports:read',
    'settings:read', 'settings:update',
    'inventory:manage',
    'purchasing:read', 'purchasing:create',
    'finance:read',
    'pos:manage',
    'attendance:manage',
    'ai_reports:read',
  ],

  kitchen_staff: [
    'menu:read',
    'orders:read', 'orders:update',
  ],

  waiter: [
    'menu:read',
    'orders:create', 'orders:read', 'orders:update',
    'tables:read', 'tables:update',
    'payments:create',
  ],

  cashier: [
    'menu:read',
    'orders:read', 'orders:update',
    'payments:create', 'payments:read',
    'tables:read',
  ],

  customer: [
    'menu:read',
    'orders:create', 'orders:read',
  ],
};
