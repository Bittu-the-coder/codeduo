import { existsSync } from 'fs';
import { config } from 'dotenv';
import { resolve } from 'path';

const envCandidates = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../.env'),
  resolve(process.cwd(), '../../.env'),
];

const envPath = envCandidates.find(path => existsSync(path));
if (envPath) {
  config({ path: envPath });
} else {
  config();
}

function parseIntWithDefault(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBooleanWithDefault(
  value: string | undefined,
  fallback: boolean
): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
}

function parseOriginList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

const port = parseIntWithDefault(process.env.PORT ?? process.env.BACKEND_PORT, 3001);
const backendUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
const frontendOrigins = parseOriginList(process.env.FRONTEND_URLS);
const primaryFrontendUrl = process.env.FRONTEND_URL || frontendOrigins[0] || 'http://localhost:5173';

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: port,
  HOST: process.env.HOST || '0.0.0.0',

  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/codeduo',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Authentication
  JWT_SECRET:
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN:
    process.env.JWT_EXPIRES_IN || process.env.JWT_ACCESS_EXPIRES || '15m',
  REFRESH_TOKEN_SECRET:
    process.env.REFRESH_TOKEN_SECRET ||
    process.env.JWT_REFRESH_SECRET ||
    'your-refresh-token-secret-change-in-production',
  REFRESH_TOKEN_EXPIRES_IN:
    process.env.REFRESH_TOKEN_EXPIRES_IN ||
    process.env.JWT_REFRESH_EXPIRES ||
    '7d',

  // OAuth
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  GITHUB_CALLBACK_URL:
    process.env.GITHUB_CALLBACK_URL || `${backendUrl}/api/auth/github/callback`,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',

  // URLs
  FRONTEND_URL: primaryFrontendUrl,
  FRONTEND_ORIGINS: Array.from(new Set([primaryFrontendUrl, ...frontendOrigins])),
  ALLOW_VERCEL_PREVIEW_ORIGINS: parseBooleanWithDefault(
    process.env.ALLOW_VERCEL_PREVIEW_ORIGINS,
    false
  ),
  BACKEND_URL: backendUrl,

  // ImageKit (file storage)
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY || '',
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY || '',
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT || '',

  // Features
  ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',
} as const;

const vercelPreviewOriginPattern = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

export function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true;
  if (env.FRONTEND_ORIGINS.includes(origin)) return true;
  if (env.ALLOW_VERCEL_PREVIEW_ORIGINS) {
    return vercelPreviewOriginPattern.test(origin);
  }
  return false;
}

// Validate required environment variables
export function validateEnv(): void {
  const required = ['MONGODB_URI', 'JWT_SECRET'];

  const missing = required.filter(key => !process.env[key]);
  const hasRefreshSecret =
    Boolean(process.env.REFRESH_TOKEN_SECRET) ||
    Boolean(process.env.JWT_REFRESH_SECRET);

  if (!hasRefreshSecret) {
    missing.push('REFRESH_TOKEN_SECRET (or JWT_REFRESH_SECRET)');
  }

  const hasWildcardFrontendOrigin =
    process.env.FRONTEND_URL === '*' ||
    parseOriginList(process.env.FRONTEND_URLS).includes('*');

  if (hasWildcardFrontendOrigin) {
    missing.push(
      "Invalid frontend origin config: '*' is not allowed with credentialed CORS"
    );
  }

  if (missing.length > 0 && env.NODE_ENV === 'production') {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
