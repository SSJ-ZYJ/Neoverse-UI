import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

const playgroundPort = Number(process.env.NEOVERSE_UI_PLAYWRIGHT_PORT ?? 3200);
const playgroundBaseUrl = `http://127.0.0.1:${playgroundPort}`;

export default defineConfig({
  ...baseConfig,
  // The component stylesheets already disable the Playground's infinite
  // shimmer/pulse/spinner animations for this media preference, which keeps the
  // software compositor responsive enough for interaction checks.
  use: { reducedMotion: 'reduce' },
  testMatch: [
    '**/forms.spec.ts',
    '**/overlays.spec.ts',
    '**/navigation.spec.ts',
    '**/surfaces.spec.ts',
    '**/motion.spec.ts',
    '**/parity.spec.ts',
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
      // On the software-rendered CI runner WebKit needs roughly twice as long
      // per interaction as Chromium/Firefox. Assertions and retries stay
      // unchanged; only the wall-clock budget for the same work is extended.
      timeout: 60_000,
      use: {
        ...devices['Desktop Safari'],
        baseURL: playgroundBaseUrl,
        viewport: { width: 1440, height: 900 },
        colorScheme: 'light',
      },
    },
  ],
});
