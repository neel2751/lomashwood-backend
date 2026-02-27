
export interface RoleFixture {
  id: string;
  name: string;
  slug: string;
  description: string;
  permissions: string[];
  level: number;
  isActive: boolean;
  isSystem: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface PermissionFixture {
  id: string;
  code: string;
  resource: string;
  action: string;
  description: string;
  isActive: boolean;
}


export interface RolePermissionMapping {
  roleId: string;
  permissionId: string;
  grantedAt: Date;
  grantedBy: string;
}


export const productPermissions: PermissionFixture[] = [

  { id: 'perm_001', code: 'product:create', resource: 'product', action: 'create', description: 'Create new products', isActive: true },
  { id: 'perm_002', code: 'product:read', resource: 'product', action: 'read', description: 'View products', isActive: true },
  { id: 'perm_003', code: 'product:update', resource: 'product', action: 'update', description: 'Update products', isActive: true },
  { id: 'perm_004', code: 'product:delete', resource: 'product', action: 'delete', description: 'Delete products', isActive: true },
  { id: 'perm_005', code: 'product:publish', resource: 'product', action: 'publish', description: 'Publish/unpublish products', isActive: true },
  { id: 'perm_006', code: 'product:export', resource: 'product', action: 'export', description: 'Export product data', isActive: true },
  { id: 'perm_007', code: 'product:import', resource: 'product', action: 'import', description: 'Import product data', isActive: true },


  { id: 'perm_011', code: 'category:create', resource: 'category', action: 'create', description: 'Create categories', isActive: true },
  { id: 'perm_012', code: 'category:read', resource: 'category', action: 'read', description: 'View categories', isActive: true },
  { id: 'perm_013', code: 'category:update', resource: 'category', action: 'update', description: 'Update categories', isActive: true },
  { id: 'perm_014', code: 'category:delete', resource: 'category', action: 'delete', description: 'Delete categories', isActive: true },


  { id: 'perm_021', code: 'colour:create', resource: 'colour', action: 'create', description: 'Create colours', isActive: true },
  { id: 'perm_022', code: 'colour:read', resource: 'colour', action: 'read', description: 'View colours', isActive: true },
  { id: 'perm_023', code: 'colour:update', resource: 'colour', action: 'update', description: 'Update colours', isActive: true },
  { id: 'perm_024', code: 'colour:delete', resource: 'colour', action: 'delete', description: 'Delete colours', isActive: true },


  { id: 'perm_031', code: 'size:create', resource: 'size', action: 'create', description: 'Create sizes', isActive: true },
  { id: 'perm_032', code: 'size:read', resource: 'size', action: 'read', description: 'View sizes', isActive: true },
  { id: 'perm_033', code: 'size:update', resource: 'size', action: 'update', description: 'Update sizes', isActive: true },
  { id: 'perm_034', code: 'size:delete', resource: 'size', action: 'delete', description: 'Delete sizes', isActive: true },


  { id: 'perm_041', code: 'inventory:create', resource: 'inventory', action: 'create', description: 'Create inventory records', isActive: true },
  { id: 'perm_042', code: 'inventory:read', resource: 'inventory', action: 'read', description: 'View inventory', isActive: true },
  { id: 'perm_043', code: 'inventory:update', resource: 'inventory', action: 'update', description: 'Update inventory', isActive: true },
  { id: 'perm_044', code: 'inventory:delete', resource: 'inventory', action: 'delete', description: 'Delete inventory records', isActive: true },
  { id: 'perm_045', code: 'inventory:adjust', resource: 'inventory', action: 'adjust', description: 'Adjust inventory levels', isActive: true },
  { id: 'perm_046', code: 'inventory:audit', resource: 'inventory', action: 'audit', description: 'Audit inventory', isActive: true },

 
  { id: 'perm_051', code: 'pricing:create', resource: 'pricing', action: 'create', description: 'Create pricing rules', isActive: true },
  { id: 'perm_052', code: 'pricing:read', resource: 'pricing', action: 'read', description: 'View pricing', isActive: true },
  { id: 'perm_053', code: 'pricing:update', resource: 'pricing', action: 'update', description: 'Update pricing', isActive: true },
  { id: 'perm_054', code: 'pricing:delete', resource: 'pricing', action: 'delete', description: 'Delete pricing rules', isActive: true },
  { id: 'perm_055', code: 'pricing:discount', resource: 'pricing', action: 'discount', description: 'Manage discounts', isActive: true },
];


export const systemAdminRole: RoleFixture = {
  id: 'role_sys_admin_001',
  name: 'System Administrator',
  slug: 'system-administrator',
  description: 'Full administrative access to all product management features and system configuration',
  permissions: productPermissions.map(p => p.code),
  level: 100,
  isActive: true,
  isSystem: true,
  metadata: {
    canManageRoles: true,
    canManageUsers: true,
    canAccessAuditLogs: true,
    canConfigureSystem: true,
  },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  deletedAt: null,
};


export const productManagerRole: RoleFixture = {
  id: 'role_prod_mgr_001',
  name: 'Product Manager',
  slug: 'product-manager',
  description: 'Manages product catalog, categories, pricing, and inventory with full CRUD access',
  permissions: [
    'product:create',
    'product:read',
    'product:update',
    'product:delete',
    'product:publish',
    'product:export',
    'category:create',
    'category:read',
    'category:update',
    'colour:create',
    'colour:read',
    'colour:update',
    'size:create',
    'size:read',
    'size:update',
    'inventory:read',
    'inventory:update',
    'inventory:adjust',
    'pricing:create',
    'pricing:read',
    'pricing:update',
    'pricing:discount',
  ],
  level: 80,
  isActive: true,
  isSystem: false,
  metadata: {
    department: 'Product Management',
    canApproveProducts: true,
    maxDiscountPercent: 30,
  },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  deletedAt: null,
};


export const inventoryManagerRole: RoleFixture = {
  id: 'role_inv_mgr_001',
  name: 'Inventory Manager',
  slug: 'inventory-manager',
  description: 'Manages inventory levels, stock tracking, and warehouse operations',
  permissions: [
    'product:read',
    'category:read',
    'colour:read',
    'size:read',
    'inventory:create',
    'inventory:read',
    'inventory:update',
    'inventory:adjust',
    'inventory:audit',
    'pricing:read',
  ],
  level: 70,
  isActive: true,
  isSystem: false,
  metadata: {
    department: 'Warehouse',
    canAuditInventory: true,
    canInitiateStockTransfer: true,
  },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  deletedAt: null,
};


export const catalogCoordinatorRole: RoleFixture = {
  id: 'role_cat_coord_001',
  name: 'Catalog Coordinator',
  slug: 'catalog-coordinator',
  description: 'Coordinates product catalog, categories, attributes, and product information',
  permissions: [
    'product:create',
    'product:read',
    'product:update',
    'product:export',
    'category:create',
    'category:read',
    'category:update',
    'colour:create',
    'colour:read',
    'colour:update',
    'size:create',
    'size:read',
    'size:update',
    'inventory:read',
    'pricing:read',
  ],
  level: 60,
  isActive: true,
  isSystem: false,
  metadata: {
    department: 'Catalog Management',
    canManageCategories: true,
    canManageAttributes: true,
  },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  deletedAt: null,
};


export const salesStaffRole: RoleFixture = {
  id: 'role_sales_staff_001',
  name: 'Sales Staff',
  slug: 'sales-staff',
  description: 'Sales team members with product viewing and basic inventory checking',
  permissions: [
    'product:read',
    'category:read',
    'colour:read',
    'size:read',
    'inventory:read',
    'pricing:read',
  ],
  level: 40,
  isActive: true,
  isSystem: false,
  metadata: {
    department: 'Sales',
    canViewCost: false,
    canCheckStock: true,
  },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  deletedAt: null,
};


export const customerRole: RoleFixture = {
  id: 'role_customer_001',
  name: 'Customer',
  slug: 'customer',
  description: 'Registered customer with product browsing and pricing access',
  permissions: [
    'product:read',
    'category:read',
    'colour:read',
    'size:read',
    'pricing:read',
  ],
  level: 10,
  isActive: true,
  isSystem: true,
  metadata: {
    isExternal: true,
    canViewStock: false,
    canViewCost: false,
  },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  deletedAt: null,
};


export const guestRole: RoleFixture = {
  id: 'role_guest_001',
  name: 'Guest',
  slug: 'guest',
  description: 'Anonymous public access with limited product viewing',
  permissions: [
    'product:read',
    'category:read',
  ],
  level: 1,
  isActive: true,
  isSystem: true,
  metadata: {
    isAnonymous: true,
    rateLimitStrict: true,
  },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  deletedAt: null,
};


export const analystRole: RoleFixture = {
  id: 'role_analyst_001',
  name: 'Product Analyst',
  slug: 'product-analyst',
  description: 'Read-only access for data analysis and reporting',
  permissions: [
    'product:read',
    'product:export',
    'category:read',
    'colour:read',
    'size:read',
    'inventory:read',
    'pricing:read',
  ],
  level: 50,
  isActive: true,
  isSystem: false,
  metadata: {
    department: 'Analytics',
    canExportData: true,
    canViewReports: true,
  },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  deletedAt: null,
};


export const inactiveRole: RoleFixture = {
  id: 'role_inactive_001',
  name: 'Inactive Test Role',
  slug: 'inactive-test-role',
  description: 'Deactivated role for testing authorization rejection',
  permissions: ['product:read'],
  level: 0,
  isActive: false,
  isSystem: false,
  metadata: {
    testOnly: true,
  },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  deletedAt: null,
};


export const deletedRole: RoleFixture = {
  id: 'role_deleted_001',
  name: 'Deleted Test Role',
  slug: 'deleted-test-role',
  description: 'Soft-deleted role for testing',
  permissions: [],
  level: 0,
  isActive: false,
  isSystem: false,
  metadata: {
    testOnly: true,
  },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  deletedAt: new Date('2024-06-01T00:00:00.000Z'),
};


export const allRoles: RoleFixture[] = [
  systemAdminRole,
  productManagerRole,
  inventoryManagerRole,
  catalogCoordinatorRole,
  salesStaffRole,
  customerRole,
  guestRole,
  analystRole,
  inactiveRole,
  deletedRole,
];


export const activeRoles: RoleFixture[] = allRoles.filter(
  (role) => role.isActive && !role.deletedAt
);


export const systemRoles: RoleFixture[] = allRoles.filter(
  (role) => role.isSystem
);


export const customRoles: RoleFixture[] = allRoles.filter(
  (role) => !role.isSystem
);


export const getRoleById = (id: string): RoleFixture | undefined => {
  return allRoles.find((role) => role.id === id);
};


export const getRoleBySlug = (slug: string): RoleFixture | undefined => {
  return allRoles.find((role) => role.slug === slug);
};


export const getRoleByName = (name: string): RoleFixture | undefined => {
  return allRoles.find((role) => role.name === name);
};


export const hasPermission = (
  roleId: string,
  permission: string
): boolean => {
  const role = getRoleById(roleId);
  if (!role || !role.isActive || role.deletedAt) {
    return false;
  }
  return role.permissions.includes(permission);
};


export const hasAnyPermission = (
  roleId: string,
  permissions: string[]
): boolean => {
  const role = getRoleById(roleId);
  if (!role || !role.isActive || role.deletedAt) {
    return false;
  }
  return permissions.some((perm) => role.permissions.includes(perm));
};

export const hasAllPermissions = (
  roleId: string,
  permissions: string[]
): boolean => {
  const role = getRoleById(roleId);
  if (!role || !role.isActive || role.deletedAt) {
    return false;
  }
  return permissions.every((perm) => role.permissions.includes(perm));
};


export const getRolesByPermission = (permission: string): RoleFixture[] => {
  return activeRoles.filter((role) =>
    role.permissions.includes(permission)
  );
};


export const getRolesByLevelRange = (
  minLevel: number,
  maxLevel: number
): RoleFixture[] => {
  return activeRoles.filter(
    (role) => role.level >= minLevel && role.level <= maxLevel
  );
};


export const createRolePayload = (
  overrides?: Partial<Omit<RoleFixture, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>
) => ({
  name: 'Test Role',
  slug: 'test-role',
  description: 'Test role for unit testing',
  permissions: ['product:read'],
  level: 50,
  isActive: true,
  isSystem: false,
  metadata: {},
  ...overrides,
});

export const updateRolePayload = (
  overrides?: Partial<Pick<RoleFixture, 'name' | 'description' | 'permissions' | 'isActive' | 'metadata'>>
) => ({
  description: 'Updated test role description',
  permissions: ['product:read', 'product:update'],
  isActive: true,
  ...overrides,
});


export const mockRole = (overrides?: Partial<RoleFixture>): RoleFixture => ({
  id: `role_mock_${Date.now()}`,
  name: 'Mock Role',
  slug: 'mock-role',
  description: 'Mock role for testing',
  permissions: ['product:read'],
  level: 50,
  isActive: true,
  isSystem: false,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});


export default {
  
  allRoles,
  activeRoles,
  systemRoles,
  customRoles,
  

  systemAdminRole,
  productManagerRole,
  inventoryManagerRole,
  catalogCoordinatorRole,
  salesStaffRole,
  customerRole,
  guestRole,
  analystRole,
  inactiveRole,
  deletedRole,
  

  productPermissions,
  
  
  getRoleById,
  getRoleBySlug,
  getRoleByName,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolesByPermission,
  getRolesByLevelRange,
  
  
  createRolePayload,
  updateRolePayload,
  mockRole,
};