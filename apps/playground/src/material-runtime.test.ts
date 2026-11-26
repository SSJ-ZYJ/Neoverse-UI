import { afterEach, describe, expect, test } from 'bun:test';
import {
  isMaterialMode,
  persistMaterialMode,
  readMaterialFromSearch,
  resolveInitialMaterialMode,
  selectInitialMaterialMode,
} from './material-runtime';
import { playgroundPreferencesKey } from './playground-preferences';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalPerformance = Object.getOwnPropertyDescriptor(globalThis, 'performance');

function installBrowser(options: { search: string; stored?: unknown; navigationType?: string }) {
  const storage = new Map<string, string>();
  if (options.stored !== undefined) {
    storage.set(playgroundPreferencesKey, JSON.stringify({ material: options.stored }));
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

  return storage;
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

describe('material resolution', () => {
  test('accepts only the two published modes', () => {
    expect(isMaterialMode('glass')).toBe(true);
    expect(isMaterialMode('solid')).toBe(true);
    expect(isMaterialMode('neon')).toBe(false);
    expect(isMaterialMode(undefined)).toBe(false);
  });

  test('reads a known query value and ignores anything else', () => {
    expect(readMaterialFromSearch('?material=solid')).toBe('solid');
    expect(readMaterialFromSearch('?material=glass&theme=dark')).toBe('glass');
    expect(readMaterialFromSearch('?material=translucent')).toBeUndefined();
    expect(readMaterialFromSearch('')).toBeUndefined();
  });

  test('keeps ?material= a temporary preview without writing a preference', () => {
    const storage = installBrowser({ search: '?material=solid', stored: 'glass' });
    expect(resolveInitialMaterialMode()).toBe('solid');
    expect(storage.get(playgroundPreferencesKey)).toBe(JSON.stringify({ material: 'glass' }));
  });

  test('keeps the last interactive choice on reload instead of the URL', () => {
    installBrowser({ search: '?material=glass', stored: 'solid', navigationType: 'reload' });
    expect(resolveInitialMaterialMode()).toBe('solid');
  });

  test('falls back to the query on reload when nothing was chosen', () => {
    installBrowser({ search: '?material=solid', navigationType: 'reload' });
    expect(resolveInitialMaterialMode()).toBe('solid');
  });

  test('defaults to Aurora Glass without a choice or a valid query', () => {
    installBrowser({ search: '?material=neon', stored: 'unknown' });
    expect(resolveInitialMaterialMode()).toBe('glass');
  });

  test('separates the material policy from the theme policy', () => {
    const stored = { theme: 'dark', material: 'solid' };
    expect(selectInitialMaterialMode(undefined, stored.material, false)).toBe('solid');
    expect(selectInitialMaterialMode('glass', stored.material, false)).toBe('glass');
  });

  test('persists only the toolbar selection', () => {
    const storage = installBrowser({ search: '' });
    persistMaterialMode('solid');
    expect(storage.get(playgroundPreferencesKey)).toBe(JSON.stringify({ material: 'solid' }));
  });
});
