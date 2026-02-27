import { Router } from 'express';
import { ZodSchema } from 'zod';
import { validateRequest, asyncHandler, AuthenticatedRequest } from './express.ts';
import { authMiddleware } from '../../../api-gateway/src/middleware/auth.middleware';
import { rateLimitMiddleware } from '../../../api-gateway/src/middleware/rate-limit.middleware';
import { logger } from '../../config/logger';

export interface RouteConfig {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  handler: (...args: any[]) => Promise<any>;
  validation?: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
  };
  auth?: boolean;
  roles?: string[];
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  middlewares?: Array<(...args: any[]) => any>;
}

export interface RouteGroupConfig {
  prefix: string;
  routes: RouteConfig[];
  middlewares?: Array<(...args: any[]) => any>;
  auth?: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

export class RouterFactory {
  private router: Router;

  constructor() {
    this.router = Router();
  }

  public addRoute(config: RouteConfig): this {
    const middlewares: Array<(...args: any[]) => any> = [];

    if (config.rateLimit) {
      middlewares.push(
        rateLimitMiddleware({
          windowMs: config.rateLimit.windowMs,
          max: config.rateLimit.max,
        })
      );
    }

    if (config.auth) {
      middlewares.push(authMiddleware(config.roles));
    }

    if (config.middlewares) {
      middlewares.push(...config.middlewares);
    }

    if (config.validation) {
      middlewares.push(validateRequest(config.validation));
    }

    middlewares.push(asyncHandler(config.handler));

    this.router[config.method](config.path, ...middlewares);

    logger.debug(`Route registered: ${config.method.toUpperCase()} ${config.path}`);

    return this;
  }

  public addRoutes(configs: RouteConfig[]): this {
    configs.forEach((config) => this.addRoute(config));
    return this;
  }

  public addRouteGroup(config: RouteGroupConfig): this {
    const groupRouter = Router();

    if (config.middlewares) {
      config.middlewares.forEach((middleware) => {
        groupRouter.use(middleware);
      });
    }

    if (config.rateLimit) {
      groupRouter.use(
        rateLimitMiddleware({
          windowMs: config.rateLimit.windowMs,
          max: config.rateLimit.max,
        })
      );
    }

    if (config.auth) {
      groupRouter.use(authMiddleware());
    }

    config.routes.forEach((route) => {
      const routeMiddlewares: Array<(...args: any[]) => any> = [];

      if (route.auth && !config.auth) {
        routeMiddlewares.push(authMiddleware(route.roles));
      }

      if (route.middlewares) {
        routeMiddlewares.push(...route.middlewares);
      }

      if (route.validation) {
        routeMiddlewares.push(validateRequest(route.validation));
      }

      routeMiddlewares.push(asyncHandler(route.handler));

      groupRouter[route.method](route.path, ...routeMiddlewares);

      logger.debug(
        `Route registered: ${route.method.toUpperCase()} ${config.prefix}${route.path}`
      );
    });

    this.router.use(config.prefix, groupRouter);

    return this;
  }

  public getRouter(): Router {
    return this.router;
  }

  public static create(): RouterFactory {
    return new RouterFactory();
  }

  public static createCRUDRoutes(config: {
    basePath: string;
    controller: {
      getAll: (...args: any[]) => Promise<any>;
      getById: (...args: any[]) => Promise<any>;
      create: (...args: any[]) => Promise<any>;
      update: (...args: any[]) => Promise<any>;
      delete: (...args: any[]) => Promise<any>;
    };
    validation?: {
      create?: ZodSchema;
      update?: ZodSchema;
      query?: ZodSchema;
      params?: ZodSchema;
    };
    auth?: {
      list?: boolean | string[];
      get?: boolean | string[];
      create?: boolean | string[];
      update?: boolean | string[];
      delete?: boolean | string[];
    };
  }): Router {
    const factory = new RouterFactory();

    factory.addRoute({
      method: 'get',
      path: config.basePath,
      handler: config.controller.getAll,
      validation: config.validation?.query
        ? { query: config.validation.query }
        : undefined,
      auth: typeof config.auth?.list === 'boolean' ? config.auth.list : !!config.auth?.list,
      roles: Array.isArray(config.auth?.list) ? config.auth.list : undefined,
    });

    factory.addRoute({
      method: 'get',
      path: `${config.basePath}/:id`,
      handler: config.controller.getById,
      validation: config.validation?.params
        ? { params: config.validation.params }
        : undefined,
      auth: typeof config.auth?.get === 'boolean' ? config.auth.get : !!config.auth?.get,
      roles: Array.isArray(config.auth?.get) ? config.auth.get : undefined,
    });

    factory.addRoute({
      method: 'post',
      path: config.basePath,
      handler: config.controller.create,
      validation: config.validation?.create
        ? { body: config.validation.create }
        : undefined,
      auth: typeof config.auth?.create === 'boolean' ? config.auth.create : !!config.auth?.create,
      roles: Array.isArray(config.auth?.create) ? config.auth.create : undefined,
    });

    factory.addRoute({
      method: 'patch',
      path: `${config.basePath}/:id`,
      handler: config.controller.update,
      validation: {
        body: config.validation?.update,
        params: config.validation?.params,
      },
      auth: typeof config.auth?.update === 'boolean' ? config.auth.update : !!config.auth?.update,
      roles: Array.isArray(config.auth?.update) ? config.auth.update : undefined,
    });

    factory.addRoute({
      method: 'delete',
      path: `${config.basePath}/:id`,
      handler: config.controller.delete,
      validation: config.validation?.params
        ? { params: config.validation.params }
        : undefined,
      auth: typeof config.auth?.delete === 'boolean' ? config.auth.delete : !!config.auth?.delete,
      roles: Array.isArray(config.auth?.delete) ? config.auth.delete : undefined,
    });

    return factory.getRouter();
  }

  public static createPublicPrivateRoutes(config: {
    basePath: string;
    publicRoutes: RouteConfig[];
    privateRoutes: RouteConfig[];
    roles?: string[];
  }): Router {
    const factory = new RouterFactory();

    factory.addRouteGroup({
      prefix: `${config.basePath}/public`,
      routes: config.publicRoutes,
      auth: false,
    });

    factory.addRouteGroup({
      prefix: `${config.basePath}/admin`,
      routes: config.privateRoutes,
      auth: true,
    });

    return factory.getRouter();
  }

  public static createVersionedRouter(config: {
    version: string;
    routes: RouteConfig[];
    middlewares?: Array<(...args: any[]) => any>;
  }): Router {
    const factory = new RouterFactory();

    factory.addRouteGroup({
      prefix: `/api/${config.version}`,
      routes: config.routes,
      middlewares: config.middlewares,
    });

    return factory.getRouter();
  }
}

export function createRouter(): RouterFactory {
  return RouterFactory.create();
}

export function createCRUDRouter(config: Parameters<typeof RouterFactory.createCRUDRoutes>[0]): Router {
  return RouterFactory.createCRUDRoutes(config);
}

export function createPublicPrivateRouter(
  config: Parameters<typeof RouterFactory.createPublicPrivateRoutes>[0]
): Router {
  return RouterFactory.createPublicPrivateRoutes(config);
}

export function createVersionedRouter(
  config: Parameters<typeof RouterFactory.createVersionedRouter>[0]
): Router {
  return RouterFactory.createVersionedRouter(config);
}