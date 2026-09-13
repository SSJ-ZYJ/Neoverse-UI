<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { applyFrameContextFromDocument, frameLocale } from './frame-state';
import LabSection from './LabSection.vue';
import { labModules, type ModuleId } from './lab-modules';
import { localize } from './playground-content';

const defaultModule: ModuleId = labModules[0].id;
const locale = frameLocale;
const activeModuleId = ref<ModuleId>(moduleFromHash() ?? defaultModule);
const activeModule = ref(labModules.find((module) => module.id === activeModuleId.value));

let attributeObserver: MutationObserver | undefined;

document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en';

function isModuleId(value: unknown): value is ModuleId {
  return typeof value === 'string' && labModules.some((module) => module.id === value);
}

/* Section anchors inside a module (e.g. #controls-action) must not flip the
   board to another module; only real module hashes route the frame. */
function moduleFromHash(): ModuleId | null {
  let value = '';
  try {
    value = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return null;
  }

  return isModuleId(value) ? value : null;
}

function syncActiveModule(): void {
  const nextModuleId = moduleFromHash();
  if (nextModuleId === null) {
    return;
  }

  activeModuleId.value = nextModuleId;
  activeModule.value = labModules.find((module) => module.id === nextModuleId);
}

function handleHashChange(): void {
  syncActiveModule();
}

onMounted(() => {
  window.addEventListener('hashchange', handleHashChange);

  // Keep the isolated frame reactive when test tooling mutates theme or language.
  attributeObserver = new MutationObserver(applyFrameContextFromDocument);
  attributeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'lang'],
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', handleHashChange);
  attributeObserver?.disconnect();
});
</script>

<template>
  <main
    data-design-lab-region="module"
    class="mx-auto flex max-w-container-xl flex-col gap-grid px-gutter-inline py-3"
  >
    <LabSection
      v-if="activeModule"
      :id="activeModule.id"
      :title="localize(activeModule.label, locale)"
      :description="localize(activeModule.description, locale)"
    >
      <component :is="activeModule.component" :locale="locale" />
    </LabSection>
  </main>
</template>
