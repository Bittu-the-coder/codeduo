import mongoose from 'mongoose';
import { logger } from '../shared/utils/logger.js';
import { env } from './env.js';

let isConnected = false;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (isConnected) {
    logger.info('Using existing database connection');
    return mongoose;
  }

  try {
    const options: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(env.MONGODB_URI, options);

    isConnected = true;
    logger.info('Database connected successfully');

    mongoose.connection.on('error', err => {
      logger.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });

    return mongoose;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;

  await mongoose.disconnect();
  isConnected = false;
  logger.info('Database disconnected');
}

export function getDatabaseStatus(): {
  connected: boolean;
  readyState: number;
} {
  return {
    connected: isConnected,
    readyState: mongoose.connection.readyState,
  };
}
