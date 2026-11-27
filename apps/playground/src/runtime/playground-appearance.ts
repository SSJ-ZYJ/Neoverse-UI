import { animateAppearanceChange } from '@neoverse-ui/motion';
import { type InjectionKey, nextTick, type Ref } from 'vue';
import type { Locale } from '../content/playground-content';
import type { ThemeMode } from './playground-types';

export const appearanceControls: InjectionKey<{
  setTheme: (value: ThemeMode, origin?: Element) => void;
  setLocale: (value: Locale) => void;
}> = Symbol('playground-appearance');

export function applyPlaygroundLocale(locale: Ref<Locale>, value: Locale): void {
  const update = () => {
    locale.value = value;
    document.documentElement.lang = value === 'zh' ? 'zh-CN' : 'en';
    return nextTick();
  };
  void animateAppearanceChange(update, { kind: 'locale' });
}
