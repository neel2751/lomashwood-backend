import { requireAdmin } from './auth.middleware';

export const adminMiddleware = requireAdmin;