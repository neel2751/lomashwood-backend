import { PERMISSIONS, ROLES } from "@/lib/constants";
import type { PermissionKey, RoleName } from "@/lib/constants";

export type PermissionGroup = {
  label: string;
  description: string;
  permissions: {
    key: PermissionKey;
    label: string;
    description: string;
  }[];
};

export const permissionGroups: PermissionGroup[] = [
  {
    label: "Products",
    description: "Manage the product catalogue including categories, colours, sizes, inventory and pricing.",
    permissions: [
      {
        key: PERMISSIONS.PRODUCTS_VIEW,
        label: "View Products",
        description: "Browse and search all products, categories, colours, sizes, inventory and pricing.",
      },
      {
        key: PERMISSIONS.PRODUCTS_CREATE,
        label: "Create Products",
        description: "Add new products, categories, colours, sizes, and pricing rules.",
      },
      {
        key: PERMISSIONS.PRODUCTS_UPDATE,
        label: "Update Products",
        description: "Edit existing products and all associated catalogue data.",
      },
      {
        key: PERMISSIONS.PRODUCTS_DELETE,
        label: "Delete Products",
        description: "Permanently remove products and catalogue entries.",
      },
    ],
  },
  {
    label: "Orders",
    description: "Manage customer orders, payments, invoices and refunds.",
    permissions: [
      {
        key: PERMISSIONS.ORDERS_VIEW,
        label: "View Orders",
        description: "Access all orders, payments, invoices and refund records.",
      },
      {
        key: PERMISSIONS.ORDERS_UPDATE,
        label: "Update Orders",
        description: "Update order statuses, process refunds and manage invoices.",
      },
    ],
  },
  {
    label: "Appointments",
    description: "Manage consultation bookings, consultant availability and reminders.",
    permissions: [
      {
        key: PERMISSIONS.APPOINTMENTS_VIEW,
        label: "View Appointments",
        description: "View all bookings, consultant profiles and reminder logs.",
      },
      {
        key: PERMISSIONS.APPOINTMENTS_UPDATE,
        label: "Manage Appointments",
        description: "Reschedule, cancel, and update bookings and consultant availability.",
      },
    ],
  },
  {
    label: "Customers",
    description: "Access and manage customer accounts, reviews, support tickets and loyalty.",
    permissions: [
      {
        key: PERMISSIONS.CUSTOMERS_VIEW,
        label: "View Customers",
        description: "Browse customer accounts, reviews, support tickets and loyalty data.",
      },
      {
        key: PERMISSIONS.CUSTOMERS_UPDATE,
        label: "Update Customers",
        description: "Edit customer details, moderate reviews, resolve tickets and adjust loyalty points.",
      },
    ],
  },
  {
    label: "Content",
    description: "Manage website content including blogs, media, CMS pages, SEO and landing pages.",
    permissions: [
      {
        key: PERMISSIONS.CONTENT_VIEW,
        label: "View Content",
        description: "Read access to blogs, media wall, CMS pages, SEO metadata and landing pages.",
      },
      {
        key: PERMISSIONS.CONTENT_CREATE,
        label: "Create Content",
        description: "Create new blog posts, media entries, CMS pages and landing pages.",
      },
      {
        key: PERMISSIONS.CONTENT_UPDATE,
        label: "Update Content",
        description: "Edit and publish existing content and update SEO metadata.",
      },
      {
        key: PERMISSIONS.CONTENT_DELETE,
        label: "Delete Content",
        description: "Permanently remove content entries.",
      },
    ],
  },
  {
    label: "Analytics",
    description: "Access performance dashboards, funnels, tracking data and exports.",
    permissions: [
      {
        key: PERMISSIONS.ANALYTICS_VIEW,
        label: "View Analytics",
        description: "Access overview metrics, funnels, dashboards and tracking events.",
      },
      {
        key: PERMISSIONS.ANALYTICS_EXPORT,
        label: "Export Analytics",
        description: "Download analytics reports in CSV, XLSX or JSON format.",
      },
    ],
  },
  {
    label: "User Management",
    description: "Manage admin user accounts and active sessions.",
    permissions: [
      {
        key: PERMISSIONS.USERS_VIEW,
        label: "View Users",
        description: "Browse admin user accounts and active session records.",
      },
      {
        key: PERMISSIONS.USERS_MANAGE,
        label: "Manage Users",
        description: "Create, update, deactivate admin users and revoke sessions.",
      },
    ],
  },
  {
    label: "Roles",
    description: "Define and assign role-based access control configurations.",
    permissions: [
      {
        key: PERMISSIONS.ROLES_MANAGE,
        label: "Manage Roles",
        description: "Create and update roles and their associated permission sets.",
      },
    ],
  },
  {
    label: "Settings",
    description: "Access and configure system-wide admin settings.",
    permissions: [
      {
        key: PERMISSIONS.SETTINGS_VIEW,
        label: "View Settings",
        description: "Read access to general settings, integrations and audit logs.",
      },
      {
        key: PERMISSIONS.SETTINGS_MANAGE,
        label: "Manage Settings",
        description: "Update general, security, and integration settings.",
      },
    ],
  },
];

