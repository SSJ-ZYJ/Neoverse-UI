<script setup lang="ts">
import type { Material } from '@neoverse-ui/tokens';
import {
  UiBadge,
  UiButton,
  UiCard,
  UiCheckbox,
  UiControlSurface,
  UiInput,
  UiNotice,
  UiSegmentedControl,
  UiSkeleton,
  UiSurface,
  UiSwitch,
  UiTable,
  UiTabs,
  UiTooltipSurface,
} from '@neoverse-ui/vue';
import { computed, reactive, ref } from 'vue';
import { type Locale, localize, localized } from '../playground-content';
import { materialNames } from '../preference-segments';

const props = defineProps<{ locale: Locale }>();
const orderedMaterials = ['solid', 'frosted', 'glass'] as const satisfies readonly Material[];
const backdropKinds = ['solid', 'texture', 'image', 'text', 'animated'] as const;

const copy = {
  rolesTitle: localized('Surface roles, geometry & elevation', '表面角色、圆角与空间层级'),
  backdropsTitle: localized(
    'Backdrop stress scenes (solid, texture, artwork, text, motion)',
    '多背景压力场景（纯色、纹理、图像、高对比文字、动态背景）',
  ),
  nestingTitle: localized(
    'Same-material & 3×3 mixed-material nesting matrix',
    '同材质深度嵌套与 3×3 混合材质嵌套矩阵',
  ),
  statesTitle: localized(
    'Interactive states, scroll clipping & overlay layers',
    '交互状态、滚动裁剪与浮层稳定性',
  ),
  backdrops: {
    solid: localized('Solid canvas', '纯色画布'),
    texture: localized('Complex geometric texture', '复杂几何纹理'),
    image: localized('High-contrast artwork', '高对比度插画图像'),
    text: localized('Editorial text underlay', '高对比度底层文字'),
    animated: localized('Animated color field', '动态渐变背景'),
  },
  body: localized(
    'Legible body copy and hierarchy across changing backdrops.',
    '在不同背景下保持清晰可读的正文与空间层次。',
  ),
  action: localized('Inspect', '查看'),
  nestedCard: localized('Nested panel', '嵌套面板'),
  nestedInput: localized('Nested field', '嵌套输入框'),
  floatingOverlay: localized('Floating overlay plane', '独立浮层平面'),
  tooltip: localized('Compact overlay', '紧凑浮层'),
  borrowed: localized('Inherited surface', '继承父级表面'),
} as const;

const segmentValue = reactive<Record<Material, string>>({
  solid: 'a',
  frosted: 'a',
  glass: 'a',
});
const switchState = reactive<Record<Material, boolean>>({
  solid: true,
  frosted: true,
  glass: true,
});
const checkState = reactive<Record<Material, boolean>>({
  solid: true,
  frosted: true,
  glass: true,
});
const nestedText = ref('Neoverse v0.5.0');
const segOptions = computed(() => [
  { value: 'a', label: localize(localized('Rest', '静息'), props.locale) },
  { value: 'b', label: localize(localized('Active', '激活'), props.locale) },
]);
</script>

