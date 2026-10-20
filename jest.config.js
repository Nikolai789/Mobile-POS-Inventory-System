module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts', '<rootDir>/tests/unit/**/*.test.tsx'],
  setupFiles: ['<rootDir>/tests/setup-env.js'],
  clearMocks: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
};
