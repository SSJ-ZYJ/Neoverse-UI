<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { applyFrameContextFromDocument, frameLocale, frameTheme } from './frame-state';
import LabSection from './LabSection.vue';
import { labModules, type ModuleId } from './lab-modules';
import { localize } from './playground-content';

const defaultModule: ModuleId = labModules[0].id;
const isEmbedded = window.parent !== window;
const locale = frameLocale;
const activeModuleId = ref<ModuleId>(moduleFromHash());
const activeModule = ref(labModules.find((module) => module.id === activeModuleId.value));
const boardElement = ref<HTMLElement | null>(null);

let resizeObserver: ResizeObserver | undefined;
let attributeObserver: MutationObserver | undefined;

document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en';

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
      theme: frameTheme.value,
      height: boardElement.value?.offsetHeight ?? 0,
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

  // The parent mutates data-theme/lang to re-skin this document in place;
  // mirror those changes into the reactive context without a reload.
  attributeObserver = new MutationObserver(applyFrameContextFromDocument);
  attributeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'lang'],
  });

  notifyParentHeight();
});

onBeforeUnmount(() => {
  window.removeEventListener('load', notifyParentHeight);
  window.removeEventListener('hashchange', handleHashChange);
  resizeObserver?.disconnect();
  attributeObserver?.disconnect();
});
</script>

<template>
  <main
    ref="boardElement"
    data-design-lab-region="module"
    class="mx-auto flex max-w-container-xl flex-col gap-grid px-gutter-inline py-3"
  >
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
