import { PERMISSIONS, ROLES } from "@/lib/constants";
import type { PermissionKey, RoleName } from "@/lib/constants";

export type UserWithRole = {
  id: string;
  role: RoleName;
  permissions?: PermissionKey[];
};

const ROLE_PERMISSION_MAP: Record<RoleName, PermissionKey[]> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS) as PermissionKey[],

  [ROLES.ADMIN]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_UPDATE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_MANAGE,
  ],

  [ROLES.MANAGER]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_UPDATE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
  ],

  [ROLES.CONSULTANT]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_UPDATE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_UPDATE,
  ],

  [ROLES.VIEWER]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
};

export function getRolePermissions(role: RoleName): PermissionKey[] {
  return ROLE_PERMISSION_MAP[role] ?? [];
}

export function hasPermission(
  user: UserWithRole,
  permission: PermissionKey,
): boolean {
  if (user.role === ROLES.SUPER_ADMIN) return true;
  const rolePermissions = getRolePermissions(user.role);
  const userPermissions = user.permissions ?? [];
  return rolePermissions.includes(permission) || userPermissions.includes(permission);
}

export function hasAllPermissions(
  user: UserWithRole,
  permissions: PermissionKey[],
): boolean {
  return permissions.every((permission) => hasPermission(user, permission));
}

export function hasAnyPermission(
  user: UserWithRole,
  permissions: PermissionKey[],
): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

export function hasRole(user: UserWithRole, role: RoleName): boolean {
  return user.role === role;
}

export function hasAnyRole(user: UserWithRole, roles: RoleName[]): boolean {
  return roles.includes(user.role);
}

export function isSuperAdmin(user: UserWithRole): boolean {
  return user.role === ROLES.SUPER_ADMIN;
}

export function isAdmin(user: UserWithRole): boolean {
  return user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN;
}

export function isManager(user: UserWithRole): boolean {
  return (
    user.role === ROLES.MANAGER ||
    user.role === ROLES.ADMIN ||
    user.role === ROLES.SUPER_ADMIN
  );
}

export function canViewProducts(user: UserWithRole): boolean {
  return hasPermission(user, PERMISSIONS.PRODUCTS_VIEW);
}

export function canManageProducts(user: UserWithRole): boolean {
  return hasAllPermissions(user, [
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_DELETE,
  ]);
}

export function canViewOrders(user: UserWithRole): boolean {
  return hasPermission(user, PERMISSIONS.ORDERS_VIEW);
}

export function canUpdateOrders(user: UserWithRole): boolean {
  return hasPermission(user, PERMISSIONS.ORDERS_UPDATE);
}

export function canViewAppointments(user: UserWithRole): boolean {
  return hasPermission(user, PERMISSIONS.APPOINTMENTS_VIEW);
}

export function canUpdateAppointments(user: UserWithRole): boolean {
  return hasPermission(user, PERMISSIONS.APPOINTMENTS_UPDATE);
}

export function canViewCustomers(user: UserWithRole): boolean {
  return hasPermission(user, PERMISSIONS.CUSTOMERS_VIEW);
}

export function canManageContent(user: UserWithRole): boolean {
  return hasAnyPermission(user, [
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.CONTENT_DELETE,
  ]);
}

export function canViewAnalytics(user: UserWithRole): boolean {
  return hasPermission(user, PERMISSIONS.ANALYTICS_VIEW);
}

export function canExportAnalytics(user: UserWithRole): boolean {
  return hasPermission(user, PERMISSIONS.ANALYTICS_EXPORT);
}

export function canManageUsers(user: UserWithRole): boolean {
  return hasPermission(user, PERMISSIONS.USERS_MANAGE);
}

export function canManageRoles(user: UserWithRole): boolean {
  return hasPermission(user, PERMISSIONS.ROLES_MANAGE);
}

export function canManageSettings(user: UserWithRole): boolean {
  return hasPermission(user, PERMISSIONS.SETTINGS_MANAGE);
}

export function getNavigationPermissions(user: UserWithRole): {
  analytics: boolean;
  products: boolean;
  orders: boolean;
  appointments: boolean;
  customers: boolean;
  content: boolean;
  notifications: boolean;
  auth: boolean;
  settings: boolean;
} {
  return {
    analytics: canViewAnalytics(user),
    products: canViewProducts(user),
    orders: canViewOrders(user),
    appointments: canViewAppointments(user),
    customers: canViewCustomers(user),
    content: hasPermission(user, PERMISSIONS.CONTENT_VIEW),
    notifications: hasPermission(user, PERMISSIONS.SETTINGS_VIEW),
    auth: hasPermission(user, PERMISSIONS.USERS_VIEW),
    settings: hasPermission(user, PERMISSIONS.SETTINGS_VIEW),
  };
}

export function filterAllowedRoutes(
  routes: { href: string; permission?: PermissionKey }[],
  user: UserWithRole,
): typeof routes {
  return routes.filter((route) =>
    route.permission ? hasPermission(user, route.permission) : true,
  );
}