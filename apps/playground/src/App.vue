<script setup lang="ts">
import { UiBadge, UiButton, UiIconButton, UiSegmentedControl } from '@neoverse-ui/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import LabBoard from './LabBoard.vue';
import LabIcon from './LabIcon.vue';
import { focusClasses } from './lab-data';
import { labModules, type ModuleId, moduleGroups } from './lab-modules';
import { appCopy, formatLocalized, isLocale, type Locale, localize } from './playground-content';
import type { FrameTheme, ThemeMode } from './playground-types';

const isFrame = window.location.pathname === '/frame';
const frameTheme: FrameTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
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
  if (hash.length > 0) {
    if (isModuleId(hash)) {
      return hash;
    }

    replaceLocation(null);
    return null;
  }

  if (savedState.module !== undefined) {
    replaceLocation(savedState.module);
    return savedState.module;
  }

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

function detectSystemTheme(): FrameTheme {
  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

const systemFrameTheme = ref<FrameTheme>(detectSystemTheme());
const resolvedFrameTheme = computed<FrameTheme>(() =>
  themeMode.value === 'dark' || (themeMode.value === 'system' && systemFrameTheme.value === 'dark')
    ? 'dark'
    : 'light',
);
const frameSrc = computed(() => {
  const module = selectedModule.value;
  if (module === null) {
    return '';
  }

  const url = new URL('/frame', window.location.origin);
  url.searchParams.set('theme', resolvedFrameTheme.value);
  url.searchParams.set('lang', locale.value);
  url.hash = module.id;
  return `${url.pathname}${url.search}${url.hash}`;
});

const frameElement = ref<HTMLIFrameElement | null>(null);
const shellElement = ref<HTMLElement | null>(null);
const frameHeight = ref(0);
const workspaceElement = ref<HTMLElement | null>(null);
const overviewHeading = ref<HTMLElement | null>(null);
const moduleHeading = ref<HTMLElement | null>(null);
const isNavOpen = ref(false);
let systemMediaQuery: MediaQueryList | undefined;

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

type HeightMessage = {
  type: 'neoverse-design-lab-height';
  theme: FrameTheme;
  height: number;
};

function isHeightMessage(value: unknown): value is HeightMessage {
  return (
    isRecord(value) &&
    value.type === 'neoverse-design-lab-height' &&
    isFrameTheme(value.theme) &&
    typeof value.height === 'number' &&
    Number.isFinite(value.height)
  );
}

function applyTheme(value: ThemeMode): void {
  if (value === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.dataset.theme = value;
  }
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
  frameHeight.value = 0;
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

  frameHeight.value = 0;
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
  } else if (isModuleId(hash)) {
    currentModuleId.value = hash;
    persistState({ module: hash });
  } else {
    replaceLocation(null);
    currentModuleId.value = null;
  }

  frameHeight.value = 0;
  isNavOpen.value = false;
  focusCurrentView();
}

function closeNav(): void {
  isNavOpen.value = false;
}

function handleSystemThemeChange(event: MediaQueryListEvent): void {
  systemFrameTheme.value = event.matches ? 'dark' : 'light';
}

function handleFrameLoad(): void {
  frameHeight.value = 0;
  resetScrollPositions();
}

function frameHeightStyle(): string {
  return frameHeight.value > 0 ? `${frameHeight.value}px` : 'calc(100vh - 12rem)';
}

function handleMessage(event: MessageEvent<unknown>): void {
  if (event.origin !== window.location.origin || !isHeightMessage(event.data)) {
    return;
  }

  if (
    frameElement.value?.contentWindow !== event.source ||
    event.data.theme !== resolvedFrameTheme.value
  ) {
    return;
  }

  frameHeight.value = Math.max(1, Math.ceil(event.data.height));
  window.requestAnimationFrame(resetScrollPositions);
}

if (!isFrame) {
  applyTheme(themeMode.value);
  document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en';
}

onMounted(() => {
  if (isFrame) {
    return;
  }

  window.addEventListener('message', handleMessage);
  window.addEventListener('popstate', handleLocationChange);
  window.addEventListener('hashchange', handleLocationChange);

  if (typeof window.matchMedia === 'function') {
    systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemMediaQuery.addEventListener('change', handleSystemThemeChange);
  }
});

onBeforeUnmount(() => {
  if (isFrame) {
    return;
  }

  window.removeEventListener('message', handleMessage);
  window.removeEventListener('popstate', handleLocationChange);
  window.removeEventListener('hashchange', handleLocationChange);
  systemMediaQuery?.removeEventListener('change', handleSystemThemeChange);
});
</script>

