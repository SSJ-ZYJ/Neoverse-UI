import { ref } from 'vue';
import type { FrameTheme } from './playground-types';
import { resolveDocumentTheme, subscribeThemeChange } from './theme-runtime';

/* Vue binding for the shared theme engine: it mirrors the resolved
   `data-theme` value into a ref for specimens that need the resolved mode.
   Resolution, application, persistence, and system observation all stay in
   `theme-runtime.ts` so the React fixture runs the same code path. */

export const resolvedTheme = ref<FrameTheme>(resolveDocumentTheme());

export function syncResolvedThemeFromDocument(): void {
  resolvedTheme.value = resolveDocumentTheme();
}

subscribeThemeChange(syncResolvedThemeFromDocument);
