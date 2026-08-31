import { ref } from 'vue';
import { isLocale, type Locale } from './playground-content';
import type { FrameTheme } from './playground-types';

/* The shell keeps frame content alive across theme and language switches by
   mutating this document's `data-theme`/`lang` attributes; App.vue observes
   those attributes and re-reads them into these refs, so frame components
   stay reactive without reloading the iframe. */
export const frameTheme = ref<FrameTheme>(
  document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
);

const queryLocale = new URLSearchParams(window.location.search).get('lang');
export const frameLocale = ref<Locale>(isLocale(queryLocale) ? queryLocale : 'en');

export function applyFrameContextFromDocument(): void {
  frameTheme.value = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  const language = document.documentElement.lang.toLowerCase();
  frameLocale.value = language.startsWith('zh') ? 'zh' : 'en';
}
