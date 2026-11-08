import { afterEach, describe, expect, test } from 'bun:test';
import { playgroundPreferencesKey } from './playground-preferences';
import { resolveInitialThemeMode } from './theme-runtime';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalPerformance = Object.getOwnPropertyDescriptor(globalThis, 'performance');

function installBrowser(options: {
  search: string;
  stored?: string;
  navigationType?: string;
}): void {
  const storage = new Map<string, string>();
  if (options.stored !== undefined) {
    storage.set(playgroundPreferencesKey, JSON.stringify({ theme: options.stored }));
  }

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: {
      location: { search: options.search },
      localStorage: {
        getItem: (key: string): string | null => storage.get(key) ?? null,
        setItem: (key: string, value: string): void => {
          storage.set(key, value);
        },
      },
    },
  });

  Object.defineProperty(globalThis, 'performance', {
    configurable: true,
    writable: true,
    value: {
      getEntriesByType: (type: string) =>
        type === 'navigation' ? [{ type: options.navigationType ?? 'navigate' }] : [],
    },
  });
}

function restoreGlobal(
  name: 'window' | 'performance',
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor) {
    Object.defineProperty(globalThis, name, descriptor);
  } else {
    delete (globalThis as unknown as Record<string, unknown>)[name];
  }
}

afterEach(() => {
  restoreGlobal('window', originalWindow);
  restoreGlobal('performance', originalPerformance);
});

describe('resolveInitialThemeMode', () => {
  test('treats ?theme= as a fixed preview on a fresh navigation', () => {
    installBrowser({ search: '?theme=dark', stored: 'light' });
    expect(resolveInitialThemeMode()).toBe('dark');
  });

  test('falls back to the stored choice when the URL has no theme', () => {
    installBrowser({ search: '?lang=zh', stored: 'dark' });
    expect(resolveInitialThemeMode()).toBe('dark');
  });

  test('keeps the last interactive choice on reload instead of reverting to the URL', () => {
    installBrowser({ search: '?theme=light', stored: 'dark', navigationType: 'reload' });
    expect(resolveInitialThemeMode()).toBe('dark');
  });

  test('uses the query as a fallback on reload when no choice was stored', () => {
    installBrowser({ search: '?theme=dark', navigationType: 'reload' });
    expect(resolveInitialThemeMode()).toBe('dark');
  });

  test('ignores invalid query values', () => {
    installBrowser({ search: '?theme=neon', stored: 'light' });
    expect(resolveInitialThemeMode()).toBe('light');
  });
});
