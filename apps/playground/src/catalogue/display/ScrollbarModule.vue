<script setup lang="ts">
import { cssVariables } from '@neoverse-ui/tokens';
import { UiCard, UiScrollbar, UiSurface } from '@neoverse-ui/vue';
import { ref } from 'vue';
import { localize, localized, moduleCopy } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import LabSpecimenHeader from '../../features/stage/LabSpecimenHeader.vue';
import ScrollbarViewportExample from './ScrollbarViewportExample.vue';
import { scrollbarItems } from './scrollbar-items';

const props = defineProps<LabModuleProps>();
const owners = ref([0, 1]);
const contractMode = new URLSearchParams(window.location.search).has('contract-fixtures');
const copy = moduleCopy.scrollbar;
const fixtureCopy = {
  label: localized('UiScrollbar document overlay', 'UiScrollbar 文档级浮层'),
  description: localized(
    'This is the real UiScrollbar component. In the isolated /frame fixture it binds to document scrolling; the component intentionally does not accept a container target.',
    '这里渲染的是真实 UiScrollbar 组件。在独立 /frame 场景中它绑定文档滚动；组件刻意不提供容器 target API。',
  ),
  hint: localized(
    'Scroll the isolated frame to reveal and validate the overlay thumb.',
    '滚动独立 Frame，即可显示并校验浮层滑块。',
  ),
} as const;

const tokenRows = [
  { label: copy.tokens.size, variable: cssVariables.components.scrollbar.immersive.size },
  { label: copy.tokens.thumbWidth, variable: cssVariables.components.scrollbar.overlay.thumbWidth },
  {
    label: copy.tokens.thumbWidthHover,
    variable: cssVariables.components.scrollbar.overlay.thumbWidthHover,
  },
  { label: copy.tokens.track, variable: cssVariables.components.scrollbar.immersive.track },
  { label: copy.tokens.thumb, variable: cssVariables.components.scrollbar.immersive.thumb },
  {
    label: copy.tokens.hover,
    variable: cssVariables.components.scrollbar.immersive.thumbHover,
  },
  {
    label: copy.tokens.active,
    variable: cssVariables.components.scrollbar.immersive.thumbActive,
  },
  { label: copy.tokens.edge, variable: cssVariables.components.scrollbar.immersive.thumbEdge },
] as const;
</script>

<template>
  <div class="grid gap-grid">
    <UiScrollbar data-ui-scrollbar-fixture :refresh-key="props.locale" />
    <div v-if="contractMode" data-scrollbar-owners class="grid gap-2">
      <UiScrollbar v-for="owner in owners" :key="owner" data-scrollbar-owner :refresh-key="owner" />
      <button type="button" data-scrollbar-unmount @click="owners = owners.slice(1)">
        Unmount one scrollbar
      </button>
    </div>
    <section class="grid gap-3" aria-labelledby="scrollbar-preview-title">
      <header class="grid gap-1">
        <h2 id="scrollbar-preview-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(copy.preview.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(copy.preview.description, props.locale) }}
        </p>
      </header>

      <div class="grid gap-grid lg:grid-cols-2">
        <ScrollbarViewportExample :locale="props.locale" />

        <UiCard as="article" class="grid gap-3 p-5" data-scrollbar-preview-card>
          <LabSpecimenHeader
            :title="localize(copy.tokens.label, props.locale)"
            :description="localize(copy.tokens.description, props.locale)"
          />

          <dl class="grid divide-y divide-subtle">
            <div
              v-for="token in tokenRows"
              :key="token.variable"
              class="grid gap-1 py-3 first:pt-0 last:pb-0"
            >
              <dt class="text-label font-label text-primary">
                {{ localize(token.label, props.locale) }}
              </dt>
              <dd class="min-w-0">
                <code class="block break-all text-code text-secondary">{{ token.variable }}</code>
              </dd>
            </div>
          </dl>
        </UiCard>
      </div>
    </section>

    <section
      id="scrollbar-component"
      class="scroll-mt-24 grid gap-3"
      aria-labelledby="scrollbar-component-title"
    >
      <header class="grid gap-1">
        <h2 id="scrollbar-component-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(fixtureCopy.label, props.locale) }}
        </h2>
        <p class="max-w-container-lg text-caption text-secondary">
          {{ localize(fixtureCopy.description, props.locale) }}
        </p>
      </header>
      <UiSurface
        surface="glass-subtle"
        class="grid gap-3 rounded-card p-4"
        data-scrollbar-fixture-surface
      >
        <p class="text-body text-secondary">
          {{ localize(fixtureCopy.hint, props.locale) }}
        </p>
        <ol class="grid gap-2">
          <UiSurface
            as="li"
            surface="inset"
            v-for="item in scrollbarItems"
            :key="`fixture-${item.number}`"
            class="flex items-center gap-3 rounded-control px-3 py-3"
          >
            <span class="shrink-0 text-code text-accent-primary">{{ item.number }}</span>
            <div class="min-w-0">
              <p class="text-label font-label text-primary">
                {{ localize(item.label, props.locale) }}
              </p>
              <p class="text-caption text-secondary">
                {{ localize(item.detail, props.locale) }}
              </p>
            </div>
          </UiSurface>
        </ol>
      </UiSurface>
    </section>
  </div>
</template>
