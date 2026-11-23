<script setup lang="ts">
import { glassMaterial } from '@neoverse-ui/tokens';
import { UiButton, UiSegmentedControl, UiSurface } from '@neoverse-ui/vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import LabIcon from './LabIcon.vue';
import {
  type LabModule,
  type LabSpecimen,
  labModules,
  labSpecimens,
  type ModuleId,
  type SpecimenId,
} from './lab-modules';
import type { SpecimenSession } from './lab-specimen-config';
import {
  appCopy,
  formatLocalized,
  type Locale,
  type LocalizedText,
  localize,
  localized,
} from './playground-content';
import { type ShowcaseSurface, showcaseSurfaces } from './showcase-surface';
import { type StageBackground, stageBackgrounds } from './stage-background';

const props = defineProps<{
  locale: Locale;
  module: LabModule | undefined;
  category: LocalizedText | undefined;
  specimen: LabSpecimen | undefined;
  session: SpecimenSession | undefined;
  background: StageBackground;
  surface: ShowcaseSurface;
}>();
const emit = defineEmits<{
  navigate: [module: ModuleId | SpecimenId];
  background: [value: string];
  surface: [value: string];
}>();
const FocusedSpecimen = () => {
  const preview = props.specimen?.preview;
  return typeof preview === 'function'
    ? preview(props.locale)
    : props.session?.render(props.locale);
};

const copy = {
  label: localized('Preview Stage', '预览区'),
  summary: localized(
    '{modules} modules · {specimens} specimens',
    '{modules} 个模块 · {specimens} 个示例',
  ),
  caption: localized('Live specimen', '实时示例'),
  detail: localized(
    'Switch material tiers to compare the same surface on this backdrop.',
    '切换材质层级，在同一背景上对比表面效果。',
  ),
  surfaceLabel: localized('Preview material', '预览材质'),
  components: localized('Components', '查看组件'),
  materials: localized('Materials', '浏览材质'),
  move: localized('Move preview', '移动预览'),
  moveHint: localized(
    'Drag, or use the arrow keys. Press Home to recenter.',
    '拖拽或使用方向键移动，按 Home 复位。',
  ),
} as const;

// The specimen moves inside the stage so the same component can be judged
// against different parts of the backdrop. The grip owns the gesture: dragging
// the component itself would fight its own press, focus and text selection.
const content = ref<HTMLElement | null>(null);
const offset = ref({ x: 0, y: 0 });
const dragging = ref(false);
const edgeGap = 8;
// A translate keeps the move out of layout. It is not a backdrop root, so
// nested Aurora Glass keeps sampling the stage; the preview also stays the
// direct grid child, so a `w-full` component still resolves against the stage
// column instead of collapsing into a shrink-wrapped wrapper.
const contentStyle = computed(() => ({
  '--stage-offset-x': `${offset.value.x}px`,
  '--stage-offset-y': `${offset.value.y}px`,
}));

function clampOffset(x: number, y: number): { x: number; y: number } {
  const area = content.value?.getBoundingClientRect();
  const box = content.value?.firstElementChild?.getBoundingClientRect();
  if (area === undefined || box === undefined) return { x: 0, y: 0 };
  const maxX = Math.max(0, (area.width - box.width) / 2 - edgeGap);
  const maxY = Math.max(0, (area.height - box.height) / 2 - edgeGap);
  return {
    x: Math.min(maxX, Math.max(-maxX, x)),
    y: Math.min(maxY, Math.max(-maxY, y)),
  };
}

let dragOrigin: { pointerX: number; pointerY: number; x: number; y: number } | null = null;

