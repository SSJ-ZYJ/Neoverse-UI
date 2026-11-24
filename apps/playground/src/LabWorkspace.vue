<script setup lang="ts">
import { layoutBreakpoints } from '@neoverse-ui/tokens';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
  watch,
} from 'vue';
import LabExplorer from './LabExplorer.vue';
import LabInspector from './LabInspector.vue';
import LabStage from './LabStage.vue';
import LabToolbar from './LabToolbar.vue';
import { labModules, moduleGroupFor, resolveLabHash, specimenById } from './lab-modules';
import { appearanceControls, applyPlaygroundLocale } from './playground-appearance';
import { isLocale, type Locale } from './playground-content';
import { readPreferences, writePreferences } from './playground-preferences';
import { restoreScrollPosition, saveScrollPosition } from './scroll-restoration';
import {
  defaultShowcaseSurface,
  isShowcaseSurface,
  type ShowcaseSurface,
} from './showcase-surface';
import {
  clearSpecimenSession,
  persistSpecimenSession,
  restoreSpecimenSession,
  snapshotSpecimenSession,
} from './specimen-session-storage';
import {
  defaultStageBackground,
  isStageBackground,
  type StageBackground,
} from './stage-background';
import {
  applyThemeMode,
  isThemeMode,
  observeSystemTheme,
  persistThemeMode,
  resolveInitialThemeMode,
} from './theme-runtime';

function readHash(): string {
  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return window.location.hash.slice(1);
  }
}

function hrefFor(hash: string | null): string {
  const { pathname, search } = window.location;
  return `${pathname}${search}${hash === null ? '' : `#${hash}`}`;
}

const initialHash = readHash();
const route = shallowRef(resolveLabHash(initialHash));
if (window.location.hash !== '' && route.value?.canonicalHash !== initialHash) {
  window.history.replaceState(null, '', hrefFor(route.value?.canonicalHash ?? null));
}
let lastHash = window.location.hash;
const module = computed(() => labModules.find(({ id }) => id === route.value?.moduleId));
const category = computed(() =>
  route.value === null ? undefined : moduleGroupFor(route.value.moduleId),
);
const specimenId = computed(() => route.value?.specimenId);
const specimen = computed(() =>
  specimenId.value === undefined ? undefined : specimenById(specimenId.value),
);
let restoredInitialSession = false;
const session = computed(() => {
  const preview = specimen.value?.preview;
  const id = specimenId.value;
  if (typeof preview !== 'object' || id === undefined) return undefined;
  const created = preview.createSession();
  if (!restoredInitialSession) {
    restoredInitialSession = true;
    restoreSpecimenSession(created, id);
  }
  return {
    ...created,
    reset() {
      created.reset();
      clearSpecimenSession(id);
    },
  };
});
watch(
  () => {
    const id = specimenId.value;
    const current = session.value;
    return id === undefined || current === undefined
      ? null
      : { id, edits: snapshotSpecimenSession(current) };
  },
  (value) => {
    if (value !== null) persistSpecimenSession(value.id, value.edits);
  },
);

const preferences = readPreferences();
const parameters = new URLSearchParams(window.location.search);
const queryLocale = parameters.get('lang');
const showFps = parameters.get('fps') !== '0';
const fadeTheme = parameters.get('theme-motion') === 'fade';
const locale = ref<Locale>(
  isLocale(queryLocale)
    ? queryLocale
    : isLocale(preferences.locale)
      ? preferences.locale
      : navigator.language.toLowerCase().startsWith('zh')
        ? 'zh'
        : 'en',
);
// Selection follows the user immediately; translated copy waits for the snapshot.
const requestedLocale = ref(locale.value);
const theme = ref(resolveInitialThemeMode());
applyThemeMode(theme.value, false);
const stageBackground = ref<StageBackground>(
  isStageBackground(preferences.stageBackground)
    ? preferences.stageBackground
    : defaultStageBackground,
);
const showcaseSurface = ref<ShowcaseSurface>(
  isShowcaseSurface(preferences.showcaseSurface)
    ? preferences.showcaseSurface
    : defaultShowcaseSurface,
);
document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en';

