import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodSchema, z } from 'zod';
import { logger } from '../utils/logger';

interface ValidationError {
  field: string;
  message: string;
  code: string;
  received?: any;
}

interface ValidationResult {
  success: boolean;
  errors?: ValidationError[];
}

const formatZodError = (error: ZodError): ValidationError[] => {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    received: err.code === 'invalid_type' ? (err as any).received : undefined
  }));
};

const createValidationErrorResponse = (
  errors: ValidationError[],
  req: Request
) => {
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: errors
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl ?? req.url,
    requestId: (req as any).id
  };
};

export const validateRequest = (schema: AnyZodObject) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodError(error);
        logger.warn('Request validation failed', {
          requestId: (req as any).id,
          method: req.method,
          url: req.originalUrl ?? req.url,
          errors,
          body: req.body,
          query: req.query,
          params: req.params
        });
        res.status(400).json(createValidationErrorResponse(errors, req));
      } else {
        next(error);
      }
    }
  };
};

export const validateBody = (schema: ZodSchema) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodError(error);
        logger.warn('Request body validation failed', {
          requestId: (req as any).id,
          method: req.method,
          url: req.originalUrl ?? req.url,
          errors,
          body: req.body
        });
        res.status(400).json(createValidationErrorResponse(errors, req));
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodError(error);
        logger.warn('Request query validation failed', {
          requestId: (req as any).id,
          method: req.method,
          url: req.originalUrl ?? req.url,
          errors,
          query: req.query
        });
        res.status(400).json(createValidationErrorResponse(errors, req));
      } else {
        next(error);
      }
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodError(error);
        logger.warn('Request params validation failed', {
          requestId: (req as any).id,
          method: req.method,
          url: req.originalUrl ?? req.url,
          errors,
          params: req.params
        });
        res.status(400).json(createValidationErrorResponse(errors, req));
      } else {
        next(error);
      }
    }
  };
};

export const validateHeaders = (schema: ZodSchema) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await schema.parseAsync(req.headers);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodError(error);
        logger.warn('Request headers validation failed', {
          requestId: (req as any).id,
          method: req.method,
          url: req.originalUrl ?? req.url,
          errors
        });
        res.status(400).json(createValidationErrorResponse(errors, req));
      } else {
        next(error);
      }
    }
  };
};

export const sanitizeBody = (allowedFields: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }

    const sanitized: Record<string, any> = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        sanitized[field] = req.body[field];
      }
    }

    req.body = sanitized;
    next();
  };
};

export const stripUnknownFields = (schema: ZodSchema) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (req.body && typeof req.body === 'object') {
        req.body = await schema.parseAsync(req.body);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateFileUpload = (options: {
  maxSize?: number;
  allowedMimeTypes?: string[];
  required?: boolean;
  fieldName?: string;
}) => {
  const {
    maxSize = 10 * 1024 * 1024,
    allowedMimeTypes = [],
    required = false,
    fieldName = 'file'
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const file = (req as any).file || (req as any).files?.[fieldName];

    if (!file) {
      if (required) {
        res.status(400).json({
          success: false,
          error: {
            code: 'FILE_REQUIRED',
            message: `File upload is required for field: ${fieldName}`
          },
          timestamp: new Date().toISOString(),
          path: req.originalUrl ?? req.url,
          requestId: (req as any).id
        });
        return;
      }
      return next();
    }

    if (file.size > maxSize) {
      logger.warn('File size exceeds limit', {
        requestId: (req as any).id,
        fieldName,
        fileSize: file.size,
        maxSize
      });
      res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds the maximum allowed size of ${maxSize} bytes`,
          details: {
            fileSize: file.size,
            maxSize
          }
        },
        timestamp: new Date().toISOString(),
        path: req.originalUrl ?? req.url,
        requestId: (req as any).id
      });
      return;
    }

    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
      logger.warn('Invalid file type', {
        requestId: (req as any).id,
        fieldName,
        mimetype: file.mimetype,
        allowedMimeTypes
      });
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'File type is not allowed',
          details: {
            received: file.mimetype,
            allowed: allowedMimeTypes
          }
        },
        timestamp: new Date().toISOString(),
        path: req.originalUrl ?? req.url,
        requestId: (req as any).id
      });
      return;
    }

    next();
  };
};

export const validatePagination = () => {
  const schema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
  });

  return validateQuery(schema);
};

export const validateIdParam = () => {
  const schema = z.object({
    id: z.string().uuid('Invalid ID format')
  });

  return validateParams(schema);
};

export const validateSlugParam = () => {
  const schema = z.object({
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
  });

  return validateParams(schema);
};

export const optionalValidation = (schema: ZodSchema) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (req.body && Object.keys(req.body).length > 0) {
        req.body = await schema.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodError(error);
        res.status(400).json(createValidationErrorResponse(errors, req));
      } else {
        next(error);
      }
    }
  };
};

export const customValidation = (
  validator: (req: Request) => ValidationResult | Promise<ValidationResult>
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await validator(req);

      if (!result.success && result.errors) {
        logger.warn('Custom validation failed', {
          requestId: (req as any).id,
          method: req.method,
          url: req.originalUrl ?? req.url,
          errors: result.errors
        });
        res.status(400).json(createValidationErrorResponse(result.errors, req));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validationMiddleware = {
  request: validateRequest,
  body: validateBody,
  query: validateQuery,
  params: validateParams,
  headers: validateHeaders,
  sanitize: sanitizeBody,
  strip: stripUnknownFields,
  file: validateFileUpload,
  pagination: validatePagination,
  id: validateIdParam,
  slug: validateSlugParam,
  optional: optionalValidation,
  custom: customValidation
};