function startDrag(event: PointerEvent): void {
  if (event.button !== 0) return;
  event.preventDefault();
  dragOrigin = {
    pointerX: event.clientX,
    pointerY: event.clientY,
    x: offset.value.x,
    y: offset.value.y,
  };
  dragging.value = true;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function dragMove(event: PointerEvent): void {
  if (dragOrigin === null) return;
  offset.value = clampOffset(
    dragOrigin.x + event.clientX - dragOrigin.pointerX,
    dragOrigin.y + event.clientY - dragOrigin.pointerY,
  );
}

function endDrag(event: PointerEvent): void {
  if (dragOrigin === null) return;
  dragOrigin = null;
  dragging.value = false;
  const target = event.currentTarget as HTMLElement;
  if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
}

const nudgeSteps: Record<string, readonly [number, number] | undefined> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

function nudge(event: KeyboardEvent): void {
  if (event.key === 'Home') {
    event.preventDefault();
    resetPosition();
    return;
  }
  const direction = nudgeSteps[event.key];
  if (direction === undefined) return;
  event.preventDefault();
  const step = event.shiftKey ? 24 : 8;
  offset.value = clampOffset(
    offset.value.x + direction[0] * step,
    offset.value.y + direction[1] * step,
  );
}

function resetPosition(): void {
  offset.value = { x: 0, y: 0 };
}

function reclampPosition(): void {
  if (offset.value.x === 0 && offset.value.y === 0) return;
  offset.value = clampOffset(offset.value.x, offset.value.y);
}

watch(() => props.specimen?.id, resetPosition);
onMounted(() => window.addEventListener('resize', reclampPosition));
onBeforeUnmount(() => window.removeEventListener('resize', reclampPosition));
const backgroundOptions = computed(() =>
  stageBackgrounds.map((value) => ({
    value,
    label: localize(appCopy.stageBackground.options[value], props.locale),
  })),
);
const showcaseOptions = computed(() =>
  showcaseSurfaces.map((value) => ({
    value,
    label: localize(
      value === 'glass-subtle' ? glassMaterial.tiers.subtle : glassMaterial.tiers.elevated,
      props.locale,
    ),
  })),
);
</script>

<template>
  <div
    data-playground-page
    class="playground-stage"
    :class="{
      'playground-stage--focused': specimen,
      'playground-stage--composition': specimen?.kind === 'composition',
    }"
  >
    <div class="playground-stage__chrome">
      <div class="playground-stage__identity">
        <p class="playground-stage__label text-label-sm font-label text-secondary">
          <span aria-hidden="true" />
          {{ localize(copy.label, locale) }}
        </p>
        <button
          type="button"
          class="playground-stage__grip"
          data-stage-move-handle
          :aria-label="localize(copy.move, locale)"
          :title="localize(copy.moveHint, locale)"
          :data-dragging="dragging || undefined"
          @pointerdown="startDrag"
          @pointermove="dragMove"
          @pointerup="endDrag"
          @pointercancel="endDrag"
          @lostpointercapture="endDrag"
          @keydown="nudge"
          @dblclick="resetPosition"
        >
          <LabIcon name="move" />
        </button>
      </div>
      <UiSurface surface="elevated" class="playground-stage__background">
        <span class="hidden text-label-sm font-label text-secondary sm:inline" aria-hidden="true">
          {{ localize(appCopy.stageBackground.shortLabel, locale) }}
        </span>
        <UiSegmentedControl
          :aria-label="localize(appCopy.stageBackground.label, locale)"
          :model-value="props.background"
          :options="backgroundOptions"
          surface="none"
          @update:model-value="emit('background', $event)"
        />
      </UiSurface>
    </div>

    <section
      v-if="specimen"
      :id="specimen.id"
      :key="specimen.id"
      tabindex="-1"
      aria-labelledby="stage-title"
      data-design-lab-region="specimen"
      class="playground-stage__specimen"
    >
      <header class="playground-stage__heading">
        <p v-if="module" class="text-label-sm font-label text-secondary">
          {{ localize(module.label, locale) }}
        </p>
        <h2
          id="stage-title"
          class="playground-stage__specimen-title text-heading font-heading tracking-heading text-primary"
        >
          {{ localize(specimen.label, locale) }}
        </h2>
      </header>
      <div
        ref="content"
        class="playground-stage__specimen-content"
        :style="contentStyle"
        :data-dragging="dragging || undefined"
      >
        <FocusedSpecimen />
      </div>
    </section>

    <section v-else-if="module" aria-labelledby="stage-title" class="playground-stage__module">
      <header :key="module.id" class="playground-stage__heading">
        <p v-if="category" class="text-label-sm font-label text-secondary">
          {{ localize(category, locale) }}
        </p>
        <h2
          id="stage-title"
          tabindex="-1"
          data-stage-heading
          class="text-heading font-heading tracking-heading text-primary"
        >
          {{ localize(module.label, locale) }}
        </h2>
        <p class="max-w-reading text-body-lg text-secondary">
          {{ localize(module.description, locale) }}
        </p>
      </header>
      <div data-design-lab-region="module" class="grid min-w-0 gap-grid">
        <component :is="module.component" :key="module.id" :locale="locale" />
      </div>
    </section>

    <section
      v-else
      data-overview-hero
      aria-labelledby="stage-title"
      class="playground-overview-hero"
    >
      <header class="playground-stage__heading playground-overview-hero__intro">
        <p class="text-label-sm font-label text-secondary">
          {{ localize(appCopy.overview.eyebrow, locale) }}
        </p>
        <h2
          id="stage-title"
          tabindex="-1"
          data-stage-heading
          class="text-primary font-heading tracking-heading"
        >
          {{ localize(appCopy.overview.title, locale) }}
        </h2>
        <p class="max-w-reading text-body-lg text-secondary">
          {{ localize(appCopy.overview.description, locale) }}
        </p>
        <p class="text-caption tabular-nums text-secondary">
          {{
            formatLocalized(copy.summary, locale, {
              modules: labModules.length,
              specimens: labSpecimens.length,
            })
          }}
        </p>
      </header>

      <div class="playground-overview-hero__stage">
        <p class="text-label-sm font-label text-secondary">
          {{ localize(copy.caption, locale) }}
        </p>
        <UiSurface
          :surface="props.surface"
          data-neoverse-surface-hover="static"
          content-overflow="visible"
          class="playground-overview-hero__sample grid gap-4 rounded-card p-5"
        >
          <div class="grid gap-1">
            <h3 class="text-title-sm font-title text-primary">
              {{ localize(glassMaterial.name, locale) }}
            </h3>
            <p class="text-body-sm text-secondary">{{ localize(copy.detail, locale) }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <UiButton size="sm" @click="emit('navigate', 'controls-button')">
              {{ localize(copy.components, locale) }}
            </UiButton>
            <UiButton
              size="sm"
              variant="ghost"
              surface="none"
              @click="emit('navigate', 'materials-surface')"
            >
              {{ localize(copy.materials, locale) }}
            </UiButton>
          </div>
        </UiSurface>
        <UiSegmentedControl
          :aria-label="localize(copy.surfaceLabel, locale)"
          :model-value="props.surface"
          :options="showcaseOptions"
          surface="glass-subtle"
          @update:model-value="emit('surface', $event)"
        />
      </div>
    </section>
  </div>
</template>
