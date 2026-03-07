import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { asyncHandler, createError } from '@/middleware/errorHandler';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all users (admin only)
router.get('/', 
  authenticate, 
  authorize(['users_read', 'admin']), 
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    
    const where = search ? {
      OR: [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { username: { contains: search as string, mode: 'insensitive' } }
      ]
    } : {};

    const users = await prisma.user.findMany({
      where,
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  })
);

// Get user by ID
router.get('/:id', 
  authenticate, 
  authorize(['users_read', 'admin']), 
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        securityQuestions: true
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user }
    });
  })
);

// Update user
router.put('/:id', 
  authenticate, 
  authorize(['users_write', 'admin']), 
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, phone, department, location, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        department,
        location,
        isActive
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  })
);

// Delete user
router.delete('/:id', 
  authenticate, 
  authorize(['users_delete', 'admin']), 
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  })
);

export { router as userRoutes };
