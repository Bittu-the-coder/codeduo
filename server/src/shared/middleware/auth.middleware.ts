import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { cache } from '../../config/redis.js';
import { AppError } from '../errors/AppError.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Middleware to require authentication
 */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      throw AppError.unauthorized('No token provided');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(AppError.unauthorized('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(AppError.unauthorized('Token expired'));
    } else {
      next(error);
    }
  }
}

/**
 * Middleware to optionally authenticate (attach user if token present)
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      (req as AuthenticatedRequest).user = decoded;
    }
    next();
  } catch {
    // Token invalid but continue anyway (optional auth)
    next();
  }
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user || authReq.user.role !== 'admin') {
    next(AppError.forbidden('Admin access required'));
    return;
  }
  next();
}

/**
 * Check if token is blacklisted (for logout)
 */
export async function checkTokenBlacklist(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (token) {
      const isBlacklisted = await cache.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        next(AppError.unauthorized('Token has been revoked'));
        return;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}
