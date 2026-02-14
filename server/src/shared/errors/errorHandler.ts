import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { errorResponse } from '../utils/response.js';
import { AppError } from './AppError.js';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  logger.error(`${req.method} ${req.path}`, {
    error: err.message,
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Handle AppError (our custom errors)
  if (err instanceof AppError) {
    errorResponse(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    errorResponse(res, 'VALIDATION_ERROR', 'Validation failed', 400, details);
    return;
  }

  // Handle MongoDB duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    errorResponse(res, 'CONFLICT', `${field} already exists`, 409);
    return;
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    const details = Object.values((err as any).errors).map((e: any) => ({
      path: e.path,
      message: e.message,
    }));
    errorResponse(res, 'VALIDATION_ERROR', 'Validation failed', 400, details);
    return;
  }

  // Handle MongoDB CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    errorResponse(res, 'BAD_REQUEST', 'Invalid ID format', 400);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    errorResponse(res, 'TOKEN_INVALID', 'Invalid token', 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    errorResponse(res, 'TOKEN_EXPIRED', 'Token expired', 401);
    return;
  }

  // Unhandled errors - don't expose details in production
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  errorResponse(res, 'INTERNAL_ERROR', message, 500);
};
