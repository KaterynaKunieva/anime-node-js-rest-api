import mongoose from 'mongoose';
import log4js from 'log4js';

export const connectToDatabase = async (mongoUri: string): Promise<void> => {
  const logger = log4js.getLogger();

  logger.info(`Attempting to connect to database: ${mongoUri}`);

  mongoose.connection.on('connecting', () => {
    logger.info('Attempting to connect...');
  });

  mongoose.connection.on('connected', () => {
    logger.info(`Successfully connected to database: ${mongoUri}`);
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`Error during connection: ${err}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('Database connection lost');
  });

  try {
    await mongoose.connect(mongoUri);
  } catch (error) {
    logger.error(`Database connection failed: ${mongoUri}`, error);
    process.exit(1);
  }
};
