<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { applyFrameContextFromDocument, frameLocale } from './frame-state';
import LabSection from './LabSection.vue';
import { labModules, type ModuleId, resolveLabHash, type SpecimenId } from './lab-modules';
import { localize } from './playground-content';

const defaultModule: ModuleId = labModules[0].id;
const locale = frameLocale;
const initialRoute = routeFromHash();
const activeModuleId = ref<ModuleId>(initialRoute?.moduleId ?? defaultModule);
const activeSpecimenId = ref<SpecimenId | null>(initialRoute?.specimenId ?? null);
const activeModule = ref(labModules.find((module) => module.id === activeModuleId.value));

let attributeObserver: MutationObserver | undefined;

document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en';

function routeFromHash() {
  let value = '';
  try {
    value = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return null;
  }
  return resolveLabHash(value);
}

function focusSpecimen(specimenId: SpecimenId): void {
  void nextTick(() => {
    window.requestAnimationFrame(() => {
      document.getElementById(specimenId)?.scrollIntoView({
        block: 'start',
        inline: 'nearest',
        behavior: 'auto',
      });
    });
  });
}

function syncActiveModule(): void {
  const nextRoute = routeFromHash();
  if (nextRoute === null) {
    return;
  }

  activeModuleId.value = nextRoute.moduleId;
  activeSpecimenId.value = nextRoute.specimenId ?? null;
  activeModule.value = labModules.find((module) => module.id === nextRoute.moduleId);
  if (activeSpecimenId.value !== null) {
    focusSpecimen(activeSpecimenId.value);
  }
}

function handleHashChange(): void {
  syncActiveModule();
}

onMounted(() => {
  window.addEventListener('hashchange', handleHashChange);
  if (activeSpecimenId.value !== null) {
    focusSpecimen(activeSpecimenId.value);
  }

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
    class="mx-auto flex max-w-content flex-col gap-grid px-page-inline py-3"
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