<template>
  <LabBoard v-if="isFrame" :frame-theme="frameTheme" />

  <main
    v-else
    ref="shellElement"
    class="mx-auto flex h-screen w-full max-w-container-2xl flex-col overflow-hidden lg:flex-row"
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
        'fixed inset-y-0 left-0 z-layer-modal flex w-72 shrink-0 flex-col border-r border-subtle bg-surface-raised p-5 shadow-modal transition-transform duration-standard ease-standard lg:static lg:h-screen lg:w-60 lg:translate-x-0',
        isNavOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
      :aria-label="localize(appCopy.navigation.label, locale)"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-label font-label text-accent-primary">
            {{ localize(appCopy.brand, locale) }}
          </p>
          <p class="mt-1 text-subtitle font-heading tracking-heading text-primary">
            {{ localize(appCopy.designLab, locale) }}
          </p>
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
      <p class="mt-4 text-caption text-secondary">
        {{ localize(appCopy.sidebarDescription, locale) }}
      </p>

      <nav
        class="mt-8 min-h-0 flex-1 overflow-y-auto"
        :aria-label="localize(appCopy.navigation.modulesLabel, locale)"
      >
        <a
          :href="locationHref(null)"
          :aria-current="isOverview ? 'page' : undefined"
          :class="[
            'flex min-h-10 items-center rounded-control px-3 py-2 text-caption transition-colors duration-fast ease-standard',
            focusClasses,
            isOverview
              ? 'bg-accent-soft font-semibold text-accent-primary'
              : 'text-secondary hover:bg-surface-subtle hover:text-primary',
          ]"
          @click.prevent="showOverview"
        >
          {{ localize(appCopy.navigation.overview, locale) }}
        </a>

        <div v-for="group in sectionsByGroup" :key="group.id" class="mt-7 first:mt-8">
          <h2 class="px-3 text-label font-label text-muted">
            {{ localize(group.label, locale) }}
          </h2>
          <div class="mt-2 grid gap-1">
            <a
              v-for="module in group.modules"
              :key="module.id"
              :href="`#${module.id}`"
              :aria-current="currentModuleId === module.id ? 'page' : undefined"
              :class="[
                'relative flex min-h-10 items-center rounded-control px-3 py-2 text-caption transition-colors duration-fast ease-standard',
                focusClasses,
                currentModuleId === module.id
                  ? 'bg-accent-soft font-semibold text-accent-primary'
                  : 'text-secondary hover:bg-surface-subtle hover:text-primary',
              ]"
              @click.prevent="selectModule(module.id)"
            >
              <span
                v-if="currentModuleId === module.id"
                class="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent-primary"
                aria-hidden="true"
              />
              {{ localize(module.label, locale) }}
            </a>
          </div>
        </div>
      </nav>
    </aside>

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <header class="shrink-0 border-b border-subtle bg-surface-raised px-gutter-inline py-4">
        <div
          class="mx-auto flex w-full max-w-container-2xl flex-wrap items-center justify-between gap-4"
        >
          <div class="flex min-w-0 items-center gap-3">
            <UiIconButton
              class="lg:hidden"
              variant="ghost"
              size="sm"
              :label="localize(appCopy.navigation.open, locale)"
              :aria-expanded="isNavOpen"
              aria-controls="design-lab-navigation"
              @click="isNavOpen = true"
            >
              <LabIcon name="menu" />
            </UiIconButton>
            <div class="min-w-0">
              <p class="text-label font-label text-accent-primary">
                {{ localize(appCopy.brand, locale) }}
              </p>
              <h1 class="text-heading font-heading tracking-heading">
                {{ localize(appCopy.designLab, locale) }}
              </h1>
            </div>
          </div>
          <div class="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
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
          </div>
        </div>
        <p class="mx-auto mt-3 w-full max-w-container-2xl text-caption text-secondary">
          {{ localize(appCopy.headerDescription, locale) }}
        </p>
      </header>

      <div ref="workspaceElement" class="min-h-0 flex-1 overflow-y-auto">
        <div
          class="mx-auto flex w-full max-w-container-2xl flex-col gap-grid px-gutter-inline py-gutter-block"
        >
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

            <div class="grid gap-grid sm:grid-cols-2 xl:grid-cols-4">
              <article
                v-for="group in sectionsByGroup"
                :key="group.id"
                class="grid content-start gap-4 rounded-card border border-subtle bg-surface-raised p-5 shadow-card"
              >
                <div class="flex items-start justify-between gap-3">
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
                  <UiBadge variant="info">{{ group.modules.length }}</UiBadge>
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
                <UiButton
                  variant="secondary"
                  class="mt-1 w-full justify-center"
                  @click="selectModule(group.moduleIds[0])"
                >
                  {{ formatLocalized(appCopy.overview.openGroup, locale, {
                      group: localize(group.label, locale),
                    }) }}
                </UiButton>
              </article>
            </div>
          </section>

          <section v-else aria-labelledby="module-title" class="grid gap-grid">
            <header
              class="sticky top-0 z-layer-sticky -mx-1 border-b border-subtle bg-surface-canvas px-1 py-4"
            >
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-caption text-secondary">
                    {{ selectedGroup ? localize(selectedGroup.label, locale) : '' }}
                    /
                    {{ selectedModule ? localize(selectedModule.label, locale) : '' }}
                  </p>
                  <h2
                    id="module-title"
                    ref="moduleHeading"
                    tabindex="-1"
                    class="mt-1 text-heading font-heading tracking-heading outline-none"
                  >
                    {{ selectedModule ? localize(selectedModule.label, locale) : '' }}
                  </h2>
                  <p class="mt-2 max-w-container-md text-body text-secondary">
                    {{ selectedModule ? localize(selectedModule.description, locale) : '' }}
                  </p>
                </div>
                <UiButton variant="ghost" class="shrink-0" @click="showOverview">
                  {{ localize(appCopy.module.backToOverview, locale) }}
                </UiButton>
              </div>
            </header>

            <div
              class="overflow-hidden rounded-card border border-subtle bg-surface-raised shadow-card"
            >
              <iframe
                ref="frameElement"
                :key="frameSrc"
                :src="frameSrc"
                :title="
                  selectedModule
                    ? formatLocalized(appCopy.module.frameTitle, locale, {
                        label: localize(selectedModule.label, locale),
                        theme: localize(
                          appCopy.module.themeNames[resolvedFrameTheme],
                          locale,
                        ),
                      })
                    : ''
                "
                class="block w-full border-0 bg-surface-canvas"
                :style="{ height: frameHeightStyle() }"
                @load="handleFrameLoad"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  </main>
</template>
