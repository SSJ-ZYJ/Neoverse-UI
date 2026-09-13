<script setup lang="ts">
import { UiButton, UiIconButton, UiNavigationItem, UiSegmentedControl } from '@neoverse-ui/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import brandIconUrl from './assets/neoverse-ui-icon.svg';
import LabBoard from './LabBoard.vue';
import LabIcon from './LabIcon.vue';
import { labModules, type ModuleId, moduleGroups } from './lab-modules';
import { appCopy, formatLocalized, isLocale, type Locale, localize } from './playground-content';
import type { FrameTheme, ThemeMode } from './playground-types';
import { applyThemeMode, observeSystemTheme } from './theme-state';

const isFrame = window.location.pathname === '/frame';
const preferencesStorageKey = 'neoverse-design-lab.preferences';

type SavedState = {
  theme?: ThemeMode;
  module?: ModuleId;
  locale?: Locale;
};

type LabModule = (typeof labModules)[number];

function isFrameTheme(value: unknown): value is FrameTheme {
  return value === 'light' || value === 'dark';
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || isFrameTheme(value);
}

function isModuleId(value: unknown): value is ModuleId {
  return typeof value === 'string' && labModules.some((module) => module.id === value);
}

const legacyModuleRedirects: Readonly<Record<string, ModuleId>> = {
  spacing: 'layout-shape',
  radius: 'layout-shape',
  border: 'layout-shape',
  surface: 'materials',
  glass: 'materials',
  badge: 'status-feedback',
  skeleton: 'status-feedback',
  'status-indicator': 'status-feedback',
};

function resolveModuleId(value: string): ModuleId | null {
  if (isModuleId(value)) {
    return value;
  }

  return legacyModuleRedirects[value] ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readSavedState(): SavedState {
  if (isFrame) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(preferencesStorageKey);
    if (raw === null) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return {};
    }

    return {
      ...(isThemeMode(parsed.theme) ? { theme: parsed.theme } : {}),
      ...(isModuleId(parsed.module) ? { module: parsed.module } : {}),
      ...(isLocale(parsed.locale) ? { locale: parsed.locale } : {}),
    };
  } catch {
    return {};
  }
}

function readHash(): string {
  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return '';
  }
}

function locationHref(moduleId: ModuleId | null): string {
  const url = new URL(window.location.href);
  url.hash = moduleId ?? '';
  return `${url.pathname}${url.search}${url.hash}`;
}

function replaceLocation(moduleId: ModuleId | null): void {
  window.history.replaceState(null, '', locationHref(moduleId));
}

