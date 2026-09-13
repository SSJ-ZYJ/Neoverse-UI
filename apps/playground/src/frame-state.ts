import { ref } from 'vue';
import { isLocale, type Locale } from './playground-content';
import { syncResolvedThemeFromDocument } from './theme-state';

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
