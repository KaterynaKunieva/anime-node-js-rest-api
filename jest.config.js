export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.test\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  testTimeout: 30000,
  coverageThreshold: {
    global: {
      branches: 44,
      functions: 0,
      lines: 80,
      statements: 10,
    },
  },
  coveragePathIgnorePatterns: [
    "src/index.ts",
    "src/app.ts",
    "src/database.connection.ts",
    "src/useEnv.ts",
    "src/config/*"
  ],
};
