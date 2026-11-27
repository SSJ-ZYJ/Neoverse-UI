import { ref } from 'vue';
import { isLocale, type Locale } from '../content/playground-content';
import { syncResolvedThemeFromDocument } from '../runtime/theme-state';

/** Whether the current document is the isolated diagnostic view */
export const frameView = window.location.pathname === '/frame';

/* The isolated frame keeps content alive across theme and language switches by
   observing this document's attributes. Theme resolution itself is shared
   with the main Playground shell. */
const queryLocale = new URLSearchParams(window.location.search).get('lang');
export const frameLocale = ref<Locale>(isLocale(queryLocale) ? queryLocale : 'en');

export function applyFrameContextFromDocument(): void {
  syncResolvedThemeFromDocument();
  const language = document.documentElement.lang.toLowerCase();
  frameLocale.value = language.startsWith('zh') ? 'zh' : 'en';
}
