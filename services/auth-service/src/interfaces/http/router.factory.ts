import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { verify } from 'jsonwebtoken';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../../config/logger';
import { UserRole } from '../../app/auth/auth.types';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No token provided' },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const token = authHeader.split(' ')[1] as string;
    const secret = process.env['JWT_SECRET'] || 'secret';
    (req as any).user = verify(token, secret);
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
      timestamp: new Date().toISOString(),
    });
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const userRoles: string[] = user.roles || [];
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

export const validate = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body)   await schemas.body.parseAsync(req.body);
      if (schemas.query)  await schemas.query.parseAsync(req.query);
      if (schemas.params) await schemas.params.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      next(error);
    }
  };
};

export interface RouteConfig {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  handler: any;
  middleware?: any[];
  auth?: boolean;
  roles?: UserRole[];
  validation?: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
  };
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

export interface RouterConfig {
  prefix?: string;
  middleware?: any[];
  routes: RouteConfig[];
}

export class RouterFactory {
  public static createRouter(config: RouterConfig): Router {
    const router = Router();

    if (config.middleware && config.middleware.length > 0) {
      router.use(...config.middleware);
      logger.debug(`Applied ${config.middleware.length} global middleware to router`);
    }

    config.routes.forEach((route) => {
      this.registerRoute(router, route);
    });

    logger.info(`Router created with ${config.routes.length} routes`);

    return router;
  }

  private static registerRoute(router: Router, route: RouteConfig): void {
    const middlewares: any[] = [];

    if (route.rateLimit) {
      middlewares.push(
        rateLimit({
          windowMs: route.rateLimit.windowMs,
          max: route.rateLimit.max,
        })
      );
    }

    if (route.auth) {
      middlewares.push(authenticate);
    }

    if (route.roles && route.roles.length > 0) {
      middlewares.push(authorize(route.roles));
    }

    if (route.validation) {
      middlewares.push(validate(route.validation));
    }

    if (route.middleware && route.middleware.length > 0) {
      middlewares.push(...route.middleware);
    }

    router[route.method](route.path, ...middlewares, route.handler);

    logger.debug(`Route registered: ${route.method.toUpperCase()} ${route.path}`);
  }

  public static createAuthRouter(routes: RouteConfig[]): Router {
    return this.createRouter({
      middleware: [],
      routes: routes.map((route) => ({ ...route, auth: true })),
    });
  }

  public static createPublicRouter(routes: RouteConfig[]): Router {
    return this.createRouter({
      middleware: [],
      routes: routes.map((route) => ({ ...route, auth: false })),
    });
  }

  public static createAdminRouter(routes: RouteConfig[]): Router {
    return this.createRouter({
      middleware: [],
      routes: routes.map((route) => ({
        ...route,
        auth: true,
        roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      })),
    });
  }

  public static createApiVersionRouter(
    version: string,
    routers: { path: string; router: Router }[]
  ): Router {
    const router = Router();

    routers.forEach(({ path, router: subRouter }) => {
      router.use(`/${version}${path}`, subRouter);
      logger.info(`Mounted router: /${version}${path}`);
    });

    return router;
  }

  public static createCrudRouter(config: {
    basePath: string;
    controller: any;
    auth?: boolean;
    roles?: UserRole[];
    validation?: {
      create?: ZodSchema;
      update?: ZodSchema;
      query?: ZodSchema;
      params?: ZodSchema;
    };
    rateLimit?: {
      read?: { windowMs: number; max: number };
      write?: { windowMs: number; max: number };
    };
  }): Router {
    const routes: RouteConfig[] = [
      {
        method: 'get',
        path: '/',
        handler: config.controller.getAll,
        auth: config.auth,
        roles: config.roles,
        validation: config.validation?.query ? { query: config.validation.query } : undefined,
        rateLimit: config.rateLimit?.read,
      },
      {
        method: 'get',
        path: '/:id',
        handler: config.controller.getById,
        auth: config.auth,
        roles: config.roles,
        validation: config.validation?.params ? { params: config.validation.params } : undefined,
        rateLimit: config.rateLimit?.read,
      },
      {
        method: 'post',
        path: '/',
        handler: config.controller.create,
        auth: config.auth,
        roles: config.roles,
        validation: config.validation?.create ? { body: config.validation.create } : undefined,
        rateLimit: config.rateLimit?.write,
      },
      {
        method: 'patch',
        path: '/:id',
        handler: config.controller.update,
        auth: config.auth,
        roles: config.roles,
        validation: {
          ...(config.validation?.update && { body: config.validation.update }),
          ...(config.validation?.params && { params: config.validation.params }),
        },
        rateLimit: config.rateLimit?.write,
      },
      {
        method: 'delete',
        path: '/:id',
        handler: config.controller.delete,
        auth: config.auth,
        roles: config.roles,
        validation: config.validation?.params ? { params: config.validation.params } : undefined,
        rateLimit: config.rateLimit?.write,
      },
    ];

    return this.createRouter({ routes });
  }

