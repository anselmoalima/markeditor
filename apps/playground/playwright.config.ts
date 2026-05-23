import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // webkit requires system deps (libevent, libavif); CI installs via --with-deps (task_10)
    ...(process.env.CI ? [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }] : []),
  ],
  webServer: {
    command: 'pnpm --filter playground preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
