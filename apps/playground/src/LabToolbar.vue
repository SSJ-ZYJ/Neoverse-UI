<script setup lang="ts">
import {
  UiIconButton,
  UiSegmentedControl,
  UiSurface,
  useLayoutWidthMotion,
} from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import brandWordmarkUrl from './assets/neoverse-wordmark.svg';
import FpsIndicator from './FpsIndicator.vue';
import LabIcon from './LabIcon.vue';
import { appCopy, type Locale, localize, localized } from './playground-content';
import type { ThemeMode } from './playground-types';
import { defaultThemeMode, themeModes } from './theme-runtime';

const props = defineProps<{
  locale: Locale;
  theme: ThemeMode;
  persistent: boolean;
  openPanel: 'explorer' | 'inspector' | null;
  showFps: boolean;
}>();
const emit = defineEmits<{
  theme: [value: string];
  locale: [value: string];
  panel: [panel: 'explorer' | 'inspector', event: MouseEvent];
}>();

const actions = ref<HTMLElement | null>(null);
// biome-ignore lint/correctness/useHookAtTopLevel: Vue composables belong at <script setup> top level; this is not a React hook.
useLayoutWidthMotion({
  root: actions,
  targets: '[data-toolbar-width-target]',
  trigger: () => props.locale,
});

const themeOptions = computed(() =>
  themeModes.map((value) => ({
    value,
    label: localize(appCopy.theme.options[value], props.locale),
  })),
);
const locales = ['en', 'zh'] as const;
const languageOptions = computed(() =>
  locales.map((value) => ({
    value,
    label: localize(appCopy.language.options[value], props.locale),
  })),
);
const cycleLabel = localized('Cycle theme', '切换主题');
const languageLabel = localized('Switch language', '切换语言');

function cycleTheme(): void {
  emit(
    'theme',
    themeModes[(themeModes.indexOf(props.theme) + 1) % themeModes.length] ?? defaultThemeMode,
  );
}
</script>

<template>
  <UiSurface
    as="header"
    surface="glass-subtle"
    data-neoverse-surface-hover="static"
    class="playground-shell__toolbar"
  >
    <div class="playground-shell__identity">
      <UiIconButton
        v-if="!persistent"
        data-playground-nav-trigger
        variant="ghost"
        surface="none"
        size="sm"
        :label="localize(appCopy.navigation.open, locale)"
        :aria-expanded="openPanel === 'explorer'"
        aria-controls="design-lab-navigation"
        @click="emit('panel', 'explorer', $event)"
      >
        <LabIcon name="menu" />
      </UiIconButton>
      <span
        data-playground-brand-logo
        role="img"
        :aria-label="localize(appCopy.brand, locale)"
        class="playground-shell__brand-wordmark text-primary"
        :style="{ maskImage: `url('${brandWordmarkUrl}')` }"
      />
      <h1 class="playground-shell__name text-label-lg font-label text-secondary">
        {{ localize(appCopy.designLab, locale) }}
      </h1>
    </div>
    <div ref="actions" class="playground-shell__toolbar-actions">
      <FpsIndicator v-if="showFps" />
      <UiIconButton
        data-toolbar-width-target
        class="sm:hidden"
        size="sm"
        variant="ghost"
        surface="none"
        :label="`${localize(cycleLabel, locale)}: ${localize(appCopy.theme.options[theme], locale)}`"
        @click="cycleTheme"
      >
        <LabIcon name="spark" />
      </UiIconButton>
      <UiIconButton
        data-toolbar-width-target
        class="sm:hidden"
        size="sm"
        variant="ghost"
        surface="none"
        :label="`${localize(languageLabel, locale)}: ${localize(appCopy.language.options[locale], locale)}`"
        @click="emit('locale', locale === 'zh' ? 'en' : 'zh')"
      >
        <LabIcon name="globe" />
      </UiIconButton>
      <UiSegmentedControl
        data-toolbar-width-target
        class="hidden sm:inline-flex"
        :aria-label="localize(appCopy.theme.label, locale)"
        :options="themeOptions"
        :model-value="theme"
        surface="none"
        @update:model-value="emit('theme', $event)"
      />
      <UiSegmentedControl
        data-toolbar-width-target
        class="hidden sm:inline-flex"
        :aria-label="localize(appCopy.language.label, locale)"
        :options="languageOptions"
        :model-value="locale"
        surface="none"
        @update:model-value="emit('locale', $event)"
      />
      <UiIconButton
        v-if="!persistent"
        data-playground-inspector-trigger
        variant="ghost"
        surface="none"
        size="sm"
        :label="localize(appCopy.inspector.open, locale)"
        :aria-expanded="openPanel === 'inspector'"
        aria-controls="design-lab-inspector"
        @click="emit('panel', 'inspector', $event)"
      >
        <LabIcon name="inspector" />
      </UiIconButton>
    </div>
  </UiSurface>
</template>
