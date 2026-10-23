import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

const playgroundPort = Number(process.env.NEOVERSE_UI_PLAYWRIGHT_PORT ?? 3100);
const playgroundBaseUrl = `http://127.0.0.1:${playgroundPort}`;

export default defineConfig({
  ...baseConfig,
  testMatch: ['**/component-interactions.spec.ts', '**/react-parity.spec.ts'],
  projects: [
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: playgroundBaseUrl,
        viewport: { width: 1440, height: 900 },
        colorScheme: 'light',
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        baseURL: playgroundBaseUrl,
        viewport: { width: 1440, height: 900 },
        colorScheme: 'light',
      },
    },
  ],
});
