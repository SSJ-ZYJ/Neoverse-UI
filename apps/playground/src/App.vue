<script setup lang="ts">
import { prewarmParticleDissolve, startViewTransition } from '@neoverse-ui/motion';
import { layoutBreakpoints } from '@neoverse-ui/tokens';
import {
  staggerStyle,
  UiButton,
  UiIconButton,
  UiNavigationItem,
  UiSegmentedControl,
  UiSurface,
} from '@neoverse-ui/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import brandIconUrl from './assets/neoverse-ui-icon.svg';
import LabBoard from './LabBoard.vue';
import LabIcon from './LabIcon.vue';
import {
  isModuleId,
  labModules,
  labSpecimens,
  type ModuleId,
  moduleGroups,
  resolveLabHash,
  type SpecimenId,
  type SpecimenKind,
  specimenKinds,
} from './lab-modules';
import {
  appCopy,
  formatLocalized,
  isLocale,
  type Locale,
  localize,
  localized,
} from './playground-content';
import type { FrameTheme, ThemeMode } from './playground-types';
import { applyThemeMode, observeSystemTheme } from './theme-state';

const isFrame = window.location.pathname === '/frame';
const preferencesStorageKey = 'neoverse-design-lab.preferences';
const persistentNavigationMediaQuery = `(min-width: ${layoutBreakpoints.xl}px)`;

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

function locationHref(hash: string | null): string {
  const url = new URL(window.location.href);
  url.hash = hash ?? '';
  return `${url.pathname}${url.search}${url.hash}`;
}

