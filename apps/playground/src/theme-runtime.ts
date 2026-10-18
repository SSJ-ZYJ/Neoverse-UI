import { readPreferences, writePreferences } from './playground-preferences';
import type { FrameTheme, ThemeMode } from './playground-types';

/* Framework-neutral theme engine for the Playground. The Vue shell and the
   React runtime fixture resolve, persist, apply, and observe the theme through
   this module only, so `data-theme` stays the single selection contract on both
   surfaces. `theme-state.ts` is the Vue binding of this engine. */

export const themeModes: readonly ThemeMode[] = ['system', 'light', 'dark'];
const frameThemeModes = themeModes.filter((mode): mode is FrameTheme => mode !== 'system');
export const defaultThemeMode: ThemeMode = 'system';

const themeQueryParameter = 'theme';
const systemThemeQuery = '(prefers-color-scheme: dark)';
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
const themeTransitionAttribute = 'data-neoverse-theme-transitioning';
const themeViewTransitionAttribute = 'data-neoverse-theme-view-transitioning';
const fallbackThemeTransitionDuration = 420;
const themeTransitionCleanupBuffer = 32;

let themeTransitionFrame: number | undefined;
let themeTransitionTimeout: number | undefined;
let activeThemeViewTransition: ViewTransition | undefined;
let themeTransitionRequest = 0;

const themeChangeListeners = new Set<() => void>();

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && themeModes.includes(value as ThemeMode);
}

export function isFrameTheme(value: unknown): value is FrameTheme {
  return typeof value === 'string' && frameThemeModes.includes(value as FrameTheme);
}

function notifyThemeChange(): void {
  for (const listener of themeChangeListeners) {
    listener();
  }
}

export function subscribeThemeChange(listener: () => void): () => void {
  themeChangeListeners.add(listener);

  return () => {
    themeChangeListeners.delete(listener);
  };
}

function readSystemTheme(): FrameTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia(systemThemeQuery).matches ? 'dark' : 'light';
}

function readDocumentThemeMode(): ThemeMode {
  if (typeof document === 'undefined') {
    return defaultThemeMode;
  }

  const explicitMode = document.documentElement.dataset.theme;
  return isThemeMode(explicitMode) ? explicitMode : defaultThemeMode;
}

export function resolveDocumentTheme(): FrameTheme {
  const mode = readDocumentThemeMode();
  return mode === 'system' ? readSystemTheme() : mode;
}

export function readThemeModeFromSearch(search: string): ThemeMode | undefined {
  const value = new URLSearchParams(search).get(themeQueryParameter);
  return isThemeMode(value) ? value : undefined;
}

function readStoredThemeMode(): ThemeMode | undefined {
  const value = readPreferences().theme;
  return isThemeMode(value) ? value : undefined;
}

export function resolveInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return defaultThemeMode;
  }

  return (
    readThemeModeFromSearch(window.location.search) ?? readStoredThemeMode() ?? defaultThemeMode
  );
}

export function persistThemeMode(value: ThemeMode): void {
  writePreferences({ theme: value });
}

export function syncThemeModeToQuery(value: ThemeMode): void {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set(themeQueryParameter, value);
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

function clearScheduledThemeTransition(root: HTMLElement): void {
  activeThemeViewTransition?.skipTransition();
  activeThemeViewTransition = undefined;
  root.removeAttribute(themeViewTransitionAttribute);

  if (themeTransitionFrame !== undefined) {
    window.cancelAnimationFrame(themeTransitionFrame);
    themeTransitionFrame = undefined;
  }

  if (themeTransitionTimeout !== undefined) {
    window.clearTimeout(themeTransitionTimeout);
    themeTransitionTimeout = undefined;
  }

  root.removeAttribute(themeTransitionAttribute);
}

function shouldReduceMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(reducedMotionQuery).matches;
}

function readThemeTransitionDuration(root: HTMLElement): number {
  const duration = window
    .getComputedStyle(root)
    .getPropertyValue('--neoverse-motion-theme-fallback-duration')
    .trim();
  const value = Number.parseFloat(duration);

  if (!Number.isFinite(value)) {
    return fallbackThemeTransitionDuration;
  }

  if (duration.endsWith('ms')) {
    return value;
  }

  if (duration.endsWith('s')) {
    return value * 1000;
  }

  return fallbackThemeTransitionDuration;
}

function scheduleThemeTransitionCleanup(root: HTMLElement): void {
  themeTransitionTimeout = window.setTimeout(() => {
    root.removeAttribute(themeTransitionAttribute);
    themeTransitionTimeout = undefined;
  }, readThemeTransitionDuration(root) + themeTransitionCleanupBuffer);
}

function applyDocumentThemeMode(root: HTMLElement, value: ThemeMode): void {
  if (value === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.dataset.theme = value;
  }

  notifyThemeChange();
}

export function applyThemeMode(value: ThemeMode, animate = true): void {
  const root = document.documentElement;
  const request = ++themeTransitionRequest;
  clearScheduledThemeTransition(root);

  if (!animate || shouldReduceMotion()) {
    applyDocumentThemeMode(root, value);
    return;
  }

  if (typeof document.startViewTransition === 'function') {
    root.setAttribute(themeViewTransitionAttribute, '');
    const transition = document.startViewTransition(() => {
      if (request !== themeTransitionRequest) {
        return;
      }
      applyDocumentThemeMode(root, value);
    });
    activeThemeViewTransition = transition;
    const finish = (): void => {
      if (activeThemeViewTransition === transition) {
        activeThemeViewTransition = undefined;
        root.removeAttribute(themeViewTransitionAttribute);
      }
    };
    void transition.finished.then(finish, finish);
    return;
  }

  root.setAttribute(themeTransitionAttribute, '');
  themeTransitionFrame = window.requestAnimationFrame(() => {
    // Let the transition properties reach a painted frame before changing the
    // inherited text colors and theme tokens.
    themeTransitionFrame = window.requestAnimationFrame(() => {
      themeTransitionFrame = undefined;
      applyDocumentThemeMode(root, value);
      scheduleThemeTransitionCleanup(root);
    });
  });
}

export function observeSystemTheme(): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }

  const query = window.matchMedia(systemThemeQuery);
  const handleChange = (): void => {
    const root = document.documentElement;
    if (root.hasAttribute('data-theme')) {
      return;
    }

    clearScheduledThemeTransition(root);
    if (!shouldReduceMotion()) {
      root.setAttribute(themeTransitionAttribute, '');
      scheduleThemeTransitionCleanup(root);
    }
    notifyThemeChange();
  };

  query.addEventListener('change', handleChange);
  return () => query.removeEventListener('change', handleChange);
}
