import Redis from 'ioredis';
import { logger } from '../shared/utils/logger.js';
import { env } from './env.js';

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;
let redisAvailable = false;

export function createRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  if (!env.REDIS_URL) return null;

  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableReadyCheck: true,
    showFriendlyErrorStack: env.NODE_ENV !== 'production',
    retryStrategy: times => {
      // Stop retrying after 3 attempts
      if (times > 3) {
        logger.warn('Redis unavailable, disabling Redis features');
        return null;
      }
      return Math.min(times * 100, 1000);
    },
  });

  redisClient.on('connect', () => {
    redisAvailable = true;
    logger.info('Redis client connected');
  });

  redisClient.on('error', () => {
    // Suppress repeated error logs
  });

  redisClient.on('close', () => {
    redisAvailable = false;
  });

  return redisClient;
}

export function createRedisSubscriber(): Redis | null {
  if (redisSubscriber) return redisSubscriber;
  if (!env.REDIS_URL) return null;

  redisSubscriber = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableReadyCheck: true,
    retryStrategy: times => {
      if (times > 3) return null;
      return Math.min(times * 100, 1000);
    },
  });

  redisSubscriber.on('connect', () => {
    logger.info('Redis subscriber connected');
  });

  redisSubscriber.on('error', () => {
    // Suppress repeated error logs
  });

  return redisSubscriber;
}

export function getRedisClient(): Redis | null {
  if (!redisClient) {
    return createRedisClient();
  }
  return redisAvailable ? redisClient : null;
}

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

export async function connectRedis(): Promise<void> {
  const client = createRedisClient();
  if (!client) {
    logger.info('Redis URL not configured, skipping Redis');
    return;
  }
  try {
    await client.connect();
  } catch {
    logger.warn('Redis connection failed, continuing without Redis');
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  if (redisSubscriber) {
    await redisSubscriber.quit();
    redisSubscriber = null;
  }
  logger.info('Redis disconnected');
}

// Cache helpers (no-op when Redis unavailable)
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient();
    if (!client) return null;
    try {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const client = getRedisClient();
    if (!client) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await client.setex(key, ttlSeconds, serialized);
      } else {
        await client.set(key, serialized);
      }
    } catch {
      // Ignore cache errors
    }
  },

  async del(key: string): Promise<void> {
    const client = getRedisClient();
    if (!client) return;
    try {
      await client.del(key);
    } catch {
      // Ignore cache errors
    }
  },

  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    if (!client) return false;
    try {
      return (await client.exists(key)) === 1;
    } catch {
      return false;
    }
  },

  async keys(pattern: string): Promise<string[]> {
    const client = getRedisClient();
    if (!client) return [];
    try {
      return await client.keys(pattern);
    } catch {
      return [];
    }
  },
};
