/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'backend',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/tests/unit/**/*.test.ts',
        '<rootDir>/tests/integration/**/*.test.ts',
      ],
      moduleNameMapper: {
        '^@backend/(.*)$': '<rootDir>/src/backend/$1',
        '^@frontend/(.*)$': '<rootDir>/src/frontend/$1',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
      },
    },
    {
      displayName: 'frontend',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/tests/unit/**/*.test.tsx'],
      moduleNameMapper: {
        '^@backend/(.*)$': '<rootDir>/src/backend/$1',
        '^@frontend/(.*)$': '<rootDir>/src/frontend/$1',
        '\\.module\\.css$': '<rootDir>/tests/__mocks__/styleMock.js',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
      },
      setupFilesAfterFramework: ['@testing-library/jest-dom'],
    },
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/backend/server.ts',
  ],
};
