import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'packages/**/*.test.tsx', 'hosting/**/*.test.ts'],
    environment: 'node',
  },
});
