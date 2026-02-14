import type { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { AppError } from '../errors/AppError.js';

type ValidationTarget = 'body' | 'params' | 'query';

// Extend Request type to include validated data
declare global {
  namespace Express {
    interface Request {
      validated?: {
        body?: unknown;
        params?: unknown;
        query?: unknown;
      };
    }
  }
}

/**
 * Middleware factory for request validation using Zod schemas
 *
 * Express 5 freezes req.query and req.params, so we store validated data
 * in req.validated instead. For body, we can still assign directly.
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[target]);
      // Store validated data - body can be assigned, but query/params are frozen in Express 5
      if (target === 'body') {
        req.body = data;
      } else {
        req.validated = req.validated || {};
        req.validated[target] = data;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));
        next(AppError.validation('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate multiple targets at once
 */
export function validateRequest(schemas: {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: { target: string; path: string; message: string }[] = [];

    for (const [target, schema] of Object.entries(schemas)) {
      if (schema) {
        try {
          const data = schema.parse(req[target as ValidationTarget]);
          // Store validated data appropriately
          if (target === 'body') {
            req.body = data;
          } else {
            req.validated = req.validated || {};
            req.validated[target as 'params' | 'query'] = data;
          }
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(
              ...error.errors.map(e => ({
                target,
                path: e.path.join('.'),
                message: e.message,
              }))
            );
          }
        }
      }
    }

    if (errors.length > 0) {
      next(AppError.validation('Validation failed', errors));
    } else {
      next();
    }
  };
}

/**
 * Helper to get validated query params
 */
export function getValidatedQuery<T>(req: Request): T {
  return (req.validated?.query || req.query) as T;
}

/**
 * Helper to get validated params
 */
export function getValidatedParams<T>(req: Request): T {
  return (req.validated?.params || req.params) as T;
}