function replaceLocation(hash: string | null): void {
  window.history.replaceState(null, '', locationHref(hash));
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

function initialRoute(): { moduleId: ModuleId | null; specimenId: SpecimenId | null } {
  const hash = readHash();
  if (hash.length === 0) {
    /* A fresh visit (no hash) always opens the overview; only an explicit
       #module hash reopens a module. Persisted module ids are still written
       for deep-link sharing but are deliberately not restored on reload. */
    replaceLocation(null);
    return { moduleId: null, specimenId: null };
  }

  const resolved = resolveLabHash(hash);
  if (resolved !== null) {
    if (resolved.canonicalHash !== hash) {
      replaceLocation(resolved.canonicalHash);
    }
    return {
      moduleId: resolved.moduleId,
      specimenId: resolved.specimenId ?? null,
    };
  }

  replaceLocation(null);
  return { moduleId: null, specimenId: null };
}

const initial = isFrame ? { moduleId: null, specimenId: null } : initialRoute();
const currentModuleId = ref<ModuleId | null>(initial.moduleId);
const pendingSpecimenId = ref<SpecimenId | null>(initial.specimenId);
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
const catalogueQuery = ref('');
const catalogueKind = ref<'all' | SpecimenKind>('all');
const catalogueCopy = {
  title: localized('Component & pattern catalogue', '组件与组合目录'),
  description: localized(
    'Search by component API, specimen name, or capability tag, then jump directly to a focused fixture.',
    '按组件 API、示例名称或能力标签检索，并直接定位到对应校验场景。',
  ),
  searchLabel: localized('Search specimens', '搜索示例'),
  searchPlaceholder: localized(
    'Search UiButton, glass, reading…',
    '搜索 UiButton、glass、reading…',
  ),
  filterLabel: localized('Specimen kind', '示例类型'),
  summary: localized(
    '{modules} modules · {specimens} specimens',
    '{modules} 个模块 · {specimens} 个示例',
  ),
  noResults: localized('No specimens match the current filter.', '当前筛选条件下没有匹配的示例。'),
  kinds: {
    all: localized('All', '全部'),
    component: localized('Components', '组件'),
    composition: localized('Compositions', '组合'),
    foundation: localized('Foundations', '基础'),
  },
} as const;
const catalogueKinds = ['all', ...specimenKinds] as const;
const showcaseSurface = ref<'glass-subtle' | 'glass-elevated'>('glass-subtle');
const showcaseCopy = {
  caption: localized('INTERACTIVE SPECIMEN', '交互式预览'),
  heading: localized('One system. Every surface.', '一种设计语言，多种表面。'),
  detail: localized(
    'Explore the actual components, materials, and interaction states.',
    '直接体验真实组件、材质与交互状态。',
  ),
  surfaceLabel: localized('Preview material', '预览材质'),
  subtle: localized('Soft', '柔和'),
  elevated: localized('Raised', '悬浮'),
  components: localized('Components', '查看组件'),
  materials: localized('Materials', '浏览材质'),
} as const;
const showcaseOptions = computed(() => [
  { value: 'glass-subtle', label: localize(showcaseCopy.subtle, locale.value) },
  { value: 'glass-elevated', label: localize(showcaseCopy.elevated, locale.value) },
]);
function setShowcaseSurface(value: string): void {
  if (value === 'glass-subtle' || value === 'glass-elevated') {
    showcaseSurface.value = value;
  }
}
const filteredSpecimens = computed(() => {
  const query = catalogueQuery.value.trim().toLowerCase();
  return labSpecimens.filter((specimen) => {
    if (catalogueKind.value !== 'all' && specimen.kind !== catalogueKind.value) {
      return false;
    }
    if (query.length === 0) {
      return true;
    }
    const searchable = [
      localize(specimen.label, locale.value),
      specimen.label.en,
      specimen.label.zh,
      ...specimen.apiNames,
      ...specimen.tags,
    ]
      .join(' ')
      .toLowerCase();
    return searchable.includes(query);
  });
});
const moduleLabelById = (moduleId: ModuleId): string =>
  localize(
    labModules.find((module) => module.id === moduleId)?.label ?? localized(moduleId, moduleId),
    locale.value,
  );

const shellElement = ref<HTMLElement | null>(null);
const workspaceElement = ref<HTMLElement | null>(null);
const overviewHeading = ref<HTMLElement | null>(null);
const moduleHeading = ref<HTMLElement | null>(null);
const navElement = ref<HTMLElement | null>(null);
const isNavOpen = ref(false);
const isDesktopLayout = ref(window.matchMedia(persistentNavigationMediaQuery).matches);
let stopSystemThemeObservation: (() => void) | undefined;
let desktopLayoutQuery: MediaQueryList | undefined;
let desktopLayoutListener: ((event: MediaQueryListEvent) => void) | undefined;
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
const compactControlsCopy = {
  theme: localized('Cycle theme', '切换主题'),
  language: localized('Switch language', '切换语言'),
} as const;

function cycleTheme(): void {
  const modes: readonly ThemeMode[] = ['system', 'light', 'dark'];
  const current = modes.indexOf(themeMode.value);
  setTheme(modes[(current + 1) % modes.length] ?? 'system');
}

function toggleLanguage(): void {
  setLocale(locale.value === 'zh' ? 'en' : 'zh');
}

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

function focusSpecimen(specimenId: SpecimenId): void {
  void nextTick(() => {
    window.requestAnimationFrame(() => {
      const target = document.getElementById(specimenId);
      if (target === null) {
        return;
      }
      target.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' });
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus({ preventScroll: true });
    });
  });
}

function focusCurrentView(specimenId: SpecimenId | null = null): void {
  if (specimenId !== null) {
    focusSpecimen(specimenId);
    return;
  }
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
  const commit = (): void => {
    currentModuleId.value = moduleId;
    pendingSpecimenId.value = null;
  };
  if (changed) {
    window.history.pushState(null, '', locationHref(moduleId));
    /* One continuous take: the shell stays put while the page content
       travels; the View Transition glue in @neoverse-ui/motion scopes the
       animation and skips it under reduced motion. */
    void startViewTransition(commit);
  } else {
    commit();
  }
  persistState({ module: moduleId });

  isNavOpen.value = false;
  focusCurrentView();
}

function showOverview(): void {
  const changed = currentModuleId.value !== null;
  const commit = (): void => {
    currentModuleId.value = null;
    pendingSpecimenId.value = null;
  };
  if (changed) {
    window.history.pushState(null, '', locationHref(null));
    void startViewTransition(commit);
  } else {
    commit();
  }

  isNavOpen.value = false;
  focusCurrentView();
}

/* Grid items leave in place while siblings glide into the freed cells: the
   leaving card is pinned to its own coordinates so the FLIP move class can
   animate the reflow instead of snapping at the end of the exit. */
function onCatalogueLeave(element: Element): void {
  const item = element as HTMLElement;
  item.style.inlineSize = `${item.offsetWidth}px`;
  item.style.blockSize = `${item.offsetHeight}px`;
  item.style.position = 'absolute';
  item.style.insetBlockStart = `${item.offsetTop}px`;
  item.style.insetInlineStart = `${item.offsetLeft}px`;
}

function handleLocationChange(): void {
  const hash = readHash();
  let targetSpecimenId: SpecimenId | null = null;
  if (hash.length === 0) {
    const commit = (): void => {
      currentModuleId.value = null;
      pendingSpecimenId.value = null;
    };
    if (currentModuleId.value !== null) {
      void startViewTransition(commit);
    } else {
      commit();
    }
  } else {
    const resolved = resolveLabHash(hash);
    if (resolved !== null) {
      targetSpecimenId = resolved.specimenId ?? null;
      const commit = (): void => {
        currentModuleId.value = resolved.moduleId;
        pendingSpecimenId.value = targetSpecimenId;
      };
      if (currentModuleId.value !== resolved.moduleId) {
        void startViewTransition(commit);
      } else {
        commit();
      }
      persistState({ module: resolved.moduleId });
      if (resolved.canonicalHash !== hash) {
        replaceLocation(resolved.canonicalHash);
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
  focusCurrentView(targetSpecimenId);
}

function openNav(): void {
  isNavOpen.value = true;
  void nextTick(() => {
    navElement.value
      ?.querySelector<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])')
      ?.focus();
  });
}

function closeNav(restoreFocus = true): void {
  const wasOpen = isNavOpen.value;
  isNavOpen.value = false;
  if (wasOpen && restoreFocus) {
    void nextTick(() =>
      shellElement.value?.querySelector<HTMLElement>('[data-playground-nav-trigger]')?.focus(),
    );
  }
}

function handleEscape(): void {
  if (isNavOpen.value && !isDesktopLayout.value) {
    closeNav(true);
  }
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
  applyThemeMode(themeMode.value, false);
  document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en';
}

onMounted(() => {
  if (isFrame) {
    return;
  }

  desktopLayoutQuery = window.matchMedia(persistentNavigationMediaQuery);
  const syncDesktopLayout = (event: MediaQueryListEvent | MediaQueryList): void => {
    isDesktopLayout.value = event.matches;
    if (event.matches) {
      isNavOpen.value = false;
    }
  };
  syncDesktopLayout(desktopLayoutQuery);
  desktopLayoutListener = (event) => syncDesktopLayout(event);
  desktopLayoutQuery.addEventListener('change', desktopLayoutListener);
  stopSystemThemeObservation = observeSystemTheme();
  window.addEventListener('popstate', handleLocationChange);
  window.addEventListener('hashchange', handleLocationChange);
  /* Build the WebGL particle resources while idle so the first navigation
     pays no context-creation cost. */
  const prewarm = (): void => {
    prewarmParticleDissolve();
  };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(prewarm, { timeout: 3000 });
  } else {
    window.setTimeout(prewarm, 1200);
  }
  if (pendingSpecimenId.value !== null) {
    focusCurrentView(pendingSpecimenId.value);
  }
});

onBeforeUnmount(() => {
  if (isFrame) {
    return;
  }

  stopSystemThemeObservation?.();
  if (desktopLayoutListener !== undefined) {
    desktopLayoutQuery?.removeEventListener('change', desktopLayoutListener);
  }
  window.removeEventListener('popstate', handleLocationChange);
  window.removeEventListener('hashchange', handleLocationChange);
});
</script>

<template>
  <LabBoard v-if="isFrame" />

  <main
    v-else
    ref="shellElement"
    class="playground-shell flex h-screen w-full flex-col overflow-hidden xl:flex-row"
    @keydown.esc.stop="handleEscape"
  >
    <Transition name="nv">
      <button
        v-if="isNavOpen"
        type="button"
        class="fixed inset-0 z-layer-overlay bg-scrim xl:hidden"
        :aria-label="localize(appCopy.navigation.close, locale)"
        @click="closeNav(true)"
      />
    </Transition>

    <aside
      ref="navElement"
      id="design-lab-navigation"
      data-playground-navigation
      :class="[
        'playground-shell__navigation fixed z-layer-modal flex w-sidebar-drawer shrink-0 flex-col overflow-hidden rounded-panel border border-subtle material-glass-elevated transition-transform duration-standard ease-standard xl:relative xl:inset-auto xl:h-auto xl:w-sidebar xl:translate-x-0',
        isDesktopLayout || isNavOpen
          ? 'playground-shell__navigation--open'
          : 'playground-shell__navigation--closed',
      ]"
      :aria-label="localize(appCopy.navigation.label, locale)"
      :aria-hidden="!isDesktopLayout && !isNavOpen ? 'true' : undefined"
      :inert="!isDesktopLayout && !isNavOpen"
    >
      <div class="playground-shell__navigation-header">
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <img
              data-playground-brand-icon
              :src="brandIconUrl"
              alt=""
              aria-hidden="true"
              class="size-9 shrink-0 object-contain"
            >
            <div class="min-w-0">
              <p class="text-label-lg font-label text-accent-primary">
                {{ localize(appCopy.brand, locale) }}
              </p>
              <h1 class="mt-1 text-title-lg font-heading tracking-title-lg text-primary">
                {{ localize(appCopy.designLab, locale) }}
              </h1>
            </div>
          </div>
          <UiIconButton
            class="xl:hidden"
            variant="ghost"
            size="sm"
            :label="localize(appCopy.navigation.close, locale)"
            @click="closeNav(true)"
          >
            <LabIcon name="close" />
          </UiIconButton>
        </div>
        <p class="mt-3 text-caption text-secondary xl:hidden">
          {{ localize(appCopy.sidebarDescription, locale) }}
        </p>
      </div>

      <nav
        class="playground-shell__navigation-scroll scrollbar-immersive grid min-h-0 flex-1 content-start gap-2 overflow-y-auto pr-1"
        :aria-label="localize(appCopy.navigation.modulesLabel, locale)"
      >
        <UiSurface
          surface="glass-subtle"
          glass-nesting="local"
          data-neoverse-glass-edge-pass="css"
          content-overflow="visible"
          class="playground-navigation-group playground-floating-interaction-surface rounded-card p-1"
        >
          <UiNavigationItem
            :href="locationHref(null)"
            :label="localize(appCopy.navigation.overview, locale)"
            size="lg"
            stretch
            indicator-placement="start"
            :active="isOverview"
            :class="[
              'playground-navigation-item--flat-active w-full justify-start rounded-control px-3 text-body-sm',
              isOverview
                ? 'bg-accent-soft font-semibold text-accent-primary'
                : 'text-secondary hover:bg-accent-soft hover:text-primary',
            ]"
            @click="handleNavClick($event, null)"
          />
        </UiSurface>

        <UiSurface
          v-for="group in sectionsByGroup"
          :key="group.id"
          surface="glass-subtle"
          glass-nesting="local"
          data-neoverse-glass-edge-pass="css"
          content-overflow="visible"
          class="playground-navigation-group playground-floating-interaction-surface grid gap-1 rounded-card p-2"
        >
          <h2 class="px-2 py-1 text-label-sm font-semibold uppercase tracking-wide text-muted">
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
                'playground-navigation-item--flat-active w-full justify-start rounded-control px-3 text-body-sm',
                currentModuleId === module.id
                  ? 'bg-accent-soft font-semibold text-accent-primary'
                  : 'text-secondary hover:bg-accent-soft hover:text-primary',
              ]"
              @click="handleNavClick($event, module.id)"
            />
          </div>
        </UiSurface>
      </nav>
    </aside>

    <div class="playground-shell__content flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref="workspaceElement"
        data-design-lab-workspace
        class="playground-shell__workspace scrollbar-immersive min-h-0 flex-1 overflow-y-auto"
      >
        <div
          data-playground-page
          class="playground-shell__page mx-auto flex w-full max-w-page flex-col gap-grid px-page-inline pb-page-block"
        >
          <UiSurface
            as="header"
            :surface="isOverview ? 'glass-subtle' : 'glass-elevated'"
            data-neoverse-surface-hover="static"
            :data-toolbar-mode="isOverview ? 'overview' : 'module'"
            :class="[
              'playground-shell__toolbar sticky top-0 z-layer-sticky rounded-card px-3 py-2 md:px-4',
              isOverview ? 'xl:w-fit xl:self-end' : 'w-full',
            ]"
          >
            <div
              class="playground-shell__toolbar-layout grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:flex-wrap sm:justify-between sm:gap-x-4"
            >
              <div
                :class="[
                  'playground-shell__toolbar-primary flex min-w-0 w-full flex-1 items-center gap-x-3 sm:w-auto',
                  isOverview ? 'xl:hidden' : '',
                ]"
              >
                <UiIconButton
                  data-playground-nav-trigger
                  class="shrink-0 xl:hidden"
                  variant="ghost"
                  size="sm"
                  :label="localize(appCopy.navigation.open, locale)"
                  :aria-expanded="isNavOpen"
                  aria-controls="design-lab-navigation"
                  @click="openNav"
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
              <div
                class="playground-shell__toolbar-actions flex w-auto shrink-0 items-center justify-end gap-2 sm:flex-wrap"
              >
                <UiIconButton
                  class="sm:hidden"
                  size="sm"
                  variant="ghost"
                  surface="none"
                  :label="`${localize(compactControlsCopy.theme, locale)}：${localize(appCopy.theme.options[themeMode], locale)}`"
                  @click="cycleTheme"
                >
                  <LabIcon name="spark" />
                </UiIconButton>
                <UiIconButton
                  class="sm:hidden"
                  size="sm"
                  variant="ghost"
                  surface="none"
                  :label="`${localize(compactControlsCopy.language, locale)}：${localize(appCopy.language.options[locale], locale)}`"
                  @click="toggleLanguage"
                >
                  <LabIcon name="globe" />
                </UiIconButton>
                <UiSegmentedControl
                  class="hidden sm:inline-flex"
                  :aria-label="localize(appCopy.theme.label, locale)"
                  :options="themeOptions"
                  :model-value="themeMode"
                  surface="glass-subtle"
                  @update:model-value="setTheme"
                />
                <UiSegmentedControl
                  class="hidden sm:inline-flex"
                  :aria-label="localize(appCopy.language.label, locale)"
                  :options="languageOptions"
                  :model-value="locale"
                  surface="glass-subtle"
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
              class="mt-1 hidden max-w-reading-wide text-caption text-secondary sm:block sm:line-clamp-1 lg:line-clamp-none"
            >
              {{ selectedModule ? localize(selectedModule.description, locale) : '' }}
            </p>
          </UiSurface>

          <section
            v-if="isOverview"
            aria-labelledby="overview-title"
            data-neoverse-dissolve=""
            class="grid gap-grid"
          >
            <UiSurface
              data-overview-hero
              surface="glass-subtle"
              class="playground-overview-hero grid gap-6 rounded-card p-6 md:p-8 lg:grid-cols-2 lg:items-center"
            >
              <div class="grid content-center gap-6">
                <header class="grid gap-4">
                  <p class="text-label-lg font-label text-accent-primary">
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
                  <p class="max-w-reading-wide text-body-lg text-secondary">
                    {{ localize(appCopy.overview.description, locale) }}
                  </p>
                </header>
                <p class="text-body-sm text-muted">
                  {{ formatLocalized(catalogueCopy.summary, locale, {
                      modules: labModules.length,
                      specimens: labSpecimens.length,
                    }) }}
                </p>
              </div>

              <div class="playground-overview-hero__stage">
                <p class="text-label-sm font-label tracking-wide text-muted">
                  {{ localize(showcaseCopy.caption, locale) }}
                </p>
                <UiSurface
                  :surface="showcaseSurface"
                  glass-nesting="local"
                  content-overflow="visible"
                  class="playground-overview-hero__sample playground-floating-interaction-surface grid gap-4 rounded-card p-5"
                >
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-label-sm font-label text-accent-primary">Neoverse UI</span>
                    <span class="size-2 rounded-pill bg-accent-primary" aria-hidden="true" />
                  </div>
                  <div class="grid gap-1">
                    <h3 class="text-title-sm font-title text-primary">
                      {{ localize(showcaseCopy.heading, locale) }}
                    </h3>
                    <p class="text-body-sm text-secondary">
                      {{ localize(showcaseCopy.detail, locale) }}
                    </p>
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <UiButton size="sm" @click="selectModule('controls')">
                      {{ localize(showcaseCopy.components, locale) }}
                    </UiButton>
                    <UiButton size="sm" variant="ghost" @click="selectModule('materials')">
                      {{ localize(showcaseCopy.materials, locale) }}
                    </UiButton>
                  </div>
                </UiSurface>
                <UiSegmentedControl
                  :aria-label="localize(showcaseCopy.surfaceLabel, locale)"
                  :model-value="showcaseSurface"
                  :options="showcaseOptions"
                  surface="glass-subtle"
                  @update:model-value="setShowcaseSurface"
                />
              </div>
            </UiSurface>

            <div data-overview-groups class="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <UiSurface
                v-for="(group, index) in sectionsByGroup"
                :key="group.id"
                surface="glass-subtle"
                content-overflow="visible"
                :class="[
                  'playground-overview-group playground-floating-interaction-surface grid min-h-32 content-between gap-5 rounded-card p-5',
                  index < 3 ? 'xl:col-span-2' : 'xl:col-span-3',
                ]"
              >
                <div class="grid gap-2">
                  <span class="text-label-sm font-label text-accent-primary">
                    {{ String(index + 1).padStart(2, '0') }}
                    / {{ String(sectionsByGroup.length).padStart(2, '0') }}
                  </span>
                  <h3 class="text-title-sm font-title text-primary">
                    {{ localize(group.label, locale) }}
                  </h3>
                  <p class="text-body-sm text-secondary">
                    {{ formatLocalized(appCopy.overview.moduleCount, locale, {
                        count: group.modules.length,
                      }) }}
                  </p>
                </div>
                <UiButton
                  size="md"
                  variant="secondary"
                  stretch
                  @click="selectModule(group.moduleIds[0])"
                >
                  {{ formatLocalized(appCopy.overview.openGroup, locale, {
                      group: localize(group.label, locale),
                    }) }}
                  <template #trailing><LabIcon name="arrow-right" /></template>
                </UiButton>
              </UiSurface>
            </div>

            <UiSurface
              data-overview-catalogue
              surface="glass-elevated"
              content-overflow="visible"
              class="playground-floating-interaction-surface grid gap-5 rounded-card p-5 md:p-6"
            >
              <header class="grid gap-2">
                <h3 class="text-title-lg font-title tracking-title-lg text-primary">
                  {{ localize(catalogueCopy.title, locale) }}
                </h3>
                <p class="max-w-reading-wide text-body-lg text-secondary">
                  {{ localize(catalogueCopy.description, locale) }}
                </p>
              </header>

              <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <label class="grid gap-1">
                  <span class="text-label-sm font-label text-secondary">
                    {{ localize(catalogueCopy.searchLabel, locale) }}
                  </span>
                  <input
                    v-model="catalogueQuery"
                    data-specimen-search
                    type="search"
                    class="w-full rounded-control border border-subtle bg-surface-subtle px-4 py-3 text-body-lg text-primary placeholder:text-muted"
                    :placeholder="localize(catalogueCopy.searchPlaceholder, locale)"
                  >
                </label>
                <fieldset class="flex flex-wrap gap-1 border-0 p-0">
                  <legend class="sr-only">
                    {{ localize(catalogueCopy.filterLabel, locale) }}
                  </legend>
                  <UiButton
                    v-for="kind in catalogueKinds"
                    :key="kind"
                    size="md"
                    surface="none"
                    :variant="catalogueKind === kind ? 'secondary' : 'ghost'"
                    :aria-pressed="catalogueKind === kind"
                    @click="catalogueKind = kind"
                  >
                    {{ localize(catalogueCopy.kinds[kind], locale) }}
                  </UiButton>
                </fieldset>
              </div>

              <TransitionGroup
                name="nv"
                tag="div"
                data-specimen-catalogue
                class="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                @leave="onCatalogueLeave"
              >
                <UiSurface
                  v-for="(specimen, index) in filteredSpecimens"
                  :key="specimen.id"
                  as="a"
                  :href="`#${specimen.id}`"
                  surface="glass-subtle"
                  glass-nesting="local"
                  class="group grid min-w-0 gap-4 rounded-card p-5"
                  :style="staggerStyle(index)"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <h4 class="truncate text-label-lg font-label text-primary">
                        {{ localize(specimen.label, locale) }}
                      </h4>
                      <p class="mt-1 text-body-sm text-muted">
                        {{ moduleLabelById(specimen.moduleId) }}
                      </p>
                    </div>
                    <span
                      class="shrink-0 rounded-pill bg-accent-soft px-2 py-1 text-label-sm text-accent-primary"
                    >
                      {{ localize(catalogueCopy.kinds[specimen.kind], locale) }}
                    </span>
                  </div>
                  <div v-if="specimen.apiNames.length > 0" class="flex flex-wrap gap-1">
                    <code
                      v-for="apiName in specimen.apiNames"
                      :key="apiName"
                      class="rounded-control bg-surface-inset px-2 py-1 text-code text-secondary"
                    >
                      {{ apiName }}
                    </code>
                  </div>
                  <p class="text-body-sm text-secondary">
                    {{ specimen.tags.join(' · ') }}
                  </p>
                </UiSurface>
                <p
                  v-if="filteredSpecimens.length === 0"
                  key="catalogue-empty"
                  class="sm:col-span-2 xl:col-span-3 text-body text-secondary"
                >
                  {{ localize(catalogueCopy.noResults, locale) }}
                </p>
              </TransitionGroup>
            </UiSurface>
          </section>

          <section v-else aria-labelledby="module-title" class="grid gap-grid">
            <div v-if="selectedModule" data-design-lab-region="module" class="grid gap-grid">
              <component
                :is="selectedModule.component"
                :key="selectedModule.id"
                :locale="locale"
                data-neoverse-dissolve=""
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  </main>
</template>
