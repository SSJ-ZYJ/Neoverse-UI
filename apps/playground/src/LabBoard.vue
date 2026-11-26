<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, provide, ref } from 'vue';
import { applyFrameContextFromDocument, frameLocale } from './frame-state';
import LabSection from './LabSection.vue';
import { labModules, type ModuleId, resolveLabHash, type SpecimenId } from './lab-modules';
import { preloadComponent } from './lazy-component';
import { appearanceControls, applyPlaygroundLocale } from './playground-appearance';
import { localize } from './playground-content';
import { readStageMaterial } from './stage-background';
import { applyThemeMode } from './theme-runtime';

const defaultModule: ModuleId = labModules[0].id;
const locale = frameLocale;
const material = readStageMaterial(window.location.search);
const initialRoute = routeFromHash();
const activeModuleId = ref<ModuleId>(initialRoute?.moduleId ?? defaultModule);
const activeSpecimenId = ref<SpecimenId | null>(initialRoute?.specimenId ?? null);
const activeModule = ref(labModules.find((module) => module.id === activeModuleId.value));

let attributeObserver: MutationObserver | undefined;

document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en';

provide(appearanceControls, {
  setTheme(value, origin) {
    applyThemeMode(value, true, origin);
  },
  setLocale(value) {
    applyPlaygroundLocale(locale, value);
  },
});

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

async function syncActiveModule(): Promise<void> {
  const nextRoute = routeFromHash();
  if (nextRoute === null) {
    return;
  }

  const nextModule = labModules.find((module) => module.id === nextRoute.moduleId);
  await preloadComponent(nextModule?.component);
  activeModuleId.value = nextRoute.moduleId;
  activeSpecimenId.value = nextRoute.specimenId ?? null;
  activeModule.value = nextModule;
  if (activeSpecimenId.value !== null) {
    focusSpecimen(activeSpecimenId.value);
  }
}

function handleHashChange(): void {
  void syncActiveModule();
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
    :data-neoverse-material="material"
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
