<script setup lang="ts">
import {
  UiAction,
  UiControlSurface,
  UiNavigationItem,
  UiSegmentedControl,
  UiStatusIndicator,
} from '@neoverse-ui/vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import LabIcon from '../LabIcon.vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.consumerParity;
const language = ref('en');
const activeNavigationId = ref('home');
const hoveredNavigationId = ref<string | null>(null);
const compactNavigation = ref(false);
let compactNavigationQuery: MediaQueryList | undefined;

function updateCompactNavigation(query: MediaQueryList | MediaQueryListEvent): void {
  compactNavigation.value = query.matches;
}

onMounted(() => {
  compactNavigationQuery = window.matchMedia('(max-width: 520px)');
  updateCompactNavigation(compactNavigationQuery);
  compactNavigationQuery.addEventListener('change', updateCompactNavigation);
});

onBeforeUnmount(() => {
  compactNavigationQuery?.removeEventListener('change', updateCompactNavigation);
});

const heroActions = [
  { label: 'Website', icon: 'globe', primary: true },
  { label: 'Blog', icon: 'article', primary: false },
  { label: 'Linux.Do', icon: 'message', primary: false },
  { label: 'RedNote', icon: 'bookmark', primary: false },
  { label: 'Email', icon: 'mail', primary: false },
  { label: 'GitHub', icon: 'github', primary: false },
] as const;

const navigationItems = computed(
  () =>
    [
      { id: 'home', label: localize(copy.navigation.items.home, props.locale), icon: 'home' },
      {
        id: 'projects',
        label: localize(copy.navigation.items.projects, props.locale),
        icon: 'folder',
      },
      { id: 'focus', label: localize(copy.navigation.items.focus, props.locale), icon: 'target' },
      {
        id: 'pulse',
        label: localize(copy.navigation.items.pulse, props.locale),
        icon: 'activity',
      },
    ] as const,
);

const activeNavigationIndex = computed(() => {
  const index = navigationItems.value.findIndex((item) => item.id === activeNavigationId.value);
  return Math.max(index, 0);
});
const hoverNavigationIndex = computed(() => {
  if (hoveredNavigationId.value === null) {
    return activeNavigationIndex.value;
  }

  const index = navigationItems.value.findIndex((item) => item.id === hoveredNavigationId.value);
  return Math.max(index, 0);
});
const activeIndicatorStyle = computed(() => ({
  left: `${activeNavigationIndex.value * 25}%`,
}));
const hoverIndicatorStyle = computed(() => ({
  left: `${hoverNavigationIndex.value * 25}%`,
}));
const languageOptions = computed(
  () =>
    [
      { value: 'en', label: 'EN', ariaLabel: props.locale === 'zh' ? '英语' : 'English' },
      {
        value: 'zh',
        label: '中',
        ariaLabel: props.locale === 'zh' ? '简体中文' : 'Simplified Chinese',
      },
    ] as const,
);
</script>

<template>
  <MaterialBackdrop>
    <div class="grid min-w-0 gap-grid">
      <section class="grid min-w-0 gap-3" aria-labelledby="consumer-parity-hero-title">
        <header class="grid gap-1">
          <h3 id="consumer-parity-hero-title" class="text-subtitle font-heading tracking-heading">
            {{ localize(copy.hero.label, props.locale) }}
          </h3>
          <p class="text-caption text-secondary">
            {{ localize(copy.hero.description, props.locale) }}
          </p>
        </header>

        <div
          class="grid min-h-64 min-w-0 content-center gap-4 rounded-panel bg-surface-subtle p-5 shadow-card"
        >
          <UiStatusIndicator status="success" pulse role="status">
            {{ localize(copy.hero.status, props.locale) }}
          </UiStatusIndicator>
          <div class="max-w-container-md">
            <p class="text-caption font-label text-accent-primary">Neoverse</p>
            <h4
              class="mt-2 text-heading font-heading leading-heading tracking-heading text-primary"
            >
              {{ localize(copy.hero.title, props.locale) }}
            </h4>
            <p class="mt-2 text-body text-secondary">
              {{ localize(copy.hero.summary, props.locale) }}
            </p>
          </div>
          <div
            class="flex min-w-0 flex-wrap items-center gap-2"
            data-consumer-parity="hero-actions"
          >
            <UiAction
              v-for="action in heroActions"
              :key="action.label"
              href="#consumer-parity"
              :variant="action.primary ? 'primary' : 'ghost'"
              size="md"
            >
              <template #leading><LabIcon :name="action.icon" /></template>
              {{ action.label }}
            </UiAction>
          </div>
        </div>
      </section>

      <section class="grid min-w-0 gap-3" aria-labelledby="consumer-parity-navigation-title">
        <header class="grid gap-1">
          <h3
            id="consumer-parity-navigation-title"
            class="text-subtitle font-heading tracking-heading"
          >
            {{ localize(copy.navigation.label, props.locale) }}
          </h3>
          <p class="text-caption text-secondary">
            {{ localize(copy.navigation.description, props.locale) }}
          </p>
        </header>

        <div
          class="flex min-h-40 min-w-0 items-center justify-center rounded-panel bg-surface-subtle p-2 shadow-card sm:p-4"
        >
          <UiControlSurface
            as="nav"
            class="consumer-parity-dock"
            :aria-label="localize(copy.navigation.ariaLabel, props.locale)"
            data-consumer-parity="floating-navigation"
          >
            <span
              class="consumer-parity-dock__active-indicator"
              aria-hidden="true"
              :style="activeIndicatorStyle"
            />
            <span
              class="consumer-parity-dock__hover-indicator"
              :class="{ 'consumer-parity-dock__hover-indicator--visible': hoveredNavigationId !== null }"
              aria-hidden="true"
              :style="hoverIndicatorStyle"
            />
            <UiNavigationItem
              v-for="item in navigationItems"
              :key="item.id"
              class="consumer-parity-dock__item"
              href="#consumer-parity"
              :label="item.label"
              :active="item.id === activeNavigationId"
              :compact="compactNavigation"
              @click.prevent="activeNavigationId = item.id"
              @pointerenter="hoveredNavigationId = item.id"
              @pointerleave="hoveredNavigationId = null"
              @focus="hoveredNavigationId = item.id"
              @blur="hoveredNavigationId = null"
            >
              <template #icon><LabIcon :name="item.icon" /></template>
            </UiNavigationItem>
            <template #trailing>
              <UiSegmentedControl
                v-model="language"
                class="consumer-parity-dock__language"
                :aria-label="localize(copy.navigation.languageLabel, props.locale)"
                :options="languageOptions"
              />
            </template>
          </UiControlSurface>
        </div>
      </section>
    </div>
  </MaterialBackdrop>
</template>