export const rolePermissionMatrix: Record<RoleName, PermissionKey[]> = {
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

export const roleLabels: Record<RoleName, string> = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.ADMIN]: "Admin",
  [ROLES.MANAGER]: "Manager",
  [ROLES.CONSULTANT]: "Consultant",
  [ROLES.VIEWER]: "Viewer",
};

export const roleDescriptions: Record<RoleName, string> = {
  [ROLES.SUPER_ADMIN]: "Full unrestricted access to all features and settings.",
  [ROLES.ADMIN]: "Full access to all operational features and user management.",
  [ROLES.MANAGER]: "Access to daily operations: products, orders, appointments, content and analytics.",
  [ROLES.CONSULTANT]: "Access to view products and manage their own appointments and customers.",
  [ROLES.VIEWER]: "Read-only access to products, orders, appointments, customers and analytics.",
};

export const allRoles: RoleName[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.CONSULTANT,
  ROLES.VIEWER,
];

export const assignableRoles: RoleName[] = [
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.CONSULTANT,
  ROLES.VIEWER,
];

export function getPermissionLabel(key: PermissionKey): string {
  for (const group of permissionGroups) {
    const match = group.permissions.find((p) => p.key === key);
    if (match) return match.label;
  }
  return key;
}

export function getPermissionDescription(key: PermissionKey): string {
  for (const group of permissionGroups) {
    const match = group.permissions.find((p) => p.key === key);
    if (match) return match.description;
  }
  return "";
}

export function getPermissionGroupLabel(key: PermissionKey): string {
  for (const group of permissionGroups) {
    if (group.permissions.some((p) => p.key === key)) return group.label;
  }
  return "Other";
}

export function getRolePermissions(role: RoleName): PermissionKey[] {
  return rolePermissionMatrix[role] ?? [];
}

export function roleHasPermission(role: RoleName, permission: PermissionKey): boolean {
  return rolePermissionMatrix[role]?.includes(permission) ?? false;
}

export function buildPermissionsMatrixData(): {
  permissions: PermissionKey[];
  roles: RoleName[];
  matrix: Record<PermissionKey, Record<RoleName, boolean>>;
} {
  const permissions = Object.values(PERMISSIONS) as PermissionKey[];
  const roles = allRoles;
  const matrix = {} as Record<PermissionKey, Record<RoleName, boolean>>;

  for (const permission of permissions) {
    matrix[permission] = {} as Record<RoleName, boolean>;
    for (const role of roles) {
      matrix[permission][role] = roleHasPermission(role, permission);
    }
  }

  return { permissions, roles, matrix };
}