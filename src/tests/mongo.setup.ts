import { GenericContainer, StartedTestContainer } from 'testcontainers';
import mongoose from 'mongoose';
import { useTestEnv } from './useTestEnv';

let container: StartedTestContainer;

/**
 * Starts a MongoDB Docker container and establishes a connection via Mongoose.
 * @returns A promise that resolves when the container is started and connected.
 */
export const startMongoContainer = async (): Promise<void> => {
  const { MONGO_PORT, MONGO_IMAGE, MONGO_DB } = useTestEnv();

  // Initialize and start the container
  container = await new GenericContainer(MONGO_IMAGE)
    .withExposedPorts(MONGO_PORT)
    .start();

  const host = container.getHost();
  const port = container.getMappedPort(MONGO_PORT);
  const mongoUri = `mongodb://${host}:${port}/${MONGO_DB}`;

  // Connect Mongoose to the ephemeral container instance
  await mongoose.connect(mongoUri);
};

/**
 * Disconnects the Mongoose client and stops the MongoDB Docker container.
 * @returns A promise that resolves when cleanup is complete.
 */
export const stopMongoContainer = async (): Promise<void> => {
  // Gracefully close the database connection if it is open
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Stop and remove the Docker container
  if (container) {
    await container.stop();
  }
};

/**
 * Clears all data from every collection in the current database.
 * @returns A promise that resolves once all collections are emptied.
 */
export const clearDatabase = async (): Promise<void> => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};
