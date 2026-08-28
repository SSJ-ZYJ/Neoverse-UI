<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import LabSection from './LabSection.vue';
import { labModules, type ModuleId } from './lab-modules';
import { isLocale, type Locale, localize } from './playground-content';
import type { FrameTheme } from './playground-types';

interface LabBoardProps {
  frameTheme: FrameTheme;
}

const props = defineProps<LabBoardProps>();
const defaultModule: ModuleId = labModules[0].id;
const isEmbedded = window.parent !== window;
const queryLocale = new URLSearchParams(window.location.search).get('lang');
const locale: Locale = isLocale(queryLocale) ? queryLocale : 'en';
const activeModuleId = ref<ModuleId>(moduleFromHash());
const activeModule = ref(labModules.find((module) => module.id === activeModuleId.value));

let resizeObserver: ResizeObserver | undefined;

document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';

function isModuleId(value: unknown): value is ModuleId {
  return typeof value === 'string' && labModules.some((module) => module.id === value);
}

function moduleFromHash(): ModuleId {
  const value = window.location.hash.slice(1);
  return isModuleId(value) ? value : defaultModule;
}

function syncActiveModule(): void {
  const nextModuleId = moduleFromHash();
  activeModuleId.value = nextModuleId;
  activeModule.value = labModules.find((module) => module.id === nextModuleId);
}

function notifyParentHeight(): void {
  if (window.parent === window) {
    return;
  }

  window.parent.postMessage(
    {
      type: 'neoverse-design-lab-height',
      theme: props.frameTheme,
      height: document.documentElement.scrollHeight,
    },
    window.location.origin,
  );
}

function handleHashChange(): void {
  syncActiveModule();
  void nextTick(notifyParentHeight);
}

onMounted(() => {
  window.addEventListener('load', notifyParentHeight);
  window.addEventListener('hashchange', handleHashChange);

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(notifyParentHeight);
    resizeObserver.observe(document.documentElement);
  }

  notifyParentHeight();
});

onBeforeUnmount(() => {
  window.removeEventListener('load', notifyParentHeight);
  window.removeEventListener('hashchange', handleHashChange);
  resizeObserver?.disconnect();
});
</script>

<template>
  <main class="mx-auto flex max-w-container-2xl flex-col gap-grid px-gutter-inline py-gutter-block">
    <LabSection
      v-if="activeModule"
      :id="activeModule.id"
      :title="localize(activeModule.label, locale)"
      :description="localize(activeModule.description, locale)"
      :show-header="!isEmbedded"
    >
      <component :is="activeModule.component" :locale="locale" />
    </LabSection>
  </main>
</template>
