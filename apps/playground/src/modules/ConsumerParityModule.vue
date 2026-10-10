<script setup lang="ts">
import {
  UiAction,
  UiDock,
  UiNavigationItem,
  UiSegmentedControl,
  UiStatusIndicator,
  UiSurface,
  UiTable,
} from '@neoverse-ui/vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  componentContracts,
  contractLabSummary,
  frameworkParityNames,
  interactionContracts,
} from '../contract-lab';
import LabIcon from '../LabIcon.vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, localized, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.consumerParity;
const contractCopy = {
  title: localized('Contract coverage', '契约覆盖'),
  description: localized(
    'The matrix, framework parity contract, runtime fixture, and interaction specimens are summarized from the same contract metadata.',
    '组件矩阵、框架一致性契约、Runtime Fixture 与交互示例统一由同一份契约元数据汇总。',
  ),
  canonical: localized('Canonical Shared', 'Canonical Shared'),
  releaseVisual: localized('Release visual', '发布级视觉'),
  runtime: localized('Runtime validated', 'Runtime 已验证'),
  parity: localized('Framework parity', '框架一致性'),
  vueRuntime: localized(
    'Vue specimens are validated in the active Design Lab.',
    'Vue 示例直接在当前 Design Lab 中验证。',
  ),
  reactRuntime: localized('Open React Runtime Fixture', '打开 React Runtime Fixture'),
  tableCaption: localized('Component contract matrix', '组件契约矩阵'),
  component: localized('Component', '组件'),
  track: localized('Track', '轨道'),
  maturity: localized('Maturity', '成熟度'),
  visual: localized('Visual', '视觉'),
  runtimeColumn: localized('Runtime', 'Runtime'),
  interaction: localized('Interaction', '交互'),
  parityColumn: localized('Parity', '一致性'),
  covered: localized('covered', '已覆盖'),
  notApplicable: localized('n/a', '不适用'),
} as const;
const contractRows = computed(() =>
  componentContracts.map((component) => {
    const interaction = interactionContracts.find((contract) =>
      contract.apiNames.some((apiName) => apiName === component.name),
    );
    return {
      ...component,
      parity: frameworkParityNames.has(component.name),
      interaction,
    };
  }),
);
const language = ref('en');
const activeNavigationId = ref('home');
const compactNavigation = ref(false);
let compactNavigationQuery: MediaQueryList | undefined;
const compactBreakpointToken = '--neoverse-playground-consumer-dock-compact-breakpoint';

function updateCompactNavigation(query: MediaQueryList | MediaQueryListEvent): void {
  compactNavigation.value = query.matches;
}

onMounted(() => {
  const compactBreakpoint = getComputedStyle(document.documentElement)
    .getPropertyValue(compactBreakpointToken)
    .trim();
  if (compactBreakpoint.length === 0) {
    throw new Error(`Missing playground token: ${compactBreakpointToken}`);
  }

  compactNavigationQuery = window.matchMedia(`(max-width: ${compactBreakpoint})`);
  updateCompactNavigation(compactNavigationQuery);
  compactNavigationQuery.addEventListener('change', updateCompactNavigation);
});

onBeforeUnmount(() => {
  compactNavigationQuery?.removeEventListener('change', updateCompactNavigation);
});

const heroActions = [
  { label: 'Website', icon: 'globe' },
  { label: 'Blog', icon: 'article' },
  { label: 'Linux.Do', icon: 'message' },
  { label: 'RedNote', icon: 'bookmark' },
  { label: 'Email', icon: 'mail' },
  { label: 'GitHub', icon: 'github' },
] as const;

const navigationItems = computed(
  () =>
    [
      { id: 'home', label: localize(copy.navigation.items.home, props.locale), icon: 'home' },
      {
        id: 'projects',
        label: localize(copy.navigation.items.projects, props.locale),
        icon: 'folder',
      },
      { id: 'focus', label: localize(copy.navigation.items.focus, props.locale), icon: 'target' },
      {
        id: 'pulse',
        label: localize(copy.navigation.items.pulse, props.locale),
        icon: 'activity',
      },
    ] as const,
);

