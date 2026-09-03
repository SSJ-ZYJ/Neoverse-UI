<script setup lang="ts">
import type { SegmentOption } from '@neoverse-ui/vue';
import {
  UiBadge,
  UiButton,
  UiCard,
  UiGlassSurface,
  UiIconButton,
  UiSegmentedControl,
} from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import LabIcon from '../LabIcon.vue';
import { focusClasses } from '../lab-data';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.composition;
const controlClusterMode = ref('focus');
const docsToolbarMode = ref('read');

const controlClusterOptions = computed<readonly SegmentOption[]>(() => [
  {
    value: 'focus',
    label: localize(copy.scenes.controlCluster.modes.focus, props.locale),
  },
  {
    value: 'review',
    label: localize(copy.scenes.controlCluster.modes.review, props.locale),
  },
  {
    value: 'archive',
    label: localize(copy.scenes.controlCluster.modes.archive, props.locale),
  },
]);

const floatingToolbarOptions = computed<readonly SegmentOption[]>(() => [
  {
    value: 'canvas',
    label: localize(copy.scenes.floatingToolbar.modes.canvas, props.locale),
  },
  {
    value: 'inspect',
    label: localize(copy.scenes.floatingToolbar.modes.inspect, props.locale),
  },
  {
    value: 'history',
    label: localize(copy.scenes.floatingToolbar.modes.history, props.locale),
  },
]);

const docsToolbarOptions = computed<readonly SegmentOption[]>(() => [
  {
    value: 'read',
    label: localize(copy.scenes.docsToolbar.modes.read, props.locale),
  },
  {
    value: 'edit',
    label: localize(copy.scenes.docsToolbar.modes.edit, props.locale),
  },
  {
    value: 'preview',
    label: localize(copy.scenes.docsToolbar.modes.preview, props.locale),
  },
]);

const navigationItems = computed(() => [
  {
    id: 'foundations',
    label: localize(copy.scenes.docsNavigationGroup.links.foundations, props.locale),
    selected: true,
  },
  {
    id: 'tokens',
    label: localize(copy.scenes.docsNavigationGroup.links.tokens, props.locale),
    selected: false,
  },
  {
    id: 'materials',
    label: localize(copy.scenes.docsNavigationGroup.links.materials, props.locale),
    selected: false,
  },
  {
    id: 'controls',
    label: localize(copy.scenes.docsNavigationGroup.links.controls, props.locale),
    selected: false,
  },
]);
</script>

