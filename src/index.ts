import log4js from 'log4js';
import { config as configDotenv } from 'dotenv';
import { config } from './config/logger';
import { connectToDatabase } from './config/db';
import { useEnv } from './config/useEnv';
import app from './app';

async function bootstrap(): Promise<void> {
  log4js.configure(config.log4js);

  configDotenv();
  const { EXPRESS_HOST, EXPRESS_PORT, MONGO_URI } = useEnv();

  connectToDatabase(MONGO_URI);

  app.listen(EXPRESS_PORT, EXPRESS_HOST, () => {
    log4js.getLogger().info(`Server started`);
  });
}

bootstrap();
