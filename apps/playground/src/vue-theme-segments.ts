import { h } from 'vue';
import LabIcon from './LabIcon.vue';
import { appCopy, type Locale, localize } from './playground-content';
import type { ThemeMode } from './playground-types';

const themeIcons = {
  system: () => h(LabIcon, { name: 'system' }),
  light: () => h(LabIcon, { name: 'light' }),
  dark: () => h(LabIcon, { name: 'dark' }),
};

export function themeSegments(modes: readonly ThemeMode[], locale: Locale) {
  return modes.map((value) => ({
    value,
    label: localize(appCopy.theme.options[value], locale),
    icon: themeIcons[value],
  }));
}
