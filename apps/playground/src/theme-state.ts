import { ref } from 'vue';
import type { FrameTheme, ThemeMode } from './playground-types';

const systemThemeQuery = '(prefers-color-scheme: dark)';

function readSystemTheme(): FrameTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia(systemThemeQuery).matches ? 'dark' : 'light';
}

function readDocumentTheme(): FrameTheme {
  if (typeof document === 'undefined') {
    return readSystemTheme();
  }

  const explicitTheme = document.documentElement.dataset.theme;
  if (explicitTheme === 'light' || explicitTheme === 'dark') {
    return explicitTheme;
  }

  return readSystemTheme();
}

export const resolvedTheme = ref<FrameTheme>(readDocumentTheme());

export function syncResolvedThemeFromDocument(): void {
  resolvedTheme.value = readDocumentTheme();
}

export function applyThemeMode(value: ThemeMode): void {
  if (value === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.dataset.theme = value;
  }

  syncResolvedThemeFromDocument();
}

export function observeSystemTheme(): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }

  const query = window.matchMedia(systemThemeQuery);
  const handleChange = (): void => {
    if (document.documentElement.hasAttribute('data-theme')) {
      return;
    }

    syncResolvedThemeFromDocument();
  };

  query.addEventListener('change', handleChange);
  return () => query.removeEventListener('change', handleChange);
}
