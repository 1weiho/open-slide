import { defineConfig, devices } from '@playwright/test';

export const DEV_SERVER_PORT = 43117;

export default defineConfig({
  testDir: './e2e/tests',
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://127.0.0.1:${DEV_SERVER_PORT}`,
    contextOptions: { reducedMotion: 'reduce' },
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `node e2e/start-dev-server.mjs --port ${DEV_SERVER_PORT}`,
    url: `http://127.0.0.1:${DEV_SERVER_PORT}/`,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