function setTheme(value: string, origin?: Element): void {
  if (!isThemeMode(value)) return;
  theme.value = value;
  applyThemeMode(value, true, origin);
  persistThemeMode(value);
}

function setStageBackground(value: string): void {
  if (!isStageBackground(value)) return;
  stageBackground.value = value;
  writePreferences({ stageBackground: value });
}

function setShowcaseSurface(value: string): void {
  if (!isShowcaseSurface(value)) return;
  showcaseSurface.value = value;
  writePreferences({ showcaseSurface: value });
}

function setLocale(value: string): void {
  if (!isLocale(value) || value === requestedLocale.value) return;
  requestedLocale.value = value;
  writePreferences({ locale: value });
  const url = new URL(window.location.href);
  url.searchParams.set('lang', value);
  window.history.replaceState(null, '', url);
  applyPlaygroundLocale(locale, value);
}

provide(appearanceControls, { setTheme, setLocale });

type Panel = 'explorer' | 'inspector';
const desktopQuery = window.matchMedia(`(min-width: ${layoutBreakpoints.xl}px)`);
const persistent = ref(desktopQuery.matches);
const openPanel = ref<Panel | null>(null);
const explorer = ref<HTMLDialogElement | null>(null);
const inspector = ref<HTMLDialogElement | null>(null);
const workspace = ref<HTMLElement | null>(null);
// Focus moves to the stage for deep links and history too. Only keyboard
// navigation should paint the focus ring, so the shell tracks the modality
// instead of relying on the browser's programmatic-focus heuristic.
const focusReveal = ref(false);
let returnFocus: HTMLElement | null = null;
let focusFrame = 0;

function syncPanels(): void {
  for (const [panel, element] of [
    ['explorer', explorer.value],
    ['inspector', inspector.value],
  ] as const) {
    if (!element) continue;
    const modal = element.matches(':modal');
    if (modal && (persistent.value || openPanel.value !== panel)) element.close();
    if (persistent.value) {
      // Setting the non-modal open state keeps the desktop column from stealing focus.
      element.open = true;
    } else if (openPanel.value === panel) {
      if (!modal) {
        element.open = false;
        element.showModal();
      }
    } else {
      element.open = false;
    }
  }
}

watch([persistent, openPanel], syncPanels, { flush: 'post' });

function revealFocus(): void {
  focusReveal.value = true;
}

function concealFocus(): void {
  focusReveal.value = false;
}

function showPanel(panel: Panel, event: MouseEvent): void {
  if (persistent.value) return;
  returnFocus = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  openPanel.value = panel;
}

function closePanel(restoreFocus = true): void {
  if (openPanel.value === null) return;
  openPanel.value = null;
  const trigger = returnFocus;
  returnFocus = null;
  if (restoreFocus) void nextTick().then(() => trigger?.focus({ preventScroll: true }));
}

function syncLayout(event: MediaQueryListEvent): void {
  closePanel(false);
  persistent.value = event.matches;
}

function focusRoute(): void {
  cancelAnimationFrame(focusFrame);
  const selectedRoute = route.value;
  focusFrame = requestAnimationFrame(() => {
    const stage = workspace.value;
    if (stage === null || route.value !== selectedRoute) return;
    stage.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (selectedRoute?.specimenId !== undefined) {
      stage.querySelector<HTMLElement>('[data-design-lab-region="specimen"]')?.focus({
        preventScroll: true,
      });
    } else {
      stage.querySelector<HTMLElement>('[data-stage-heading]')?.focus({ preventScroll: true });
    }
  });
}

function applyRoute(next: ReturnType<typeof resolveLabHash>): void {
  route.value = next;
  if (next !== null) writePreferences({ module: next.moduleId });
  closePanel(false);
  focusRoute();
}

function navigate(hash: string | null): void {
  const next = hash === null ? null : resolveLabHash(hash);
  if (hash !== null && next === null) return;
  if (readHash() !== (hash ?? '')) window.history.pushState(null, '', hrefFor(hash));
  lastHash = window.location.hash;
  applyRoute(next);
}

function navigateLink(event: MouseEvent, hash: string | null): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return;
  event.preventDefault();
  navigate(hash);
}

