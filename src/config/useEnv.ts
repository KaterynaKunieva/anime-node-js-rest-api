import 'dotenv/config';

interface Env {
  EXPRESS_PORT: number;
  EXPRESS_HOST: string;
  MONGO_URI: string;
  ANIME_API_URL: string;
}

const ERROR_MESSAGE = 'Missing or invalid environment variable:';

export const useEnv = (): Env => {
  const { EXPRESS_PORT, EXPRESS_HOST, MONGO_URI, ANIME_API_URL } = process.env;
  const portNumber = Number(EXPRESS_PORT);

  if (!EXPRESS_PORT || Number.isNaN(portNumber)) {
    throw new Error(`${ERROR_MESSAGE} PORT`);
  }

  if (!EXPRESS_HOST) {
    throw new Error(`${ERROR_MESSAGE} EXPRESS_HOST`);
  }

  if (!MONGO_URI) {
    throw new Error(`${ERROR_MESSAGE} MONGO_URI`);
  }

  if (!ANIME_API_URL) {
    throw new Error(`${ERROR_MESSAGE} ANIME_API_URL`);
  }

  return {
    EXPRESS_PORT: portNumber,
    EXPRESS_HOST,
    MONGO_URI,
    ANIME_API_URL,
  };
};
