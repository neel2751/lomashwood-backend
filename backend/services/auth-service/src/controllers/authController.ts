import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SecurityUtils } from '@/utils/security';
import { userRegistrationSchema, userLoginSchema } from '@/utils/validation';
import { asyncHandler, createError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { UserRegistrationData, UserLoginData, AuthResponse } from '@/types/auth';

const prisma = new PrismaClient();

class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = userRegistrationSchema.validate(req.body);
    
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const data: UserRegistrationData = value;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username }
        ]
      }
    });

    if (existingUser) {
      throw createError('User with this email or username already exists', 409);
    }

    // Hash password
    const passwordHash = await SecurityUtils.hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        department: data.department,
        location: data.location
      }
    });

    // Assign role if provided
    if (data.roleId) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: data.roleId
        }
      });
    } else {
      // Assign default role (operator)
      const defaultRole = await prisma.role.findUnique({
        where: { name: 'operator' }
      });

      if (defaultRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: defaultRole.id
          }
        });
      }
    }

    // Create security questions if provided
    if (data.securityQuestions && data.securityQuestions.length > 0) {
      for (const sq of data.securityQuestions) {
        await prisma.securityQuestion.create({
          data: {
            userId: user.id,
            question: sq.question,
            answerHash: await SecurityUtils.hashAnswer(sq.answer)
          }
        });
      }
    }

    // Create email verification token
    const emailToken = SecurityUtils.generateEmailVerificationToken();
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: emailToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    // TODO: Send verification email

    logger.info(`User registered successfully: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: {
        userId: user.id,
        email: user.email,
        username: user.username
      }
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = userLoginSchema.validate(req.body);
    
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const data: UserLoginData = value;

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username }
        ]
      },
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
        }
      }
    });

    if (!user) {
      throw createError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await SecurityUtils.comparePassword(data.password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw createError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw createError('Account is inactive', 401);
    }

    // Extract roles and permissions
    const roles = user.userRoles.map((ur: any) => ur.role.name);
    const permissions = user.userRoles.flatMap((ur: any) => 
      ur.role.rolePermissions.map((rp: any) => rp.permission.name)
    );

    // Generate tokens
    const tokens = SecurityUtils.generateTokens({
      userId: user.id,
      email: user.email,
      username: user.username,
      roles,
      permissions
    });

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      }
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    logger.info(`User logged in: ${user.email}`);

    const response: AuthResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          roles,
          permissions
        },
        tokens
      }
    };

    res.json(response);
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Access token required', 401);
    }

    const token = authHeader.substring(7);

    // Invalidate session
    await prisma.session.updateMany({
      where: { token },
      data: { isActive: false }
    });

    logger.info('User logged out');

    res.json({
      success: true,
      message: 'Logout successful'
    });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw createError('Refresh token required', 400);
    }

    // Verify refresh token
    const decoded = SecurityUtils.verifyRefreshToken(refreshToken);

    // Find session
    const session = await prisma.session.findFirst({
      where: {
        refreshToken,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    if (!session) {
      throw createError('Invalid or expired refresh token', 401);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
        }
      }
    });

    if (!user || !user.isActive) {
      throw createError('User not found or inactive', 401);
    }

    // Extract roles and permissions
    const roles = user.userRoles.map((ur: any) => ur.role.name);
    const permissions = user.userRoles.flatMap((ur: any) => 
      ur.role.rolePermissions.map((rp: any) => rp.permission.name)
    );

    // Generate new tokens
    const tokens = SecurityUtils.generateTokens({
      userId: user.id,
      email: user.email,
      username: user.username,
      roles,
      permissions
    });

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      }
    });

    logger.info(`Token refreshed for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { tokens }
    });
  });
}

export const authController = new AuthController();
