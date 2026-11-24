<script setup lang="ts">
import { UiIconButton, UiSegmentedControl, UiSurface } from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import brandWordmarkUrl from './assets/neoverse-wordmark.svg';
import FpsIndicator from './FpsIndicator.vue';
import LabIcon from './LabIcon.vue';
import { appCopy, type Locale, localize, localized } from './playground-content';
import type { ThemeMode } from './playground-types';
import { languageSegments } from './preference-segments';
import { defaultThemeMode, themeModes } from './theme-runtime';
import { themeSegments } from './vue-theme-segments';

const props = defineProps<{
  locale: Locale;
  requestedLocale: Locale;
  theme: ThemeMode;
  persistent: boolean;
  openPanel: 'explorer' | 'inspector' | null;
  showFps: boolean;
}>();
const emit = defineEmits<{
  theme: [value: string, origin: Element | undefined];
  locale: [value: string];
  panel: [panel: 'explorer' | 'inspector', event: MouseEvent];
}>();

const actions = ref<HTMLElement | null>(null);
const themeOptions = computed(() => themeSegments(themeModes, props.locale));
const languageOptions = computed(() => languageSegments(props.locale));
const cycleLabel = localized('Cycle theme', '切换主题');
const languageLabel = localized('Switch language', '切换语言');

function cycleTheme(event: MouseEvent): void {
  emit(
    'theme',
    themeModes[(themeModes.indexOf(props.theme) + 1) % themeModes.length] ?? defaultThemeMode,
    event.currentTarget instanceof Element ? event.currentTarget : undefined,
  );
}

function selectTheme(value: string): void {
  const origin = actions.value?.querySelector('[data-playground-theme-control="segments"]');
  emit('theme', value, origin ?? undefined);
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
        data-playground-theme-control="cycle"
        class="sm:hidden"
        size="sm"
        variant="ghost"
        surface="none"
        :label="`${localize(cycleLabel, locale)}: ${localize(appCopy.theme.options[theme], locale)}`"
        @click="cycleTheme"
      >
        <LabIcon :name="theme" />
      </UiIconButton>
      <UiIconButton
        class="sm:hidden"
        size="sm"
        variant="ghost"
        surface="none"
        :label="`${localize(languageLabel, locale)}: ${localize(appCopy.language.options[requestedLocale], locale)}`"
        @click="emit('locale', requestedLocale === 'zh' ? 'en' : 'zh')"
      >
        <LabIcon name="globe" />
      </UiIconButton>
      <UiSegmentedControl
        data-playground-theme-control="segments"
        class="hidden sm:inline-flex"
        :aria-label="localize(appCopy.theme.label, locale)"
        :options="themeOptions"
        :model-value="theme"
        variant="icon"
        @update:model-value="selectTheme"
      />
      <UiSegmentedControl
        class="hidden sm:inline-flex"
        :aria-label="localize(appCopy.language.label, locale)"
        :options="languageOptions"
        :model-value="requestedLocale"
        variant="language"
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