  public static createNestedRouter(parentRouter: Router, path: string, childRouter: Router): void {
    parentRouter.use(path, childRouter);
    logger.info(`Nested router mounted at: ${path}`);
  }

  public static combineRouters(routers: Router[]): Router {
    const combinedRouter = Router();
    routers.forEach((router) => combinedRouter.use(router));
    logger.info(`Combined ${routers.length} routers`);
    return combinedRouter;
  }

  public static createResourceRouter(config: {
    resourceName: string;
    controller: any;
    auth?: boolean;
    roles?: UserRole[];
    customRoutes?: RouteConfig[];
    excludeRoutes?: ('list' | 'get' | 'create' | 'update' | 'delete')[];
    validation?: {
      create?: ZodSchema;
      update?: ZodSchema;
      query?: ZodSchema;
      params?: ZodSchema;
    };
    rateLimit?: {
      read?: { windowMs: number; max: number };
      write?: { windowMs: number; max: number };
    };
  }): Router {
    const excludeRoutes = config.excludeRoutes || [];
    const routes: RouteConfig[] = [];

    if (!excludeRoutes.includes('list')) {
      routes.push({
        method: 'get',
        path: '/',
        handler: config.controller.getAll || config.controller.list,
        auth: config.auth,
        roles: config.roles,
        validation: config.validation?.query ? { query: config.validation.query } : undefined,
        rateLimit: config.rateLimit?.read,
      });
    }

    if (!excludeRoutes.includes('get')) {
      routes.push({
        method: 'get',
        path: '/:id',
        handler: config.controller.getById || config.controller.get,
        auth: config.auth,
        roles: config.roles,
        validation: config.validation?.params ? { params: config.validation.params } : undefined,
        rateLimit: config.rateLimit?.read,
      });
    }

    if (!excludeRoutes.includes('create')) {
      routes.push({
        method: 'post',
        path: '/',
        handler: config.controller.create,
        auth: config.auth,
        roles: config.roles,
        validation: config.validation?.create ? { body: config.validation.create } : undefined,
        rateLimit: config.rateLimit?.write,
      });
    }

    if (!excludeRoutes.includes('update')) {
      routes.push({
        method: 'patch',
        path: '/:id',
        handler: config.controller.update,
        auth: config.auth,
        roles: config.roles,
        validation: {
          ...(config.validation?.update && { body: config.validation.update }),
          ...(config.validation?.params && { params: config.validation.params }),
        },
        rateLimit: config.rateLimit?.write,
      });
    }

    if (!excludeRoutes.includes('delete')) {
      routes.push({
        method: 'delete',
        path: '/:id',
        handler: config.controller.delete,
        auth: config.auth,
        roles: config.roles,
        validation: config.validation?.params ? { params: config.validation.params } : undefined,
        rateLimit: config.rateLimit?.write,
      });
    }

    if (config.customRoutes && config.customRoutes.length > 0) {
      routes.push(...config.customRoutes);
    }

    return this.createRouter({ routes });
  }

  public static createHealthCheckRouter(): Router {
    const router = Router();

    router.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    router.get('/ready', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    });

    router.get('/live', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'live',
        timestamp: new Date().toISOString(),
      });
    });

    logger.info('Health check router created');

    return router;
  }
}

export const createRouter = RouterFactory.createRouter.bind(RouterFactory);
export const createAuthRouter = RouterFactory.createAuthRouter.bind(RouterFactory);
export const createPublicRouter = RouterFactory.createPublicRouter.bind(RouterFactory);
export const createAdminRouter = RouterFactory.createAdminRouter.bind(RouterFactory);
export const createCrudRouter = RouterFactory.createCrudRouter.bind(RouterFactory);
export const createResourceRouter = RouterFactory.createResourceRouter.bind(RouterFactory);
export const createApiVersionRouter = RouterFactory.createApiVersionRouter.bind(RouterFactory);
export const createHealthCheckRouter = RouterFactory.createHealthCheckRouter.bind(RouterFactory);