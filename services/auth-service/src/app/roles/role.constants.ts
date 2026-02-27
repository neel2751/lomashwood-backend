export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.USER]: 1,
  [ROLES.ADMIN]: 2,
  [ROLES.SUPER_ADMIN]: 3,
};

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [ROLES.USER]: [

    'auth:read',
    'auth:update',

    'profile:read',
    'profile:update',

    'product:read',

    'appointment:read',
    'appointment:create',
    'appointment:update',
    'appointment:cancel',

    'order:read',
    'order:create',
    'order:cancel',

    'review:read',
    'review:create',
    'review:update',
    'review:delete',

    'notification:read',
    'notification:update',

    'content:read',
  ],

  [ROLES.ADMIN]: [

    'auth:read',
    'auth:update',

    'profile:read',
    'profile:update',

    'product:read',
    'product:create',
    'product:update',

    'appointment:read',
    'appointment:create',
    'appointment:update',
    'appointment:cancel',
    'appointment:manage',

    'order:read',
    'order:create',
    'order:update',
    'order:cancel',
    'order:manage',

    'review:read',
    'review:create',
    'review:update',
    'review:delete',
    'review:moderate',

    'notification:read',
    'notification:create',
    'notification:update',

    'content:read',
    'content:create',
    'content:update',

    'analytics:read',

    'customer:read',
    'customer:update',
  ],

  [ROLES.SUPER_ADMIN]: [

    'auth:read',
    'auth:update',
    'auth:delete',
    'auth:manage',

    'profile:read',
    'profile:update',
    'profile:delete',

    'product:read',
    'product:create',
    'product:update',
    'product:delete',
    'product:manage',

    'appointment:read',
    'appointment:create',
    'appointment:update',
    'appointment:cancel',
    'appointment:delete',
    'appointment:manage',

    'order:read',
    'order:create',
    'order:update',
    'order:cancel',
    'order:delete',
    'order:manage',

    'review:read',
    'review:create',
    'review:update',
    'review:delete',
    'review:moderate',
    'review:manage',

    'notification:read',
    'notification:create',
    'notification:update',
    'notification:delete',
    'notification:manage',

    'content:read',
    'content:create',
    'content:update',
    'content:delete',
    'content:manage',

    'analytics:read',
    'analytics:manage',

    'customer:read',
    'customer:update',
    'customer:delete',
    'customer:manage',

    'admin:read',
    'admin:create',
    'admin:update',
    'admin:delete',
    'admin:manage',
  ],
};

export const DEFAULT_ROLE: Role = ROLES.USER;

export const ADMIN_ROLES: Role[] = [ROLES.ADMIN, ROLES.SUPER_ADMIN];

export const ALL_ROLES: Role[] = Object.values(ROLES);

export const hasPermission = (role: Role, permission: string): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

export const hasMinimumRole = (role: Role, requiredRole: Role): boolean => {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
};

export const isAdminRole = (role: Role): boolean => {
  return ADMIN_ROLES.includes(role);
};