import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles:  ['./src/tests/setup.js'],
    include:     ['src/tests/**/*.test.js'],
    reporters:   ['verbose'],
    testTimeout: 10000,
  },
});
