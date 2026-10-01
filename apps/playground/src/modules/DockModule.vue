<script setup lang="ts">
import { UiDock, UiNavigationItem, UiSegmentedControl } from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import LabIcon from '../LabIcon.vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.dock;
const activeNavigationId = ref('home');
const language = ref('en');

const navigationItems = computed(
  () =>
    [
      { id: 'home', label: localize(copy.items.home, props.locale), icon: 'home' },
      { id: 'projects', label: localize(copy.items.projects, props.locale), icon: 'folder' },
      { id: 'focus', label: localize(copy.items.focus, props.locale), icon: 'target' },
      { id: 'activity', label: localize(copy.items.activity, props.locale), icon: 'activity' },
    ] as const,
);

const languageOptions = computed(() => [
  { value: 'en', label: 'EN', ariaLabel: props.locale === 'zh' ? '英语' : 'English' },
  {
    value: 'zh',
    label: '中',
    ariaLabel: props.locale === 'zh' ? '简体中文' : 'Simplified Chinese',
  },
]);
</script>

<template>
  <div id="dock-component" class="grid min-w-0 gap-5">
    <MaterialBackdrop>
      <div class="grid gap-6">
        <section class="grid gap-3" data-dock-specimen="standard">
          <header class="grid gap-1">
            <h3 class="text-label-lg font-label text-primary">
              {{ localize(copy.states.standard.label, props.locale) }}
            </h3>
            <p class="max-w-reading-wide text-body-sm text-secondary">
              {{ localize(copy.states.standard.hint, props.locale) }}
            </p>
          </header>
          <div class="playground-dock-preview scrollbar-immersive" data-dock-preview>
            <div class="playground-dock-preview__content">
              <UiDock :aria-label="localize(copy.ariaLabel, props.locale)">
                <UiNavigationItem
                  v-for="item in navigationItems"
                  :key="item.id"
                  href="#dock-component"
                  :label="item.label"
                  :active="activeNavigationId === item.id"
                  surface="none"
                  @click.prevent="activeNavigationId = item.id"
                >
                  <template #icon><LabIcon :name="item.icon" /></template>
                </UiNavigationItem>
                <template #trailing>
                  <UiSegmentedControl
                    v-model="language"
                    surface="none"
                    :aria-label="localize(copy.languageLabel, props.locale)"
                    :options="languageOptions"
                  />
                </template>
              </UiDock>
            </div>
          </div>
        </section>

        <section class="grid gap-3" data-dock-specimen="compact">
          <header class="grid gap-1">
            <h3 class="text-label-lg font-label text-primary">
              {{ localize(copy.states.compact.label, props.locale) }}
            </h3>
            <p class="max-w-reading-wide text-body-sm text-secondary">
              {{ localize(copy.states.compact.hint, props.locale) }}
            </p>
          </header>
          <div class="playground-dock-preview scrollbar-immersive" data-dock-preview>
            <div class="playground-dock-preview__content">
              <UiDock compact scale="md" :aria-label="localize(copy.ariaLabel, props.locale)">
                <UiNavigationItem
                  v-for="item in navigationItems"
                  :key="item.id"
                  href="#dock-component"
                  :label="item.label"
                  :active="activeNavigationId === item.id"
                  compact
                  surface="none"
                  @click.prevent="activeNavigationId = item.id"
                >
                  <template #icon><LabIcon :name="item.icon" /></template>
                </UiNavigationItem>
                <template #trailing>
                  <UiSegmentedControl
                    v-model="language"
                    surface="none"
                    :aria-label="localize(copy.languageLabel, props.locale)"
                    :options="languageOptions"
                  />
                </template>
              </UiDock>
            </div>
          </div>
        </section>
      </div>
    </MaterialBackdrop>
  </div>
</template>
