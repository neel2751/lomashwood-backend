import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { asyncHandler, createError } from '@/middleware/errorHandler';
import { roleCreationSchema, permissionCreationSchema } from '@/utils/validation';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all roles
router.get('/', 
  authenticate, 
  authorize(['roles_read', 'admin']), 
  asyncHandler(async (req, res) => {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: { roles }
    });
  })
);

// Create role
router.post('/', 
  authenticate, 
  authorize(['roles_write', 'admin']), 
  asyncHandler(async (req, res) => {
    const { error, value } = roleCreationSchema.validate(req.body);
    
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const { name, displayName, description, permissions } = value;

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name }
    });

    if (existingRole) {
      throw createError('Role with this name already exists', 409);
    }

    const role = await prisma.role.create({
      data: {
        name,
        displayName,
        description
      }
    });

    // Assign permissions if provided
    if (permissions && permissions.length > 0) {
      for (const permissionName of permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
        });

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: { role }
    });
  })
);

// Update role
router.put('/:id', 
  authenticate, 
  authorize(['roles_write', 'admin']), 
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { displayName, description, permissions } = req.body;

    // Update role basic info
    const role = await prisma.role.update({
      where: { id },
      data: {
        displayName,
        description
      }
    });

    // Update permissions if provided
    if (permissions !== undefined) {
      // Remove existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: id }
      });

      // Add new permissions
      for (const permissionName of permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
        });

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: id,
              permissionId: permission.id
            }
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: { role }
    });
  })
);

// Delete role
router.delete('/:id', 
  authenticate, 
  authorize(['roles_delete', 'admin']), 
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if role is assigned to any users
    const userRoles = await prisma.userRole.findMany({
      where: { roleId: id }
    });

    if (userRoles.length > 0) {
      throw createError('Cannot delete role that is assigned to users', 400);
    }

    await prisma.role.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  })
);

// Get all permissions
router.get('/permissions/all', 
  authenticate, 
  authorize(['roles_read', 'admin']), 
  asyncHandler(async (req, res) => {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }]
    });

    res.json({
      success: true,
      data: { permissions }
    });
  })
);

// Create permission
router.post('/permissions', 
  authenticate, 
  authorize(['roles_write', 'admin']), 
  asyncHandler(async (req, res) => {
    const { error, value } = permissionCreationSchema.validate(req.body);
    
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const { name, displayName, description, resource, action } = value;

    // Check if permission already exists
    const existingPermission = await prisma.permission.findFirst({
      where: { resource, action }
    });

    if (existingPermission) {
      throw createError('Permission with this resource and action already exists', 409);
    }

    const permission = await prisma.permission.create({
      data: {
        name,
        displayName,
        description,
        resource,
        action
      }
    });

    res.status(201).json({
      success: true,
      message: 'Permission created successfully',
      data: { permission }
    });
  })
);

export { router as roleRoutes };
