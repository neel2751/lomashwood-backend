import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient({
  log: [
    { level: 'warn',  emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
  ],
});

const UserStatus = {
  ACTIVE:    'ACTIVE',
  INACTIVE:  'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

const AuthProvider = {
  EMAIL:  'EMAIL',
  GOOGLE: 'GOOGLE',
  GITHUB: 'GITHUB',
} as const;
type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

const RoleType = {
  SYSTEM: 'SYSTEM',
  CUSTOM: 'CUSTOM',
} as const;
type RoleType = (typeof RoleType)[keyof typeof RoleType];

const db = prisma as any;

const isProduction = process.env['NODE_ENV'] === 'production';
const BCRYPT_ROUNDS = isProduction ? 12 : 10;

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function log(msg: string): void {
  console.warn(`[seed] ${msg}`);
}

interface PermissionDef {
  resource: string;
  action: string;
  description: string;
}

interface RoleDef {
  name: string;
  description: string;
  type: RoleType;
  isDefault: boolean;
  permissions: string[];
}

interface UserDef {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  isSuperAdmin: boolean;
  status: UserStatus;
}

const PERMISSION_DEFINITIONS: PermissionDef[] = [
  { resource: 'users',        action: 'create',       description: 'Create a new user account' },
  { resource: 'users',        action: 'read',         description: 'View user details' },
  { resource: 'users',        action: 'read:own',     description: 'View own user details' },
  { resource: 'users',        action: 'update',       description: 'Update any user account' },
  { resource: 'users',        action: 'update:own',   description: 'Update own user account' },
  { resource: 'users',        action: 'delete',       description: 'Soft-delete a user account' },
  { resource: 'users',        action: 'restore',      description: 'Restore a soft-deleted user' },
  { resource: 'users',        action: 'list',         description: 'List all users with pagination' },
  { resource: 'users',        action: 'impersonate',  description: 'Impersonate another user' },
  { resource: 'users',        action: 'export',       description: 'Export user data (GDPR)' },
  { resource: 'users',        action: 'suspend',      description: 'Suspend a user account' },

  { resource: 'roles',        action: 'create',       description: 'Create a custom role' },
  { resource: 'roles',        action: 'read',         description: 'View role details' },
  { resource: 'roles',        action: 'update',       description: 'Update a role' },
  { resource: 'roles',        action: 'delete',       description: 'Delete a custom role' },
  { resource: 'roles',        action: 'list',         description: 'List all roles' },
  { resource: 'roles',        action: 'assign',       description: 'Assign a role to a user' },
  { resource: 'roles',        action: 'revoke',       description: 'Revoke a role from a user' },

  { resource: 'permissions',  action: 'read',         description: 'View permission list' },
  { resource: 'permissions',  action: 'assign',       description: 'Assign permission to a role' },
  { resource: 'permissions',  action: 'revoke',       description: 'Revoke permission from a role' },

  { resource: 'sessions',     action: 'read:own',     description: 'View own active sessions' },
  { resource: 'sessions',     action: 'revoke:own',   description: 'Revoke own sessions' },
  { resource: 'sessions',     action: 'read',         description: 'View any user session (admin)' },
  { resource: 'sessions',     action: 'revoke',       description: 'Revoke any session (admin)' },

  { resource: 'products',     action: 'create',       description: 'Create a product' },
  { resource: 'products',     action: 'read',         description: 'View product details' },
  { resource: 'products',     action: 'update',       description: 'Update a product' },
  { resource: 'products',     action: 'delete',       description: 'Delete a product' },
  { resource: 'products',     action: 'list',         description: 'List all products' },
  { resource: 'products',     action: 'publish',      description: 'Publish a product' },
  { resource: 'products',     action: 'unpublish',    description: 'Unpublish a product' },

  { resource: 'categories',   action: 'create',       description: 'Create a category' },
  { resource: 'categories',   action: 'read',         description: 'View category details' },
  { resource: 'categories',   action: 'update',       description: 'Update a category' },
  { resource: 'categories',   action: 'delete',       description: 'Delete a category' },
  { resource: 'categories',   action: 'list',         description: 'List all categories' },

  { resource: 'orders',       action: 'create',       description: 'Place an order' },
  { resource: 'orders',       action: 'read',         description: 'View any order (admin)' },
  { resource: 'orders',       action: 'read:own',     description: 'View own orders' },
  { resource: 'orders',       action: 'update',       description: 'Update order status (admin)' },
  { resource: 'orders',       action: 'cancel',       description: 'Cancel an order' },
  { resource: 'orders',       action: 'cancel:own',   description: 'Cancel own order' },
  { resource: 'orders',       action: 'list',         description: 'List all orders (admin)' },
  { resource: 'orders',       action: 'refund',       description: 'Issue a refund' },
  { resource: 'orders',       action: 'export',       description: 'Export orders report' },

  { resource: 'payments',     action: 'create',       description: 'Initiate a payment' },
  { resource: 'payments',     action: 'read',         description: 'View payment details (admin)' },
  { resource: 'payments',     action: 'read:own',     description: 'View own payment details' },
  { resource: 'payments',     action: 'refund',       description: 'Process a refund (admin)' },
  { resource: 'payments',     action: 'list',         description: 'List all payments (admin)' },

  { resource: 'appointments', action: 'create',       description: 'Book an appointment' },
  { resource: 'appointments', action: 'read',         description: 'View any appointment (admin)' },
  { resource: 'appointments', action: 'read:own',     description: 'View own appointments' },
  { resource: 'appointments', action: 'update',       description: 'Update any appointment (admin)' },
  { resource: 'appointments', action: 'cancel',       description: 'Cancel any appointment (admin)' },
  { resource: 'appointments', action: 'cancel:own',   description: 'Cancel own appointment' },
  { resource: 'appointments', action: 'list',         description: 'List all appointments (admin)' },

  { resource: 'content',      action: 'create',       description: 'Create CMS content' },
  { resource: 'content',      action: 'read',         description: 'View CMS content' },
  { resource: 'content',      action: 'update',       description: 'Update CMS content' },
  { resource: 'content',      action: 'delete',       description: 'Delete CMS content' },
  { resource: 'content',      action: 'publish',      description: 'Publish content' },
  { resource: 'content',      action: 'list',         description: 'List CMS content' },

  { resource: 'blog',         action: 'create',       description: 'Create a blog post' },
  { resource: 'blog',         action: 'read',         description: 'View blog posts' },
  { resource: 'blog',         action: 'update',       description: 'Update a blog post' },
  { resource: 'blog',         action: 'delete',       description: 'Delete a blog post' },
  { resource: 'blog',         action: 'publish',      description: 'Publish a blog post' },

  { resource: 'media',        action: 'upload',       description: 'Upload media files' },
  { resource: 'media',        action: 'read',         description: 'View media files' },
  { resource: 'media',        action: 'delete',       description: 'Delete media files' },
  { resource: 'media',        action: 'list',         description: 'List all media files' },

  { resource: 'showrooms',    action: 'create',       description: 'Create a showroom' },
  { resource: 'showrooms',    action: 'read',         description: 'View showroom details' },
  { resource: 'showrooms',    action: 'update',       description: 'Update a showroom' },
  { resource: 'showrooms',    action: 'delete',       description: 'Delete a showroom' },
  { resource: 'showrooms',    action: 'list',         description: 'List all showrooms' },

  { resource: 'customers',    action: 'read',         description: 'View customer profiles (admin)' },
  { resource: 'customers',    action: 'update',       description: 'Update customer data (admin)' },
  { resource: 'customers',    action: 'delete',       description: 'Delete customer account (admin)' },
  { resource: 'customers',    action: 'list',         description: 'List all customers (admin)' },
  { resource: 'customers',    action: 'export',       description: 'Export customer data (GDPR)' },

  { resource: 'reviews',      action: 'create',       description: 'Submit a product review' },
  { resource: 'reviews',      action: 'read',         description: 'View reviews' },
  { resource: 'reviews',      action: 'update',       description: 'Edit any review (admin)' },
  { resource: 'reviews',      action: 'delete',       description: 'Delete any review (admin)' },
  { resource: 'reviews',      action: 'moderate',     description: 'Approve or reject reviews' },

  { resource: 'analytics',    action: 'read',         description: 'View analytics dashboards' },
  { resource: 'analytics',    action: 'export',       description: 'Export analytics data' },

  { resource: 'notifications',action: 'send',         description: 'Send notifications (admin)' },
  { resource: 'notifications',action: 'read',         description: 'View notification logs' },

  { resource: 'brochures',    action: 'request',      description: 'Request a brochure' },
  { resource: 'brochures',    action: 'list',         description: 'View brochure requests (admin)' },

  { resource: 'newsletter',   action: 'subscribe',    description: 'Subscribe to newsletter' },
  { resource: 'newsletter',   action: 'manage',       description: 'Manage newsletter subscribers' },

  { resource: 'audit-logs',   action: 'read',         description: 'View audit logs' },
  { resource: 'audit-logs',   action: 'export',       description: 'Export audit logs' },
];

const ROLE_DEFINITIONS: RoleDef[] = [
  {
    name: 'Super Admin',
    description: 'Full unrestricted access to all resources and system functions.',
    type: RoleType.SYSTEM,
    isDefault: false,
    permissions: PERMISSION_DEFINITIONS.map((p) => `${p.resource}:${p.action}`),
  },
  {
    name: 'Admin',
    description: 'Full CMS and operational access. Cannot manage system roles or impersonate.',
    type: RoleType.SYSTEM,
    isDefault: false,
    permissions: PERMISSION_DEFINITIONS
      .filter((p) => p.action !== 'impersonate' && p.resource !== 'audit-logs')
      .map((p) => `${p.resource}:${p.action}`),
  },
  {
    name: 'Staff',
    description: 'Operational staff — can manage appointments, orders, and CMS content.',
    type: RoleType.SYSTEM,
    isDefault: false,
    permissions: [
      'products:read', 'products:list', 'products:create', 'products:update',
      'categories:read', 'categories:list', 'categories:create', 'categories:update',
      'orders:read', 'orders:list', 'orders:update', 'orders:export',
      'payments:read', 'payments:list',
      'appointments:read', 'appointments:list', 'appointments:update', 'appointments:cancel',
      'content:read', 'content:list', 'content:create', 'content:update', 'content:publish',
      'blog:read', 'blog:create', 'blog:update', 'blog:publish',
      'media:upload', 'media:read', 'media:list',
      'showrooms:read', 'showrooms:list', 'showrooms:create', 'showrooms:update',
      'customers:read', 'customers:list',
      'reviews:read', 'reviews:moderate',
      'brochures:list',
      'newsletter:manage',
      'sessions:read:own', 'sessions:revoke:own',
      'users:read:own', 'users:update:own',
    ],
  },
  {
    name: 'Customer',
    description: 'Authenticated customer — can manage own account, book appointments, and place orders.',
    type: RoleType.SYSTEM,
    isDefault: true,
    permissions: [
      'users:read:own', 'users:update:own',
      'sessions:read:own', 'sessions:revoke:own',
      'orders:create', 'orders:read:own', 'orders:cancel:own',
      'payments:create', 'payments:read:own',
      'appointments:create', 'appointments:read:own', 'appointments:cancel:own',
      'products:read', 'products:list',
      'categories:read', 'categories:list',
      'showrooms:read', 'showrooms:list',
      'reviews:create', 'reviews:read',
      'brochures:request',
      'newsletter:subscribe',
      'content:read', 'blog:read', 'media:read',
    ],
  },
];

function getDemoUsers(): UserDef[] {
  return [
    {
      email: process.env['SEED_ADMIN_EMAIL'] ?? 'admin@lomashwood.co.uk',
      firstName: process.env['SEED_ADMIN_FIRST_NAME'] ?? 'Super',
      lastName: process.env['SEED_ADMIN_LAST_NAME'] ?? 'Admin',
      password: process.env['SEED_ADMIN_PASSWORD'] ?? randomBytes(16).toString('hex'),
      role: 'Super Admin',
      isSuperAdmin: true,
      status: UserStatus.ACTIVE,
    },
    ...(!isProduction
      ? [
          {
            email: 'staff@lomashwood.co.uk',
            firstName: 'Staff',
            lastName: 'Demo',
            password: 'Staff@Demo123!',
            role: 'Staff',
            isSuperAdmin: false,
            status: UserStatus.ACTIVE,
          },
          {
            email: 'customer@lomashwood.co.uk',
            firstName: 'Customer',
            lastName: 'Demo',
            password: 'Customer@Demo123!',
            role: 'Customer',
            isSuperAdmin: false,
            status: UserStatus.ACTIVE,
          },
        ]
      : []),
  ];
}

async function seedPermissions(): Promise<Map<string, string>> {
  log('Seeding permissions...');

  const permissionIdMap = new Map<string, string>();

  for (const def of PERMISSION_DEFINITIONS) {
    const name = `${def.resource}:${def.action}`;

    const permission = await db.permission.upsert({
      where: { name },
      update: {
        description: def.description,
        isActive: true,
      },
      create: {
        name,
        resource: def.resource,
        action: def.action,
        description: def.description,
        isActive: true,
      },
    });

    permissionIdMap.set(name, permission.id);
  }

  log(`  ✓ ${PERMISSION_DEFINITIONS.length} permissions upserted.`);
  return permissionIdMap;
}

async function seedRoles(
  permissionIdMap: Map<string, string>,
): Promise<Map<string, string>> {
  log('Seeding roles...');

  const roleIdMap = new Map<string, string>();

  for (const def of ROLE_DEFINITIONS) {
    const role = await db.role.upsert({
      where: { name: def.name },
      update: {
        description: def.description,
        isDefault: def.isDefault,
        isActive: true,
        deletedAt: null,
      },
      create: {
        name: def.name,
        description: def.description,
        isDefault: def.isDefault,
        isActive: true,
      },
    });

    roleIdMap.set(def.name, role.id);

    const desiredPermissionIds = def.permissions
      .map((p) => permissionIdMap.get(p))
      .filter((id): id is string => id !== undefined);

    await db.rolePermission.deleteMany({
      where: {
        roleId: role.id,
        permissionId: { notIn: desiredPermissionIds },
      },
    });

    const existing: Array<{ permissionId: string }> = await db.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permissionId: true },
    });

    const existingIds = new Set(existing.map((rp) => rp.permissionId));
    const toCreate = desiredPermissionIds.filter((id) => !existingIds.has(id));

    if (toCreate.length > 0) {
      await db.rolePermission.createMany({
        data: toCreate.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }

    log(`  ✓ Role "${def.name}" — ${desiredPermissionIds.length} permissions.`);
  }

  return roleIdMap;
}

async function seedUsers(roleIdMap: Map<string, string>): Promise<void> {
  log('Seeding users...');

  const users = getDemoUsers();

  for (const def of users) {
    const hashedPassword = await hashPassword(def.password);
    const roleId = roleIdMap.get(def.role);

    if (roleId === undefined) {
      throw new Error(`[seed] Role "${def.role}" not found in roleIdMap.`);
    }

    const user = await db.user.upsert({
      where: { email: def.email },
      update: {
        firstName: def.firstName,
        lastName: def.lastName,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        isSuperAdmin: def.isSuperAdmin,
        deletedAt: null,
      },
      create: {
        email: def.email,
        firstName: def.firstName,
        lastName: def.lastName,
        password: hashedPassword,     
        authProvider: AuthProvider.EMAIL, 
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        isSuperAdmin: def.isSuperAdmin,
      },
    });

    await db.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId,
        assignedBy: 'system-seed',
      },
    });

    log(`  ✓ User "${def.email}" → role "${def.role}".`);

    if (def.isSuperAdmin && process.env['SEED_ADMIN_PASSWORD'] === undefined) {
      console.warn(
        `[seed] ⚠  SEED_ADMIN_PASSWORD not set. ` +
        `Superadmin "${def.email}" created with a random password — reset immediately.`,
      );
    }
  }
}

async function main(): Promise<void> {
  log('='.repeat(60));
  log(`Starting seed  [env: ${process.env['NODE_ENV'] ?? 'development'}]`);
  log('='.repeat(60));

  const permissionIdMap = await seedPermissions();
  const roleIdMap       = await seedRoles(permissionIdMap);
  await seedUsers(roleIdMap);

  log('='.repeat(60));
  log('Seed completed successfully.');
  log('='.repeat(60));
}

main()
  .catch((err: unknown) => {
    console.error('[seed] Fatal error:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });