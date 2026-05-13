/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  projects: [
    {
      displayName: 'shared',
      testEnvironment: 'node',
      transform: { '^.+\\.ts$': 'ts-jest' },
      testMatch: ['<rootDir>/packages/shared/src/**/__tests__/**/*.test.ts'],
    },
    {
      displayName: 'inventory',
      testEnvironment: 'node',
      transform: { '^.+\\.ts$': 'ts-jest' },
      testMatch: ['<rootDir>/services/inventory/src/**/__tests__/**/*.test.ts'],
    },
    {
      displayName: 'orders',
      testEnvironment: 'node',
      transform: { '^.+\\.ts$': 'ts-jest' },
      testMatch: ['<rootDir>/services/orders/src/**/__tests__/**/*.test.ts'],
    },
    {
      displayName: 'api-gateway',
      testEnvironment: 'node',
      transform: { '^.+\\.ts$': 'ts-jest' },
      testMatch: ['<rootDir>/services/api-gateway/src/**/__tests__/**/*.test.ts'],
    },
  ],
};
