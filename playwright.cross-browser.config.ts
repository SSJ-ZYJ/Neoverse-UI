import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

const playgroundPort = Number(process.env.NEOVERSE_UI_PLAYWRIGHT_PORT ?? 3100);
const playgroundBaseUrl = `http://127.0.0.1:${playgroundPort}`;

export default defineConfig({
  ...baseConfig,
  // The Playground catalogue runs infinite shimmer/pulse/spinner animations.
  // WebKit's software compositor spends whole seconds per protocol round trip
  // while they run, so interaction checks never reach a stable frame. The
  // component stylesheets already disable them for this media preference.
  use: { reducedMotion: 'reduce' },
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
    '**/scrollbar-states.spec.ts',
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
