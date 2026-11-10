import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

const playgroundPort = Number(process.env.NEOVERSE_UI_PLAYWRIGHT_PORT ?? 3200);

export default defineConfig({
  ...baseConfig,
  testDir: './tests/optics',
  timeout: 60_000,
  workers: 1,
  retries: 0,
  // The software renderer is an optical reference, not a performance benchmark.
  projects: [
    {
      name: 'chromium-swiftshader',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${playgroundPort}`,
        viewport: { width: 900, height: 700 },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
        colorScheme: 'light',
        launchOptions: {
          args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
        },
      },
    },
  ],
});
