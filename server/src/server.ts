import { createServer } from 'http';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env, validateEnv } from './config/env.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { initializeCollaborationGateway } from './domains/collaboration/index.js';
import { logger } from './shared/utils/logger.js';

async function bootstrap(): Promise<void> {
  try {
    // Validate environment
    validateEnv();
    logger.info(`Starting server in ${env.NODE_ENV} mode`);

    // Connect to databases
    await connectDatabase();
    logger.info('Connected to MongoDB');

    try {
      await connectRedis();
      logger.info('Connected to Redis');
    } catch (error) {
      logger.warn('Redis connection failed, continuing without Redis:', error);
    }

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize WebSocket gateway for collaboration
    const io = initializeCollaborationGateway(httpServer);
    logger.info('Collaboration gateway initialized');

    // Start server
    httpServer.listen(env.PORT, env.HOST, () => {
      logger.info(`🚀 Server running at http://${env.HOST}:${env.PORT}`);
      logger.info(`📡 WebSocket available at ws://${env.HOST}:${env.PORT}`);
      logger.info(`📚 API documentation at http://${env.HOST}:${env.PORT}/api`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      httpServer.close(async () => {
        logger.info('HTTP server closed');

        try {
          await disconnectDatabase();
          await disconnectRedis();
          logger.info('Database connections closed');
        } catch (error) {
          logger.error('Error during shutdown:', error);
        }

        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', error => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
