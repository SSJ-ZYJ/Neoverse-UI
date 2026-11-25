import { animateAppearanceChange, stopAppearanceTransition } from '@neoverse-ui/motion';
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
const fallbackThemeTransitionDuration = 420;
const themeTransitionCleanupBuffer = 32;

let themeTransitionTimeout: number | undefined;
let pendingTheme: { mode: ThemeMode } | undefined;

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

/** Resolve the most recently selected palette, including one still reversing. */
export function resolveRequestedTheme(): FrameTheme {
  const mode = pendingTheme?.mode ?? readDocumentThemeMode();
  return mode === 'system' ? readSystemTheme() : mode;
}

export function readThemeModeFromSearch(search: string): ThemeMode | undefined {
  const value = new URLSearchParams(search).get(themeQueryParameter);
  return isThemeMode(value) ? value : undefined;
}

/** Whether the current document replaces itself through a browser reload. */
export function isReloadNavigation(): boolean {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') {
    return false;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  return navigation?.type === 'reload';
}

/** Match the pre-paint theme selection to the mounted application's policy. */
export function selectInitialThemeMode(
  query: ThemeMode | undefined,
  stored: unknown,
  reloading: boolean,
  modes = themeModes,
  fallback = defaultThemeMode,
): ThemeMode {
  const preference = modes.find((mode) => mode === stored);
  // A fresh link is a fixed preview; a reload keeps the last interactive choice.
  return reloading ? (preference ?? query ?? fallback) : (query ?? preference ?? fallback);
}

export function resolveInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return defaultThemeMode;
  }

  return selectInitialThemeMode(
    readThemeModeFromSearch(window.location.search),
    readPreferences().theme,
    isReloadNavigation(),
  );
}

export function persistThemeMode(value: ThemeMode): void {
  writePreferences({ theme: value });
}

function clearScheduledThemeTransition(root: HTMLElement): void {
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

export function applyThemeMode(value: ThemeMode, animate = true, origin?: Element): void {
  const root = document.documentElement;
  clearScheduledThemeTransition(root);

  const apply = () => applyDocumentThemeMode(root, value);
  if (!animate) {
    stopAppearanceTransition(document);
    pendingTheme = undefined;
    apply();
    return;
  }

  const request = { mode: value };
  pendingTheme = request;
  void animateAppearanceChange(apply, {
    kind: origin ? 'theme-reveal' : 'theme-fade',
    origin,
    theme: {
      current: resolveDocumentTheme,
      next: value === 'system' ? readSystemTheme() : value,
    },
  }).finally(() => {
    if (pendingTheme === request) pendingTheme = undefined;
  });
}

export function observeSystemTheme(): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }

  const query = window.matchMedia(systemThemeQuery);
  const handleChange = (): void => {
    const root = document.documentElement;
    if (pendingTheme?.mode === 'system') stopAppearanceTransition(document);
    if (root.hasAttribute('data-theme')) {
      return;
    }

    stopAppearanceTransition(document);

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
