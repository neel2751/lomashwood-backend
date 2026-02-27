import { z } from 'zod';


export const createSessionSchema = z.object({
  body: z.object({
    userId: z.string().uuid({ message: 'User ID must be a valid UUID' }),
    token: z.string().min(1, { message: 'Token is required' }),
    refreshToken: z.string().optional(),
    expiresAt: z.coerce.date({ required_error: 'Expiration date is required' }),
    ipAddress: z.string().ip().optional(),
    userAgent: z.string().max(500).optional(),
    deviceType: z.enum(['desktop', 'mobile', 'tablet', 'other']).optional(),
    deviceName: z.string().max(255).optional(),
    location: z.string().max(255).optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const updateSessionSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Session ID must be a valid UUID' }),
  }),
  body: z.object({
    expiresAt: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
    lastActivityAt: z.coerce.date().optional(),
    ipAddress: z.string().ip().optional(),
    userAgent: z.string().max(500).optional(),
    deviceType: z.enum(['desktop', 'mobile', 'tablet', 'other']).optional(),
    deviceName: z.string().max(255).optional(),
    location: z.string().max(255).optional(),
    metadata: z.record(z.any()).optional(),
  }).strict(),
});

export const getSessionByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Session ID must be a valid UUID' }),
  }),
});

export const deleteSessionSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Session ID must be a valid UUID' }),
  }),
});

export const getSessionsByUserIdSchema = z.object({
  params: z.object({
    userId: z.string().uuid({ message: 'User ID must be a valid UUID' }),
  }),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    // FIX: default BEFORE transform so the default value matches the pre-transform (string) type.
    // Also handle the undefined case explicitly so omitting the param yields undefined, not false.
    isActive: z.enum(['true', 'false']).optional().transform(val =>
      val !== undefined ? val === 'true' : undefined
    ),
    sortBy: z.enum(['createdAt', 'lastActivityAt', 'expiresAt']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }).optional(),
});

export const revokeAllUserSessionsSchema = z.object({
  params: z.object({
    userId: z.string().uuid({ message: 'User ID must be a valid UUID' }),
  }),
  body: z.object({
    exceptCurrentSession: z.boolean().optional().default(false),
    currentSessionId: z.string().uuid().optional(),
  }).optional(),
});

export const GetSessionsQuerySchema = z.object({
  // FIX: .default('false') placed BEFORE .transform() so the default is the string 'false',
  // which is then transformed to boolean false. Previously .default('false') was after
  // .transform(), making it a type mismatch (string default on a boolean output).
  includeExpired: z.enum(['true', 'false']).default('false').transform(val => val === 'true'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['createdAt', 'lastActivityAt', 'expiresAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const RevokeSessionSchema = z.object({
  reason: z.string().optional(),
});

export const RevokeAllSessionsSchema = z.object({
  includeCurrentSession: z.boolean().optional().default(false),
  reason: z.string().optional(),
});

export const UpdateSessionSchema = z.object({
  device: z.string().optional(),
  location: z.string().optional(),
});

export const refreshSessionSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Session ID must be a valid UUID' }),
  }),
  body: z.object({
    refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
    extendBy: z.number().int().positive().optional(),
  }),
});

export const validateSessionSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Session ID must be a valid UUID' }),
  }),
  body: z.object({
    token: z.string().min(1, { message: 'Token is required for validation' }),
  }),
});

export const cleanupInactiveSessionsSchema = z.object({
  query: z.object({
    olderThan: z.coerce.number().int().positive().optional(),
    // FIX: .default('true') placed BEFORE .transform() — same pattern as GetSessionsQuerySchema.
    // Previously .default(true) was after .transform(), causing a type error (boolean literal
    // used as default where Zod expects the pre-transform string type at that position).
    includeExpired: z.enum(['true', 'false']).default('true').transform(val => val === 'true'),
  }).optional(),
});

export const getActiveSessionCountSchema = z.object({
  query: z.object({
    userId: z.string().uuid().optional(),
  }).optional(),
});

export const sessionResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.date(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet', 'other']).optional(),
  deviceName: z.string().optional(),
  location: z.string().optional(),
  isActive: z.boolean(),
  lastActivityAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.record(z.any()).optional(),
});

export const sessionListResponseSchema = z.object({
  sessions: z.array(sessionResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export const sessionValidationResponseSchema = z.object({
  isValid: z.boolean(),
  session: sessionResponseSchema.optional(),
  reason: z.string().optional(),
});

export const sessionCountResponseSchema = z.object({
  userId: z.string().uuid().optional(),
  activeCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>['body'];
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>['body'];
export type GetSessionsByUserIdQuery = z.infer<typeof getSessionsByUserIdSchema>['query'];
export type RevokeAllUserSessionsInput = z.infer<typeof revokeAllUserSessionsSchema>['body'];
export type RefreshSessionInput = z.infer<typeof refreshSessionSchema>['body'];
export type ValidateSessionInput = z.infer<typeof validateSessionSchema>['body'];
export type CleanupInactiveSessionsQuery = z.infer<typeof cleanupInactiveSessionsSchema>['query'];
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type SessionListResponse = z.infer<typeof sessionListResponseSchema>;
export type SessionValidationResponse = z.infer<typeof sessionValidationResponseSchema>;
export type SessionCountResponse = z.infer<typeof sessionCountResponseSchema>;

export const sessionSchemas = {
  create: createSessionSchema,
  update: updateSessionSchema,
  getById: getSessionByIdSchema,
  delete: deleteSessionSchema,
  getByUserId: getSessionsByUserIdSchema,
  revokeAll: revokeAllUserSessionsSchema,
  refresh: refreshSessionSchema,
  validate: validateSessionSchema,
  cleanup: cleanupInactiveSessionsSchema,
  getCount: getActiveSessionCountSchema,
  response: sessionResponseSchema,
  listResponse: sessionListResponseSchema,
  validationResponse: sessionValidationResponseSchema,
  countResponse: sessionCountResponseSchema,
};

export default sessionSchemas;