function syncLocation(): void {
  const rawHash = window.location.hash;
  if (rawHash === lastHash) return;
  lastHash = rawHash;
  const hash = readHash();
  const next = resolveLabHash(hash);
  if (hash !== '' && next === null) {
    // Direct-rendered modules still own their unregistered in-page anchors.
    if (route.value === null) window.history.replaceState(null, '', hrefFor(null));
    return;
  }
  applyRoute(next);
}

function saveWorkspace(): void {
  saveScrollPosition(workspace.value);
}

let stopThemeObservation: (() => void) | undefined;
onMounted(() => {
  syncPanels();
  stopThemeObservation = observeSystemTheme();
  desktopQuery.addEventListener('change', syncLayout);
  window.addEventListener('pointerdown', concealFocus, true);
  window.addEventListener('keydown', revealFocus, true);
  window.addEventListener('popstate', syncLocation);
  window.addEventListener('hashchange', syncLocation);
  window.addEventListener('pagehide', saveWorkspace);
  if (!restoreScrollPosition(workspace.value) && route.value?.specimenId !== undefined)
    focusRoute();
});

onBeforeUnmount(() => {
  stopThemeObservation?.();
  desktopQuery.removeEventListener('change', syncLayout);
  window.removeEventListener('pointerdown', concealFocus, true);
  window.removeEventListener('keydown', revealFocus, true);
  window.removeEventListener('popstate', syncLocation);
  window.removeEventListener('hashchange', syncLocation);
  window.removeEventListener('pagehide', saveWorkspace);
  cancelAnimationFrame(focusFrame);
});
</script>

<template>
  <div
    class="playground-shell"
    :data-persistent="persistent || undefined"
    :data-focus-reveal="focusReveal || undefined"
  >
    <LabToolbar
      :locale="locale"
      :requested-locale="requestedLocale"
      :theme="theme"
      :persistent="persistent"
      :open-panel="openPanel"
      :show-fps="showFps"
      @theme="(value, origin) => setTheme(value, fadeTheme ? undefined : origin)"
      @locale="setLocale"
      @panel="showPanel"
    />
    <dialog
      ref="explorer"
      id="design-lab-navigation"
      data-playground-navigation
      class="playground-shell__panel playground-shell__explorer material-glass-subtle"
      data-neoverse-glass-edge-stroke
      data-neoverse-surface-hover="static"
      aria-labelledby="explorer-title"
      :role="persistent ? 'complementary' : undefined"
      :inert="!persistent && openPanel !== 'explorer'"
      @cancel.prevent="closePanel()"
      :closedby="persistent ? 'none' : 'any'"
    >
      <LabExplorer
        :locale="locale"
        :persistent="persistent"
        :route="route"
        :home-href="hrefFor(null)"
        @close="closePanel()"
        @navigate="navigateLink"
      />
    </dialog>
    <main
      ref="workspace"
      data-design-lab-workspace
      class="playground-shell__workspace scrollbar-immersive"
      :data-stage-background="stageBackground"
      aria-labelledby="stage-title"
    >
      <LabStage
        :locale="locale"
        :module="module"
        :category="category?.label"
        :specimen="specimen"
        :session="session"
        :background="stageBackground"
        :surface="showcaseSurface"
        @navigate="navigate"
        @background="setStageBackground"
        @surface="setShowcaseSurface"
      />
    </main>
    <dialog
      ref="inspector"
      id="design-lab-inspector"
      class="playground-shell__panel playground-shell__inspector material-glass-subtle"
      data-neoverse-glass-edge-stroke
      data-neoverse-surface-hover="static"
      aria-labelledby="inspector-title"
      :role="persistent ? 'complementary' : undefined"
      :inert="!persistent && openPanel !== 'inspector'"
      @cancel.prevent="closePanel()"
      :closedby="persistent ? 'none' : 'any'"
    >
      <LabInspector
        :locale="locale"
        :persistent="persistent"
        :module="module"
        :category="category?.label"
        :specimen="specimen"
        :session="session"
        @close="closePanel()"
      />
    </dialog>
  </div>
</template>
