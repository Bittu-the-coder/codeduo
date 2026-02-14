import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, {
  type Application,
  type Request,
  type Response,
} from 'express';
import { env, isAllowedOrigin } from './config/env.js';
import { errorHandler } from './shared/errors/errorHandler.js';
import { apiRateLimit } from './shared/middleware/rateLimit.middleware.js';
import { logger } from './shared/utils/logger.js';

// Import routes
import { authRoutes } from './domains/auth/index.js';
import { fileRoutes } from './domains/files/index.js';
import { projectRoutes } from './domains/projects/index.js';
import { userRoutes } from './domains/users/index.js';
import { versionRoutes } from './domains/versions/index.js';

export function createApp(): Application {
  const app = express();

  // ── Trust Proxy (for rate limiting behind reverse proxy) ──
  app.set('trust proxy', 1);

  // ── CORS ──
  app.use(
    cors({
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        logger.warn('Blocked CORS origin', { origin });
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ── Body Parsing ──
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Cookie Parser ──
  app.use(cookieParser());

  // ── Request Logging ──
  app.use((req: Request, _res: Response, next) => {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    next();
  });

  // ── Health Check ──
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // ── API Routes ──
  const apiRouter = express.Router();

  // Apply rate limiting to API routes
  if (env.ENABLE_RATE_LIMITING) {
    apiRouter.use(apiRateLimit);
  }

  // Mount domain routes
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/users', userRoutes);
  apiRouter.use('/projects', projectRoutes);

  // Nested routes for files and versions under projects
  apiRouter.use('/projects/:id/files', fileRoutes);
  apiRouter.use('/projects/:id/versions', versionRoutes);

  app.use('/api', apiRouter);

  // ── 404 Handler ──
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      },
    });
  });

  // ── Error Handler ──
  app.use(errorHandler);

  return app;
}
