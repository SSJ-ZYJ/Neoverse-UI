import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

// Tests must load Vue's development build even when the host shell exports
// NODE_ENV=production: @vue/test-utils relies on the dev-only `component:emit`
// hook, which is stripped from the production bundle. A shell-level
// NODE_ENV=test prefix does not reach the Node worker that runs Vitest on
// Windows, so the environment is pinned here instead.
process.env.NODE_ENV = 'test';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
  },
});
