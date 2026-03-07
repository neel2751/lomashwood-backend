import { PrismaClient } from '@prisma/client';
import { SecurityUtils } from '@/utils/security';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://cd5f5b67fa0e94337c209109319754f47937df0a9bf4d378bd6894bbe9329e70:sk_FlIyNYA_kzbTmmxAf7SQp@db.prisma.io:5432/postgres?sslmode=require"
    }
  }
});

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Test database connection first
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Create permissions
    console.log('Creating permissions...');
    const permissions = [
      // User management
      { name: 'users_read', displayName: 'Read Users', description: 'View user information', resource: 'users', action: 'read' },
      { name: 'users_write', displayName: 'Write Users', description: 'Create and update users', resource: 'users', action: 'write' },
      { name: 'users_delete', displayName: 'Delete Users', description: 'Delete users', resource: 'users', action: 'delete' },
      
      // Role management
      { name: 'roles_read', displayName: 'Read Roles', description: 'View role information', resource: 'roles', action: 'read' },
      { name: 'roles_write', displayName: 'Write Roles', description: 'Create and update roles', resource: 'roles', action: 'write' },
      { name: 'roles_delete', displayName: 'Delete Roles', description: 'Delete roles', resource: 'roles', action: 'delete' },
      
      // Product management
      { name: 'products_read', displayName: 'Read Products', description: 'View product information', resource: 'products', action: 'read' },
      { name: 'products_write', displayName: 'Write Products', description: 'Create and update products', resource: 'products', action: 'write' },
      { name: 'products_delete', displayName: 'Delete Products', description: 'Delete products', resource: 'products', action: 'delete' },
      
      // Order management
      { name: 'orders_read', displayName: 'Read Orders', description: 'View order information', resource: 'orders', action: 'read' },
      { name: 'orders_write', displayName: 'Write Orders', description: 'Create and update orders', resource: 'orders', action: 'write' },
      { name: 'orders_delete', displayName: 'Delete Orders', description: 'Delete orders', resource: 'orders', action: 'delete' },
      
      // Customer management
      { name: 'customers_read', displayName: 'Read Customers', description: 'View customer information', resource: 'customers', action: 'read' },
      { name: 'customers_write', displayName: 'Write Customers', description: 'Create and update customers', resource: 'customers', action: 'write' },
      { name: 'customers_delete', displayName: 'Delete Customers', description: 'Delete customers', resource: 'customers', action: 'delete' },
      
      // Analytics
      { name: 'analytics_read', displayName: 'Read Analytics', description: 'View analytics data', resource: 'analytics', action: 'read' },
      
      // Content management
      { name: 'content_read', displayName: 'Read Content', description: 'View content', resource: 'content', action: 'read' },
      { name: 'content_write', displayName: 'Write Content', description: 'Create and update content', resource: 'content', action: 'write' },
      { name: 'content_delete', displayName: 'Delete Content', description: 'Delete content', resource: 'content', action: 'delete' },
      
      // System settings
      { name: 'settings_read', displayName: 'Read Settings', description: 'View system settings', resource: 'settings', action: 'read' },
      { name: 'settings_write', displayName: 'Write Settings', description: 'Update system settings', resource: 'settings', action: 'write' },
      
      // Admin permissions
      { name: 'admin', displayName: 'Administrator', description: 'Full system access', resource: 'system', action: 'admin' }
    ];

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: permission,
        create: permission
      });
    }

    console.log('✅ Permissions created successfully');

    // Create roles
    console.log('Creating roles...');
    const roles = [
      {
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full system access with all permissions',
        permissions: ['admin']
      },
      {
        name: 'manager',
        displayName: 'Manager',
        description: 'Department management with oversight capabilities',
        permissions: [
          'users_read', 'users_write',
          'roles_read',
          'products_read', 'products_write',
          'orders_read', 'orders_write',
          'customers_read', 'customers_write',
          'analytics_read',
          'content_read', 'content_write'
        ]
      },
      {
        name: 'supervisor',
        displayName: 'Supervisor',
        description: 'Team oversight with limited management capabilities',
        permissions: [
          'users_read',
          'products_read', 'products_write',
          'orders_read', 'orders_write',
          'customers_read',
          'analytics_read'
        ]
      },
      {
        name: 'operator',
        displayName: 'Operator',
        description: 'Daily operations with basic access',
        permissions: [
          'products_read',
          'orders_read', 'orders_write',
          'customers_read',
          'analytics_read'
        ]
      },
      {
        name: 'viewer',
        displayName: 'Viewer',
        description: 'Read-only access for reporting and monitoring',
        permissions: [
          'products_read',
          'orders_read',
          'customers_read',
          'analytics_read',
          'content_read'
        ]
      }
    ];

    for (const roleData of roles) {
      const { permissions: rolePermissions, ...roleInfo } = roleData;
      
      const role = await prisma.role.upsert({
        where: { name: roleInfo.name },
        update: roleInfo,
        create: roleInfo
      });

      // Assign permissions to role
      for (const permissionName of rolePermissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
        });

        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id
              }
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
        }
      }
    }

    console.log('✅ Roles created successfully');

    // Create default admin user
    console.log('Creating default admin user...');
    const adminPassword = await SecurityUtils.hashPassword('Admin123!@#');
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@lomashwood.com' },
      update: {
        passwordHash: adminPassword,
        isActive: true,
        isEmailVerified: true
      },
      create: {
        email: 'admin@lomashwood.com',
        username: 'admin',
        passwordHash: adminPassword,
        firstName: 'System',
        lastName: 'Administrator',
        isActive: true,
        isEmailVerified: true
      }
    });

    // Assign admin role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' }
    });

    if (adminRole) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: adminUser.id,
            roleId: adminRole.id
          }
        },
        update: {},
        create: {
          userId: adminUser.id,
          roleId: adminRole.id
        }
      });
    }

    console.log('✅ Default admin user created successfully');
    console.log('📧 Email: admin@lomashwood.com');
    console.log('🔑 Password: Admin123!@#');

    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seed()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seed };
