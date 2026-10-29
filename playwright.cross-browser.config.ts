import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

const playgroundPort = Number(process.env.NEOVERSE_UI_PLAYWRIGHT_PORT ?? 3100);
const playgroundBaseUrl = `http://127.0.0.1:${playgroundPort}`;

export default defineConfig({
  ...baseConfig,
  // Chromium owns the platform release snapshots; this suite validates behavior.
  ignoreSnapshots: true,
  testMatch: [
    '**/component-interactions.spec.ts',
    '**/react-parity.spec.ts',
    '**/audit-regressions.spec.ts',
    '**/form-control-ax.spec.ts',
    '**/form-control-behavior.spec.ts',
    '**/choice-control-behavior.spec.ts',
    '**/overlay-review-regressions.spec.ts',
    '**/overlay-tracking.spec.ts',
    '**/glass-scheduling.spec.ts',
  ],
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