function detectBrowserLocale(): Locale {
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

const savedState = readSavedState();
const queryParameters = new URLSearchParams(window.location.search);
const queryTheme = queryParameters.get('theme');
const queryLocale = queryParameters.get('lang');
const themeMode = ref<ThemeMode>(
  isThemeMode(queryTheme) ? queryTheme : (savedState.theme ?? 'system'),
);
const locale = ref<Locale>(
  isLocale(queryLocale) ? queryLocale : (savedState.locale ?? detectBrowserLocale()),
);

function initialModule(): ModuleId | null {
  const hash = readHash();
  if (hash.length === 0) {
    /* A fresh visit (no hash) always opens the overview; only an explicit
       #module hash reopens a module. Persisted module ids are still written
       for deep-link sharing but are deliberately not restored on reload. */
    replaceLocation(null);
    return null;
  }

  const moduleId = resolveModuleId(hash);
  if (moduleId !== null) {
    if (moduleId !== hash) {
      replaceLocation(moduleId);
    }
    return moduleId;
  }

  replaceLocation(null);
  return null;
}

const currentModuleId = ref<ModuleId | null>(isFrame ? null : initialModule());
const isOverview = computed(() => currentModuleId.value === null);
const sectionsByGroup = moduleGroups.map((group) => ({
  ...group,
  modules: labModules.filter((module) =>
    group.moduleIds.some((moduleId) => moduleId === module.id),
  ),
}));
const selectedModule = computed<LabModule | null>(() => {
  if (currentModuleId.value === null) {
    return null;
  }

  return labModules.find((module) => module.id === currentModuleId.value) ?? null;
});
const selectedGroup = computed(() => {
  const module = selectedModule.value;
  if (module === null) {
    return null;
  }

  return sectionsByGroup.find((group) => group.id === module.groupId) ?? null;
});

const shellElement = ref<HTMLElement | null>(null);
const workspaceElement = ref<HTMLElement | null>(null);
const overviewHeading = ref<HTMLElement | null>(null);
const moduleHeading = ref<HTMLElement | null>(null);
const isNavOpen = ref(false);
let stopSystemThemeObservation: (() => void) | undefined;
const themeOptions = computed(
  () =>
    [
      { value: 'system', label: localize(appCopy.theme.options.system, locale.value) },
      { value: 'light', label: localize(appCopy.theme.options.light, locale.value) },
      { value: 'dark', label: localize(appCopy.theme.options.dark, locale.value) },
    ] as const,
);
const languageOptions = computed(
  () =>
    [
      { value: 'en', label: localize(appCopy.language.options.en, locale.value) },
      { value: 'zh', label: localize(appCopy.language.options.zh, locale.value) },
    ] as const,
);

function applyTheme(value: ThemeMode): void {
  applyThemeMode(value);
}

function replaceQueryParameter(name: string, value: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set(name, value);
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

function persistState(next: Partial<SavedState>): void {
  if (isFrame) {
    return;
  }

  Object.assign(savedState, next);
  try {
    window.localStorage.setItem(preferencesStorageKey, JSON.stringify(savedState));
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
  }
}

function setTheme(value: string): void {
  if (!isThemeMode(value)) {
    return;
  }

  themeMode.value = value;
  applyTheme(value);
  persistState({ theme: value });
  replaceQueryParameter('theme', value);
}

function setLocale(value: string): void {
  if (!isLocale(value)) {
    return;
  }

  locale.value = value;
  document.documentElement.lang = value === 'zh' ? 'zh-CN' : 'en';
  persistState({ locale: value });
  replaceQueryParameter('lang', value);
}

function resetScrollPositions(): void {
  shellElement.value?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  workspaceElement.value?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function focusCurrentView(): void {
  void nextTick(() => {
    resetScrollPositions();
    const heading = isOverview.value ? overviewHeading.value : moduleHeading.value;
    heading?.focus({ preventScroll: true });
    resetScrollPositions();
    window.requestAnimationFrame(resetScrollPositions);
  });
}

function selectModule(moduleId: ModuleId): void {
  const changed = currentModuleId.value !== moduleId;
  currentModuleId.value = moduleId;
  persistState({ module: moduleId });
  if (changed) {
    window.history.pushState(null, '', locationHref(moduleId));
  }

  isNavOpen.value = false;
  focusCurrentView();
}

function showOverview(): void {
  const changed = currentModuleId.value !== null;
  currentModuleId.value = null;
  if (changed) {
    window.history.pushState(null, '', locationHref(null));
  }

  isNavOpen.value = false;
  focusCurrentView();
}

function handleLocationChange(): void {
  const hash = readHash();
  if (hash.length === 0) {
    currentModuleId.value = null;
  } else {
    const moduleId = resolveModuleId(hash);
    if (moduleId !== null) {
      currentModuleId.value = moduleId;
      persistState({ module: moduleId });
      if (moduleId !== hash) {
        replaceLocation(moduleId);
      }
    } else if (currentModuleId.value !== null) {
      // Direct-rendered modules own their in-page anchors. Do not reset scroll
      // or move focus when an anchor such as #controls-action is activated.
      isNavOpen.value = false;
      return;
    } else {
      replaceLocation(null);
    }
  }

  isNavOpen.value = false;
  focusCurrentView();
}

function closeNav(): void {
  isNavOpen.value = false;
}

/* Modified clicks (Cmd/Ctrl/Shift + click, middle click) keep the browser's
   open-in-new-tab behavior for the hash deep links. */
function handleNavClick(event: MouseEvent, moduleId: ModuleId | null): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  event.preventDefault();
  if (moduleId === null) {
    showOverview();
  } else {
    selectModule(moduleId);
  }
}

if (!isFrame) {
  applyTheme(themeMode.value);
  document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en';
}

onMounted(() => {
  if (isFrame) {
    return;
  }

  stopSystemThemeObservation = observeSystemTheme();
  window.addEventListener('popstate', handleLocationChange);
  window.addEventListener('hashchange', handleLocationChange);
});

onBeforeUnmount(() => {
  if (isFrame) {
    return;
  }

  stopSystemThemeObservation?.();
  window.removeEventListener('popstate', handleLocationChange);
  window.removeEventListener('hashchange', handleLocationChange);
});
</script>

<template>
  <LabBoard v-if="isFrame" />

  <main
    v-else
    ref="shellElement"
    class="flex h-screen w-full flex-col overflow-hidden lg:flex-row"
    @keydown.esc="closeNav"
  >
    <button
      v-if="isNavOpen"
      type="button"
      class="fixed inset-0 z-layer-overlay bg-scrim lg:hidden"
      :aria-label="localize(appCopy.navigation.close, locale)"
      @click="closeNav"
    />

    <aside
      id="design-lab-navigation"
      :class="[
        'fixed inset-y-0 left-0 z-layer-modal flex w-72 shrink-0 flex-col border-r border-subtle material-glass-elevated p-4 shadow-modal transition-transform duration-standard ease-standard lg:relative lg:h-screen lg:w-52 lg:translate-x-0',
        isNavOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
      :aria-label="localize(appCopy.navigation.label, locale)"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <img
            data-playground-brand-icon
            :src="brandIconUrl"
            alt=""
            aria-hidden="true"
            class="size-8 shrink-0 object-contain"
          >
          <div class="min-w-0">
            <p class="text-label font-label text-accent-primary">
              {{ localize(appCopy.brand, locale) }}
            </p>
            <h1 class="mt-1 text-subtitle font-heading tracking-heading text-primary">
              {{ localize(appCopy.designLab, locale) }}
            </h1>
          </div>
        </div>
        <UiIconButton
          class="lg:hidden"
          variant="ghost"
          size="sm"
          :label="localize(appCopy.navigation.close, locale)"
          @click="closeNav"
        >
          <LabIcon name="close" />
        </UiIconButton>
      </div>
      <p class="mt-3 text-caption text-secondary lg:hidden">
        {{ localize(appCopy.sidebarDescription, locale) }}
      </p>

      <nav
        class="scrollbar-immersive mt-5 min-h-0 flex-1 overflow-y-auto"
        :aria-label="localize(appCopy.navigation.modulesLabel, locale)"
      >
        <UiNavigationItem
          :href="locationHref(null)"
          :label="localize(appCopy.navigation.overview, locale)"
          size="lg"
          stretch
          indicator-placement="start"
          :active="isOverview"
          :class="[
            'playground-navigation-item--flat-active w-full justify-start rounded-control px-3 text-caption',
            isOverview
              ? 'bg-accent-soft font-semibold text-accent-primary'
              : 'text-secondary hover:bg-accent-soft hover:text-primary',
          ]"
          @click="handleNavClick($event, null)"
        />

        <div v-for="group in sectionsByGroup" :key="group.id" class="mt-5 first:mt-1">
          <h2 class="px-3 text-caption font-semibold uppercase tracking-wide text-muted">
            {{ localize(group.label, locale) }}
          </h2>
          <div class="mt-1 grid gap-0.5">
            <UiNavigationItem
              v-for="module in group.modules"
              :key="module.id"
              :href="`#${module.id}`"
              :label="localize(module.label, locale)"
              size="lg"
              stretch
              indicator-placement="start"
              :active="currentModuleId === module.id"
              :class="[
                'playground-navigation-item--flat-active w-full justify-start rounded-control px-3 text-caption',
                currentModuleId === module.id
                  ? 'bg-accent-soft font-semibold text-accent-primary'
                  : 'text-secondary hover:bg-accent-soft hover:text-primary',
              ]"
              @click="handleNavClick($event, module.id)"
            />
          </div>
        </div>
      </nav>
    </aside>

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref="workspaceElement"
        data-design-lab-workspace
        class="scrollbar-immersive min-h-0 flex-1 overflow-y-auto"
      >
        <div
          class="mx-auto flex w-full max-w-container-xl flex-col gap-grid px-gutter-inline pb-gutter-block pt-3"
        >
          <header
            class="sticky top-0 z-layer-sticky -mx-gutter-inline material-glass-subtle px-gutter-inline pt-2 pb-2"
          >
            <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div class="flex min-w-0 flex-1 items-center gap-x-3">
                <UiIconButton
                  class="shrink-0 lg:hidden"
                  variant="ghost"
                  size="sm"
                  :label="localize(appCopy.navigation.open, locale)"
                  :aria-expanded="isNavOpen"
                  aria-controls="design-lab-navigation"
                  @click="isNavOpen = true"
                >
                  <LabIcon name="menu" />
                </UiIconButton>
                <p v-if="!isOverview" class="hidden shrink-0 text-caption text-muted lg:block">
                  {{ selectedGroup ? localize(selectedGroup.label, locale) : '' }}
                  /
                </p>
                <h2
                  v-if="!isOverview"
                  id="module-title"
                  ref="moduleHeading"
                  tabindex="-1"
                  class="min-w-0 truncate text-subtitle font-heading tracking-heading outline-none"
                >
                  {{ selectedModule ? localize(selectedModule.label, locale) : '' }}
                </h2>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <UiSegmentedControl
                  :aria-label="localize(appCopy.theme.label, locale)"
                  :options="themeOptions"
                  :model-value="themeMode"
                  @update:model-value="setTheme"
                />
                <UiSegmentedControl
                  :aria-label="localize(appCopy.language.label, locale)"
                  :options="languageOptions"
                  :model-value="locale"
                  @update:model-value="setLocale"
                />
                <span v-if="!isOverview" data-back-to-overview class="hidden md:inline-flex">
                  <UiButton variant="ghost" size="sm" @click="showOverview">
                    {{ localize(appCopy.module.backToOverview, locale) }}
                  </UiButton>
                </span>
              </div>
            </div>
            <p
              v-if="!isOverview"
              class="mt-1 line-clamp-1 max-w-container-lg text-caption text-secondary lg:line-clamp-none"
            >
              {{ selectedModule ? localize(selectedModule.description, locale) : '' }}
            </p>
          </header>

          <section v-if="isOverview" aria-labelledby="overview-title" class="grid gap-grid">
            <header class="grid gap-3">
              <p class="text-label font-label text-accent-primary">
                {{ localize(appCopy.overview.eyebrow, locale) }}
              </p>
              <h2
                id="overview-title"
                ref="overviewHeading"
                tabindex="-1"
                class="text-heading font-heading tracking-heading outline-none"
              >
                {{ localize(appCopy.overview.title, locale) }}
              </h2>
              <p class="max-w-container-md text-body text-secondary">
                {{ localize(appCopy.overview.description, locale) }}
              </p>
            </header>

            <div class="grid gap-grid sm:grid-cols-2 xl:grid-cols-3">
              <article
                v-for="group in sectionsByGroup"
                :key="group.id"
                class="grid content-start gap-3 rounded-card bg-surface-raised p-4 shadow-card"
              >
                <div>
                  <h3 class="text-subtitle font-heading tracking-heading">
                    {{ localize(group.label, locale) }}
                  </h3>
                  <p class="mt-1 text-caption text-secondary">
                    {{ formatLocalized(appCopy.overview.moduleCount, locale, {
                        count: group.modules.length,
                      }) }}
                  </p>
                </div>
                <p class="text-body text-secondary">
                  {{ localize(group.description, locale) }}
                </p>
                <ul class="grid gap-1 text-caption text-secondary">
                  <li v-for="module in group.modules" :key="module.id" class="flex gap-2">
                    <span
                      class="mt-2 size-1.5 shrink-0 rounded-full bg-accent-primary"
                      aria-hidden="true"
                    />
                    <span>{{ localize(module.label, locale) }}</span>
                  </li>
                </ul>
                <UiButton variant="secondary" @click="selectModule(group.moduleIds[0])">
                  {{ formatLocalized(appCopy.overview.openGroup, locale, {
                      group: localize(group.label, locale),
                    }) }}
                </UiButton>
              </article>
            </div>
          </section>

          <section v-else aria-labelledby="module-title" class="grid gap-grid">
            <div v-if="selectedModule" data-design-lab-region="module" class="grid gap-grid">
              <component :is="selectedModule.component" :key="selectedModule.id" :locale="locale" />
            </div>
          </section>
        </div>
      </div>
    </div>
  </main>
</template>
