import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { cache } from '../../config/redis.js';
import { AppError } from '../errors/AppError.js';
import type { AuthenticatedRequest } from './auth.middleware.js';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  keyPrefix?: string;
  message?: string;
  skipFailedRequests?: boolean;
}

/**
 * IP-based rate limiter
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    keyPrefix = 'rl',
    message = 'Too many requests, please try again later',
    skipFailedRequests = false,
  } = options;

  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!env.ENABLE_RATE_LIMITING) {
      next();
      return;
    }

    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `${keyPrefix}:${ip}:${req.path}`;

      const current = await cache.get<number>(key);
      const count = (current || 0) + 1;

      if (count > max) {
        const redis = getRedisClient();
        const ttl = redis ? await redis.ttl(key) : windowSeconds;
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + ttl);
        res.setHeader('Retry-After', ttl);

        next(AppError.rateLimited(message));
        return;
      }

      await cache.set(key, count, windowSeconds);

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
      res.setHeader(
        'X-RateLimit-Reset',
        Math.ceil(Date.now() / 1000) + windowSeconds
      );

      if (skipFailedRequests) {
        res.on('finish', async () => {
          if (res.statusCode >= 400) {
            const newCount = await cache.get<number>(key);
            if (newCount && newCount > 0) {
              await cache.set(key, newCount - 1, windowSeconds);
            }
          }
        });
      }

      next();
    } catch (error) {
      // If Redis fails, allow request but log
      next();
    }
  };
}

// Import for TTL check
import { getRedisClient } from '../../config/redis.js';

/**
 * User-based rate limiter (requires authentication)
 */
export function userRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    keyPrefix = 'url',
    message = 'Too many requests, please try again later',
  } = options;

  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!env.ENABLE_RATE_LIMITING) {
      next();
      return;
    }

    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        next();
        return;
      }

      const key = `${keyPrefix}:${authReq.user.userId}:${req.path}`;
      const current = await cache.get<number>(key);
      const count = (current || 0) + 1;

      if (count > max) {
        next(AppError.rateLimited(message));
        return;
      }

      await cache.set(key, count, windowSeconds);
      next();
    } catch {
      next();
    }
  };
}

// Preset rate limiters
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyPrefix: 'auth',
  message: 'Too many authentication attempts',
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  keyPrefix: 'api',
});

export const createProjectRateLimit = userRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyPrefix: 'create_project',
});
