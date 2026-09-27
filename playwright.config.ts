import { defineConfig, devices } from '@playwright/test';

const playgroundPort = 3100;
const playgroundBaseUrl = `http://127.0.0.1:${playgroundPort}`;

export default defineConfig({
  testDir: './tests/visual',
  timeout: 30_000,
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  snapshotPathTemplate: '{testDir}/snapshots/{projectName}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.01,
    },
  },
  webServer: {
    command: 'bun apps/playground/src/index.ts',
    url: `${playgroundBaseUrl}/__playground-health`,
    env: {
      PORT: String(playgroundPort),
    },
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: playgroundBaseUrl,
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
        colorScheme: 'light',
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: playgroundBaseUrl,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        hasTouch: true,
        isMobile: true,
        colorScheme: 'light',
      },
    },
  ],
});