const languageOptions = computed(
  () =>
    [
      { value: 'en', label: 'EN', ariaLabel: props.locale === 'zh' ? '英语' : 'English' },
      {
        value: 'zh',
        label: '中',
        ariaLabel: props.locale === 'zh' ? '简体中文' : 'Simplified Chinese',
      },
    ] as const,
);
</script>

<template>
  <MaterialBackdrop>
    <div class="grid min-w-0 gap-grid">
      <section class="grid min-w-0 gap-4" data-contract-lab>
        <header class="grid gap-1">
          <h3 class="text-subtitle font-heading tracking-heading">
            {{ localize(contractCopy.title, props.locale) }}
          </h3>
          <p class="max-w-reading-wide text-caption text-secondary">
            {{ localize(contractCopy.description, props.locale) }}
          </p>
        </header>

        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-contract-summary>
          <UiSurface surface="glass-subtle" class="grid gap-1 rounded-card p-4">
            <span class="text-caption text-muted"
              >{{ localize(contractCopy.canonical, props.locale) }}</span
            >
            <strong class="text-title-lg font-title text-primary"
              >{{ contractLabSummary.canonicalShared }}</strong
            >
          </UiSurface>
          <UiSurface surface="glass-subtle" class="grid gap-1 rounded-card p-4">
            <span class="text-caption text-muted"
              >{{ localize(contractCopy.releaseVisual, props.locale) }}</span
            >
            <strong class="text-title-lg font-title text-primary"
              >{{ contractLabSummary.releaseVisual }}</strong
            >
          </UiSurface>
          <UiSurface surface="glass-subtle" class="grid gap-1 rounded-card p-4">
            <span class="text-caption text-muted"
              >{{ localize(contractCopy.runtime, props.locale) }}</span
            >
            <strong class="text-title-lg font-title text-primary"
              >{{ contractLabSummary.runtimeValidated }}</strong
            >
          </UiSurface>
          <UiSurface surface="glass-subtle" class="grid gap-1 rounded-card p-4">
            <span class="text-caption text-muted"
              >{{ localize(contractCopy.parity, props.locale) }}</span
            >
            <strong class="text-title-lg font-title text-primary"
              >{{ contractLabSummary.frameworkParity }}</strong
            >
          </UiSurface>
        </div>

        <UiSurface
          surface="none"
          class="flex flex-wrap items-center justify-between gap-3 rounded-card"
          data-contract-runtime-entry
        >
          <span class="text-body-sm text-secondary" data-contract-runtime-framework="vue">
            {{ localize(contractCopy.vueRuntime, props.locale) }}
          </span>
          <UiAction
            :href="`/react-fixture?lang=${props.locale}`"
            size="sm"
            variant="secondary"
            data-contract-runtime-framework="react"
          >
            {{ localize(contractCopy.reactRuntime, props.locale) }}
          </UiAction>
        </UiSurface>

        <UiSurface surface="glass-elevated" class="rounded-card p-3" data-contract-matrix>
          <UiTable :caption="localize(contractCopy.tableCaption, props.locale)" striped hoverable>
            <thead>
              <tr>
                <th>{{ localize(contractCopy.component, props.locale) }}</th>
                <th>{{ localize(contractCopy.track, props.locale) }}</th>
                <th>{{ localize(contractCopy.maturity, props.locale) }}</th>
                <th>{{ localize(contractCopy.visual, props.locale) }}</th>
                <th>{{ localize(contractCopy.runtimeColumn, props.locale) }}</th>
                <th>{{ localize(contractCopy.interaction, props.locale) }}</th>
                <th>{{ localize(contractCopy.parityColumn, props.locale) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="component in contractRows"
                :key="component.name"
                :data-contract-component="component.name"
                :data-contract-track="component.track"
                :data-contract-visual="component.visual"
                :data-contract-runtime="component.runtime"
                :data-contract-parity="component.parity ? 'validated' : 'not-applicable'"
                :data-contract-states="component.interaction?.states.join(' ')"
                :data-contract-checks="component.interaction?.checks.join(' ')"
              >
                <td><code class="text-code text-primary">{{ component.name }}</code></td>
                <td>{{ component.track }}</td>
                <td>{{ component.maturity }}</td>
                <td>{{ component.visual }}</td>
                <td>{{ component.runtime }}</td>
                <td>
                  {{ component.interaction ? localize(contractCopy.covered, props.locale) : '—' }}
                </td>
                <td>
                  {{ component.parity
                      ? localize(contractCopy.covered, props.locale)
                      : component.track === 'canonical-shared'
                        ? '—'
                        : localize(contractCopy.notApplicable, props.locale) }}
                </td>
              </tr>
            </tbody>
          </UiTable>
        </UiSurface>
      </section>

      <section class="grid min-w-0 gap-3" aria-labelledby="consumer-parity-hero-title">
        <header class="grid gap-1">
          <h3 id="consumer-parity-hero-title" class="text-subtitle font-heading tracking-heading">
            {{ localize(copy.hero.label, props.locale) }}
          </h3>
          <p class="text-caption text-secondary">
            {{ localize(copy.hero.description, props.locale) }}
          </p>
        </header>

        <div
          class="grid min-h-64 min-w-0 content-center gap-4 rounded-panel border border-subtle bg-surface-subtle p-5 shadow-card"
        >
          <UiStatusIndicator status="success" pulse role="status">
            {{ localize(copy.hero.status, props.locale) }}
          </UiStatusIndicator>
          <div class="max-w-container-md">
            <p class="text-caption font-label text-accent-primary">Neoverse</p>
            <h4
              class="mt-2 text-heading font-heading leading-heading tracking-heading text-primary"
            >
              {{ localize(copy.hero.title, props.locale) }}
            </h4>
            <p class="mt-2 text-body text-secondary">
              {{ localize(copy.hero.summary, props.locale) }}
            </p>
          </div>
          <div
            class="flex min-w-0 flex-wrap items-center gap-2"
            data-consumer-parity="hero-actions"
          >
            <UiAction
              v-for="action in heroActions"
              :key="action.label"
              href="#consumer-parity"
              @click.prevent
              variant="secondary"
              size="md"
            >
              <template #leading><LabIcon :name="action.icon" /></template>
              {{ action.label }}
            </UiAction>
          </div>
        </div>
      </section>

      <section class="grid min-w-0 gap-3" aria-labelledby="consumer-parity-navigation-title">
        <header class="grid gap-1">
          <h3
            id="consumer-parity-navigation-title"
            class="text-subtitle font-heading tracking-heading"
          >
            {{ localize(copy.navigation.label, props.locale) }}
          </h3>
          <p class="text-caption text-secondary">
            {{ localize(copy.navigation.description, props.locale) }}
          </p>
        </header>

        <div
          class="flex min-h-40 min-w-0 items-center justify-center rounded-panel border border-subtle bg-surface-subtle p-2 shadow-card sm:p-4"
        >
          <UiDock
            :compact="compactNavigation"
            :scale="compactNavigation ? 'md' : 'lg'"
            class="consumer-parity-dock"
            :aria-label="localize(copy.navigation.ariaLabel, props.locale)"
            data-consumer-parity="floating-navigation"
          >
            <UiNavigationItem
              v-for="item in navigationItems"
              :key="item.id"
              class="consumer-parity-dock__item"
              href="#consumer-parity"
              :label="item.label"
              :active="item.id === activeNavigationId"
              :compact="compactNavigation"
              @click.prevent="activeNavigationId = item.id"
            >
              <template #icon><LabIcon :name="item.icon" /></template>
            </UiNavigationItem>
            <template #trailing>
              <UiSegmentedControl
                v-model="language"
                surface="none"
                class="consumer-parity-dock__language"
                :aria-label="localize(copy.navigation.languageLabel, props.locale)"
                :options="languageOptions"
              />
            </template>
          </UiDock>
        </div>
      </section>
    </div>
  </MaterialBackdrop>
</template>
