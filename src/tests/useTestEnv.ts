import { config as configDotenv } from 'dotenv';

interface TestEnv {
  MONGO_IMAGE: string;
  MONGO_DB: string;
  MONGO_PORT: number;
}

const ERROR_MESSAGE = 'Missing or invalid test environment variable:';

export const useTestEnv = (): TestEnv => {
  configDotenv({ path: `.env.test` });
  const { MONGO_PORT, MONGO_IMAGE, MONGO_DB } = process.env;
  const portNumber = Number(MONGO_PORT);

  if (!MONGO_PORT || Number.isNaN(portNumber)) {
    throw new Error(`${ERROR_MESSAGE} MONGO_PORT`);
  }

  if (!MONGO_IMAGE) {
    throw new Error(`${ERROR_MESSAGE} MONGO_IMAGE`);
  }

  if (!MONGO_DB) {
    throw new Error(`${ERROR_MESSAGE} MONGO_DB`);
  }

  return {
    MONGO_IMAGE,
    MONGO_DB,
    MONGO_PORT: portNumber,
  };
};