<template>
  <MaterialBackdrop>
    <div class="grid gap-grid md:grid-cols-2">
      <section
        id="composition-control-cluster"
        class="grid gap-2"
        aria-labelledby="composition-control-cluster-title"
      >
        <header class="grid gap-1">
          <h3
            id="composition-control-cluster-title"
            class="text-subtitle font-heading tracking-heading"
          >
            {{ localize(copy.scenes.controlCluster.label, props.locale) }}
          </h3>
          <p class="text-caption text-secondary">
            {{ localize(copy.scenes.controlCluster.description, props.locale) }}
          </p>
        </header>

        <UiGlassSurface variant="subtle">
          <div class="grid gap-3">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-caption text-muted">Neoverse UI</p>
                <h4 class="text-label font-label text-primary">
                  {{ localize(copy.scenes.controlCluster.workspace, props.locale) }}
                </h4>
              </div>
              <div class="flex items-center gap-2">
                <UiBadge variant="success">
                  {{ localize(copy.scenes.controlCluster.status, props.locale) }}
                </UiBadge>
                <UiIconButton
                  variant="ghost"
                  size="sm"
                  :label="localize(copy.scenes.controlCluster.more, props.locale)"
                >
                  <LabIcon name="menu" />
                </UiIconButton>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <UiSegmentedControl
                v-model="controlClusterMode"
                class="shrink-0"
                :aria-label="localize(copy.scenes.controlCluster.modesLabel, props.locale)"
                :options="controlClusterOptions"
              />
              <UiButton size="sm">
                {{ localize(copy.scenes.controlCluster.apply, props.locale) }}
              </UiButton>
            </div>
          </div>
        </UiGlassSurface>
      </section>

      <section
        id="composition-project-card"
        class="grid gap-2"
        aria-labelledby="composition-project-card-title"
      >
        <header class="grid gap-1">
          <h3
            id="composition-project-card-title"
            class="text-subtitle font-heading tracking-heading"
          >
            {{ localize(copy.scenes.projectCard.label, props.locale) }}
          </h3>
          <p class="text-caption text-secondary">
            {{ localize(copy.scenes.projectCard.description, props.locale) }}
          </p>
        </header>

        <UiCard class="grid gap-3 bg-surface-raised shadow-card">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-caption text-accent-primary">
                {{ localize(copy.scenes.projectCard.category, props.locale) }}
              </p>
              <h4 class="mt-1 text-subtitle font-heading tracking-heading text-primary">
                {{ localize(copy.scenes.projectCard.project, props.locale) }}
              </h4>
            </div>
            <div class="flex items-center gap-2">
              <UiBadge variant="success">
                {{ localize(copy.scenes.projectCard.status, props.locale) }}
              </UiBadge>
              <UiIconButton
                variant="ghost"
                size="sm"
                :label="localize(copy.scenes.projectCard.more, props.locale)"
              >
                <LabIcon name="menu" />
              </UiIconButton>
            </div>
          </div>

          <p class="text-body text-secondary">
            {{ localize(copy.scenes.projectCard.summary, props.locale) }}
          </p>

          <div class="grid gap-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-label font-label text-primary">
                {{ localize(copy.scenes.projectCard.progress, props.locale) }}
              </span>
              <span class="text-caption text-secondary">
                {{ localize(copy.scenes.projectCard.progressValue, props.locale) }}
              </span>
            </div>
            <div class="h-2 overflow-hidden rounded-pill bg-accent-soft" aria-hidden="true">
              <span class="block h-full w-2/3 rounded-pill bg-accent-secondary" />
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-caption text-muted">
              {{ localize(copy.scenes.projectCard.updated, props.locale) }}
            </span>
            <UiButton variant="ghost" size="sm">
              {{ localize(copy.scenes.projectCard.open, props.locale) }}
              <template #trailing><LabIcon name="arrow-right" /></template>
            </UiButton>
          </div>
        </UiCard>
      </section>

      <section
        id="composition-floating-toolbar"
        class="grid gap-2 md:col-span-2"
        aria-labelledby="composition-floating-toolbar-title"
      >
        <header class="grid gap-1">
          <h3
            id="composition-floating-toolbar-title"
            class="text-subtitle font-heading tracking-heading"
          >
            {{ localize(copy.scenes.floatingToolbar.label, props.locale) }}
          </h3>
          <p class="text-caption text-secondary">
            {{ localize(copy.scenes.floatingToolbar.description, props.locale) }}
          </p>
        </header>

        <UiGlassSurface
          variant="immersive"
          role="toolbar"
          :aria-label="localize(copy.scenes.floatingToolbar.modesLabel, props.locale)"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div
              class="flex w-full min-w-0 shrink-0 basis-full flex-1 flex-wrap items-center gap-2 md:w-auto md:shrink md:basis-auto"
            >
              <div class="flex items-center gap-1">
                <UiIconButton
                  variant="ghost"
                  size="sm"
                  :label="localize(copy.scenes.floatingToolbar.highlight, props.locale)"
                >
                  <LabIcon name="spark" />
                </UiIconButton>
                <UiIconButton
                  variant="ghost"
                  size="sm"
                  :label="localize(copy.scenes.floatingToolbar.add, props.locale)"
                >
                  <LabIcon name="plus" />
                </UiIconButton>
                <UiIconButton
                  variant="ghost"
                  size="sm"
                  :label="localize(copy.scenes.floatingToolbar.confirm, props.locale)"
                >
                  <LabIcon name="check" />
                </UiIconButton>
                <UiIconButton
                  variant="ghost"
                  size="sm"
                  :label="localize(copy.scenes.floatingToolbar.more, props.locale)"
                >
                  <LabIcon name="menu" />
                </UiIconButton>
              </div>
              <div class="w-full shrink-0 basis-full md:w-auto md:basis-auto">
                <UiSegmentedControl
                  class="w-full shrink-0 md:w-auto"
                  :aria-label="localize(copy.scenes.floatingToolbar.modesLabel, props.locale)"
                  :options="floatingToolbarOptions"
                />
              </div>
            </div>

            <div class="flex w-full items-center gap-2 md:w-auto">
              <UiButton variant="secondary" size="sm">
                {{ localize(copy.scenes.floatingToolbar.share, props.locale) }}
              </UiButton>
              <UiButton size="sm">
                {{ localize(copy.scenes.floatingToolbar.publish, props.locale) }}
              </UiButton>
            </div>
          </div>
        </UiGlassSurface>
      </section>

      <section
        id="composition-docs-article-header"
        class="grid gap-2 md:col-span-2"
        aria-labelledby="composition-docs-article-header-title"
      >
        <header class="grid gap-1">
          <h3
            id="composition-docs-article-header-title"
            class="text-subtitle font-heading tracking-heading"
          >
            {{ localize(copy.scenes.docsArticleHeader.label, props.locale) }}
          </h3>
          <p class="text-caption text-secondary">
            {{ localize(copy.scenes.docsArticleHeader.description, props.locale) }}
          </p>
        </header>

        <UiGlassSurface variant="elevated">
          <div class="grid gap-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0 max-w-container-lg">
                <UiBadge variant="info">
                  {{ localize(copy.scenes.docsArticleHeader.eyebrow, props.locale) }}
                </UiBadge>
                <h4
                  class="mt-3 text-heading font-heading leading-heading tracking-heading text-primary"
                >
                  {{ localize(copy.scenes.docsArticleHeader.title, props.locale) }}
                </h4>
                <p class="mt-2 max-w-container-md text-body text-secondary">
                  {{ localize(copy.scenes.docsArticleHeader.summary, props.locale) }}
                </p>
              </div>

              <div class="flex items-center gap-2">
                <UiButton variant="ghost" size="sm">
                  {{ localize(copy.scenes.docsArticleHeader.save, props.locale) }}
                </UiButton>
                <UiIconButton
                  variant="ghost"
                  size="sm"
                  :label="localize(copy.scenes.docsArticleHeader.more, props.locale)"
                >
                  <LabIcon name="menu" />
                </UiIconButton>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted">
              <span>{{ localize(copy.scenes.docsArticleHeader.meta, props.locale) }}</span>
              <span class="size-1 rounded-full bg-accent-primary" aria-hidden="true" />
              <span>{{ localize(copy.scenes.docsArticleHeader.author, props.locale) }}</span>
            </div>
          </div>
        </UiGlassSurface>
      </section>

      <section
        id="composition-docs-navigation-group"
        class="grid gap-2"
        aria-labelledby="composition-docs-navigation-group-title"
      >
        <header class="grid gap-1">
          <h3
            id="composition-docs-navigation-group-title"
            class="text-subtitle font-heading tracking-heading"
          >
            {{ localize(copy.scenes.docsNavigationGroup.label, props.locale) }}
          </h3>
          <p class="text-caption text-secondary">
            {{ localize(copy.scenes.docsNavigationGroup.description, props.locale) }}
          </p>
        </header>

        <nav
          class="grid gap-3 rounded-card bg-surface-subtle p-3 shadow-raised"
          :aria-label="localize(copy.scenes.docsNavigationGroup.navigationLabel, props.locale)"
        >
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-label font-label text-primary">
              {{ localize(copy.scenes.docsNavigationGroup.group, props.locale) }}
            </h4>
            <UiBadge>{{ localize(copy.scenes.docsNavigationGroup.count, props.locale) }}</UiBadge>
          </div>

          <ul class="grid gap-1">
            <li v-for="item in navigationItems" :key="item.id">
              <a
                href="#composition"
                :aria-current="item.selected ? 'page' : undefined"
                :class="[
                  'flex items-center rounded-control px-3 py-2 text-caption transition-colors duration-fast ease-standard',
                  focusClasses,
                  item.selected
                    ? 'bg-accent-soft font-semibold text-accent-primary'
                    : 'text-secondary hover:bg-accent-soft hover:text-primary',
                ]"
              >
                {{ item.label }}
              </a>
            </li>
          </ul>
        </nav>
      </section>

      <section
        id="composition-docs-toolbar"
        class="grid gap-2"
        aria-labelledby="composition-docs-toolbar-title"
      >
        <header class="grid gap-1">
          <h3
            id="composition-docs-toolbar-title"
            class="text-subtitle font-heading tracking-heading"
          >
            {{ localize(copy.scenes.docsToolbar.label, props.locale) }}
          </h3>
          <p class="text-caption text-secondary">
            {{ localize(copy.scenes.docsToolbar.description, props.locale) }}
          </p>
        </header>

        <UiGlassSurface
          variant="subtle"
          role="toolbar"
          :aria-label="localize(copy.scenes.docsToolbar.modesLabel, props.locale)"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-label font-label text-primary">
                {{ localize(copy.scenes.docsToolbar.workspace, props.locale) }}
              </p>
              <p class="mt-1 text-caption text-muted">
                {{ localize(copy.scenes.docsToolbar.saved, props.locale) }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <UiSegmentedControl
                v-model="docsToolbarMode"
                class="shrink-0"
                :aria-label="localize(copy.scenes.docsToolbar.modesLabel, props.locale)"
                :options="docsToolbarOptions"
              />
              <UiButton variant="secondary" size="sm">
                {{ localize(copy.scenes.docsToolbar.copyLink, props.locale) }}
              </UiButton>
              <UiIconButton
                variant="ghost"
                size="sm"
                :label="localize(copy.scenes.docsToolbar.more, props.locale)"
              >
                <LabIcon name="menu" />
              </UiIconButton>
            </div>
          </div>
        </UiGlassSurface>
      </section>

      <section
        id="composition-docs-content-surface"
        class="grid gap-2 md:col-span-2"
        aria-labelledby="composition-docs-content-surface-title"
      >
        <header class="grid gap-1">
          <h3
            id="composition-docs-content-surface-title"
            class="text-subtitle font-heading tracking-heading"
          >
            {{ localize(copy.scenes.docsContentSurface.label, props.locale) }}
          </h3>
          <p class="text-caption text-secondary">
            {{ localize(copy.scenes.docsContentSurface.description, props.locale) }}
          </p>
        </header>

        <article class="grid gap-4 rounded-card bg-surface-raised p-4 shadow-raised">
          <header class="grid max-w-container-lg gap-2">
            <UiBadge size="sm">
              {{ localize(copy.scenes.docsContentSurface.eyebrow, props.locale) }}
            </UiBadge>
            <h4 class="text-heading font-heading leading-heading tracking-heading text-primary">
              {{ localize(copy.scenes.docsContentSurface.title, props.locale) }}
            </h4>
            <p class="text-body text-secondary">
              {{ localize(copy.scenes.docsContentSurface.body, props.locale) }}
            </p>
          </header>

          <div class="grid gap-3 md:grid-cols-2">
            <p class="text-body text-secondary">
              {{ localize(copy.scenes.docsContentSurface.detail, props.locale) }}
            </p>
            <div class="grid gap-2 rounded-control bg-surface-subtle p-3">
              <p class="text-caption text-muted">
                {{ localize(copy.scenes.docsContentSurface.reference, props.locale) }}
              </p>
              <code class="break-all text-code text-secondary">--neoverse-color-text-primary</code>
            </div>
          </div>

          <div
            class="flex flex-wrap items-center justify-between gap-2 border-t border-subtle pt-3"
          >
            <UiButton variant="ghost" size="sm">
              {{ localize(copy.scenes.docsContentSurface.previous, props.locale) }}
            </UiButton>
            <UiButton variant="secondary" size="sm">
              {{ localize(copy.scenes.docsContentSurface.next, props.locale) }}
              <template #trailing><LabIcon name="arrow-right" /></template>
            </UiButton>
          </div>
        </article>
      </section>
    </div>
  </MaterialBackdrop>
</template>
