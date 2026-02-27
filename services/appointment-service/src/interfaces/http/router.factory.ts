import { Router, RequestHandler } from 'express';

export interface RouteDefinition {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  handlers: RequestHandler[];
}

export interface RouterConfig {
  prefix?: string;
  routes: RouteDefinition[];
  middleware?: RequestHandler[];
}

export class RouterFactory {
  static create(config: RouterConfig): Router {
    const router = Router();

    if (config.middleware && config.middleware.length > 0) {
      router.use(...config.middleware);
    }

    for (const route of config.routes) {
      const fullPath = config.prefix ? `${config.prefix}${route.path}` : route.path;
      router[route.method](fullPath, ...route.handlers);
    }

    return router;
  }

  static createWithPrefix(prefix: string, routes: RouteDefinition[], middleware: RequestHandler[] = []): Router {
    return RouterFactory.create({ prefix, routes, middleware });
  }

  static merge(...routers: Router[]): Router {
    const root = Router();
    for (const r of routers) {
      root.use(r);
    }
    return root;
  }
}

export function buildRoute(
  method: RouteDefinition['method'],
  path: string,
  ...handlers: RequestHandler[]
): RouteDefinition {
  return { method, path, handlers };
}

export const GET = (path: string, ...handlers: RequestHandler[]): RouteDefinition =>
  buildRoute('get', path, ...handlers);

export const POST = (path: string, ...handlers: RequestHandler[]): RouteDefinition =>
  buildRoute('post', path, ...handlers);

export const PUT = (path: string, ...handlers: RequestHandler[]): RouteDefinition =>
  buildRoute('put', path, ...handlers);

export const PATCH = (path: string, ...handlers: RequestHandler[]): RouteDefinition =>
  buildRoute('patch', path, ...handlers);

export const DELETE = (path: string, ...handlers: RequestHandler[]): RouteDefinition =>
  buildRoute('delete', path, ...handlers);