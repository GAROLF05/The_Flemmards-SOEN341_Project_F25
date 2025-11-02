module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/backend/tests'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/tests/**',
    '!backend/server.js',
    '!backend/config/**',
    '!backend/uploads/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/backend/tests/setup.js'],
  testTimeout: 30000
};