<template>
  <div class="grid min-w-0 gap-6" data-foundation-matrix>
    <!-- 1. All 7 Surface Roles + Geometry / Radii -->
    <section class="grid min-w-0 gap-3" data-foundation-scene="roles">
      <h4 class="text-subtitle font-heading text-primary">
        {{ localize(copy.rolesTitle, props.locale) }}
      </h4>
      <div class="playground-foundation-grid">
        <div
          v-for="material in orderedMaterials"
          :key="material"
          :data-neoverse-material="material"
          :data-foundation-column="material"
          class="playground-core-material grid min-w-0 content-start gap-3 rounded-card p-4"
        >
          <p class="text-label font-label text-primary">
            {{ localize(materialNames[material], props.locale) }}
          </p>
          <UiCard class="grid gap-3 rounded-panel" data-foundation-role="panel">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-label-sm font-label text-primary">panel · rounded-panel</span>
              <UiBadge variant="info" data-foundation-role="badge">Info</UiBadge>
            </div>
            <UiControlSurface
              class="flex-wrap"
              data-foundation-role="group"
              aria-label="Role controls"
            >
              <UiButton size="sm" variant="primary" data-foundation-role="control-primary"
                >Primary</UiButton
              >
              <UiButton size="sm" variant="secondary" data-foundation-role="control-secondary"
                >Secondary</UiButton
              >
              <UiButton size="sm" variant="ghost" data-foundation-role="control-ghost"
                >Ghost</UiButton
              >
            </UiControlSurface>
            <UiInput v-model="nestedText" aria-label="Role field" data-foundation-role="field" />
            <UiNotice variant="success" data-foundation-role="notice">
              {{ localize(copy.body, props.locale) }}
            </UiNotice>
            <div class="grid gap-2">
              <UiSkeleton variant="text" data-foundation-role="skeleton" />
            </div>
          </UiCard>
          <UiTable striped hoverable data-foundation-role="table">
            <thead>
              <tr>
                <th scope="col">Role</th>
                <th scope="col">Radius</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>table</td>
                <td>rounded-card</td>
              </tr>
              <tr>
                <td>control</td>
                <td>rounded-control</td>
              </tr>
            </tbody>
          </UiTable>
          <div class="grid gap-2">
            <UiInput
              v-model="nestedText"
              aria-label="Standalone field"
              data-foundation-role="standalone-field"
            />
            <div class="flex flex-wrap items-center gap-2">
              <UiControlSurface
                class="flex-wrap"
                aria-label="Standalone group"
                data-foundation-role="standalone-group"
              >
                <UiButton size="sm" variant="secondary">Group item</UiButton>
              </UiControlSurface>
              <UiButton
                size="sm"
                variant="secondary"
                class="rounded-pill"
                data-foundation-role="standalone-control"
              >
                pill
              </UiButton>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <UiTooltipSurface data-foundation-role="compact-overlay" placement="top">
                {{ localize(copy.tooltip, props.locale) }}
              </UiTooltipSurface>
              <UiSurface
                surface="auto"
                role="dialog"
                aria-label="Overlay role"
                class="material-role-overlay rounded-panel px-3 py-2 text-caption text-primary"
                data-foundation-role="overlay"
              >
                overlay
              </UiSurface>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. Five Backdrop Stress Scenes -->
    <section class="grid min-w-0 gap-3" data-foundation-scene="backdrops">
      <h4 class="text-subtitle font-heading text-primary">
        {{ localize(copy.backdropsTitle, props.locale) }}
      </h4>
      <div class="grid min-w-0 gap-4">
        <div
          v-for="backdrop in backdropKinds"
          :key="backdrop"
          :class="[
            'playground-foundation-stage grid gap-3',
            `playground-foundation-stage--${backdrop}`,
          ]"
          :data-foundation-backdrop="backdrop"
        >
          <svg
            v-if="backdrop === 'image'"
            class="playground-foundation-artwork"
            viewBox="0 0 800 280"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient :id="`nv-art-${backdrop}`" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.72" />
                <stop offset="45%" stop-color="#14b8a6" stop-opacity="0.65" />
                <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.72" />
              </linearGradient>
            </defs>
            <rect width="800" height="280" :fill="`url(#nv-art-${backdrop})`" />
            <circle cx="150" cy="95" r="110" fill="#2563eb" fill-opacity="0.55" />
            <circle cx="430" cy="180" r="130" fill="#ec4899" fill-opacity="0.48" />
            <polygon points="540,280 680,30 800,280" fill="#0f172a" fill-opacity="0.55" />
            <rect
              x="260"
              y="36"
              width="190"
              height="44"
              rx="22"
              fill="#ffffff"
              fill-opacity="0.7"
            />
          </svg>
          <div
            v-if="backdrop === 'text'"
            class="playground-foundation-text-underlay"
            aria-hidden="true"
          >
            NEOVERSE SOLID FROSTED AURORA GLASS CONTRAST LEGIBILITY TYPOGRAPHY 0123456789 NEOVERSE
            SOLID FROSTED AURORA GLASS CONTRAST LEGIBILITY TYPOGRAPHY 0123456789 NEOVERSE SOLID
            FROSTED AURORA GLASS CONTRAST LEGIBILITY TYPOGRAPHY 0123456789 NEOVERSE SOLID FROSTED
            AURORA GLASS CONTRAST LEGIBILITY TYPOGRAPHY 0123456789
          </div>
          <p class="relative z-1 text-caption font-label text-primary">
            {{ localize(copy.backdrops[backdrop], props.locale) }}
          </p>
          <div class="playground-foundation-grid relative z-1">
            <div
              v-for="material in orderedMaterials"
              :key="material"
              :data-neoverse-material="material"
            >
              <UiCard class="grid gap-2" :data-backdrop-card="`${backdrop}-${material}`">
                <div class="flex items-center justify-between gap-2">
                  <strong class="text-label font-label text-primary">
                    {{ localize(materialNames[material], props.locale) }}
                  </strong>
                  <UiBadge variant="warning">{{ backdrop }}</UiBadge>
                </div>
                <p class="text-body-sm text-secondary">{{ localize(copy.body, props.locale) }}</p>
                <div class="flex flex-wrap gap-2">
                  <UiButton size="sm" variant="primary">{{
                    localize(copy.action, props.locale)
                  }}</UiButton>
                  <UiButton size="sm" variant="secondary">Surface</UiButton>
                </div>
              </UiCard>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Same-Material Deep Nesting & 3x3 Mixed-Material Nesting Matrix -->
    <section class="grid min-w-0 gap-4" data-foundation-scene="nesting">
      <h4 class="text-subtitle font-heading text-primary">
        {{ localize(copy.nestingTitle, props.locale) }}
      </h4>
      <div class="playground-foundation-grid">
        <div
          v-for="material in orderedMaterials"
          :key="`same-${material}`"
          :data-neoverse-material="material"
          :data-same-nesting="material"
          class="playground-core-material grid gap-3 rounded-card p-4"
        >
          <UiCard class="grid gap-3" data-nesting-level="outer-panel">
            <span class="text-label-sm font-label text-primary">
              {{ localize(materialNames[material], props.locale) }}
              → {{ localize(copy.nestedCard, props.locale) }}
            </span>
            <UiCard class="grid gap-2" data-nesting-level="inner-panel">
              <UiControlSurface
                class="flex-wrap"
                data-nesting-level="inner-group"
                aria-label="Nested group"
              >
                <UiButton size="sm" variant="secondary" data-nesting-level="inner-control"
                  >Control</UiButton
                >
                <UiButton size="sm" variant="primary">Primary</UiButton>
              </UiControlSurface>
              <UiInput
                v-model="nestedText"
                :aria-label="localize(copy.nestedInput, props.locale)"
                data-nesting-level="inner-field"
              />
              <UiSurface
                surface="auto"
                glass-nesting="inherit"
                class="rounded-control p-2 text-caption text-secondary"
                data-nesting-level="inherit-surface"
              >
                {{ localize(copy.borrowed, props.locale) }}
              </UiSurface>
              <UiSurface
                surface="auto"
                class="material-role-overlay rounded-control p-2 text-caption text-primary"
                data-nesting-level="floating-overlay"
              >
                {{ localize(copy.floatingOverlay, props.locale) }}
              </UiSurface>
            </UiCard>
          </UiCard>
        </div>
      </div>

      <div class="playground-foundation-nesting-grid" data-mixed-nesting-matrix>
        <div
          v-for="parent in orderedMaterials"
          :key="`parent-${parent}`"
          :data-neoverse-material="parent"
          class="playground-core-material grid gap-3 rounded-card p-3"
        >
          <UiCard class="grid gap-3" :data-nesting-parent="parent">
            <span class="text-caption font-label text-primary">Parent: {{ parent }}</span>
            <div
              v-for="child in orderedMaterials"
              :key="`${parent}-${child}`"
              :data-neoverse-material="child"
              :data-nesting-pair="`${parent}-${child}`"
            >
              <UiCard class="grid gap-2" :data-nesting-child="`${parent}-${child}`">
                <span class="text-caption text-primary">{{ parent }} → {{ child }}</span>
                <UiButton size="sm" variant="secondary" :data-nesting-button="`${parent}-${child}`">
                  {{ child }}
                </UiButton>
              </UiCard>
            </div>
          </UiCard>
        </div>
      </div>
    </section>

    <!-- 4. States, Selection & Scroll Clipping -->
    <section class="grid min-w-0 gap-3" data-foundation-scene="states">
      <h4 class="text-subtitle font-heading text-primary">
        {{ localize(copy.statesTitle, props.locale) }}
      </h4>
      <div class="playground-foundation-grid">
        <div
          v-for="material in orderedMaterials"
          :key="`states-${material}`"
          :data-neoverse-material="material"
          :data-states-column="material"
          class="playground-core-material grid gap-3 rounded-card p-4"
        >
          <div class="flex flex-wrap gap-2">
            <UiButton size="sm" variant="primary" data-state-btn="primary">Primary</UiButton>
            <UiButton size="sm" variant="secondary" data-state-btn="secondary">Secondary</UiButton>
            <UiButton size="sm" variant="danger" data-state-btn="danger">Danger</UiButton>
            <UiButton size="sm" variant="success" data-state-btn="success">Success</UiButton>
            <UiButton size="sm" variant="ghost" data-state-btn="ghost">Ghost</UiButton>
            <UiButton size="sm" variant="secondary" disabled data-state-btn="disabled"
              >Disabled</UiButton
            >
          </div>
          <div class="flex flex-wrap items-center gap-4">
            <UiCheckbox v-model="checkState[material]" label="Checked" />
            <UiSwitch v-model="switchState[material]" label="Enabled" />
          </div>
          <UiSegmentedControl
            v-model="segmentValue[material]"
            :options="segOptions"
            :aria-label="`${material} segmented`"
            class="justify-self-start"
          />
          <UiTabs :options="segOptions" v-bind="{ ariaLabel: `${material} tabs` }" />
          <div class="playground-foundation-scroll-box grid gap-2" :data-scroll-stage="material">
            <UiCard v-for="n in 6" :key="n" class="flex items-center justify-between gap-2">
              <span class="text-caption text-primary">{{ material }} item #{{ n }}</span>
              <UiButton size="sm" variant="secondary">Open</UiButton>
            </UiCard>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
