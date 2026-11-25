<script setup lang="ts">
import {
  animateDisclosure,
  attachLayoutSizeMotion,
  type DisclosureAnimation,
  isWholePageTransitionVariant,
  type PageTransitionDirection,
  type PageTransitionOrigin,
  type PageTransitionVariant,
  pageTransitionDirections,
  pageTransitionVariants,
  startViewTransition,
} from '@neoverse-ui/motion';
import {
  UiBadge,
  UiButton,
  UiCard,
  UiSegmentedControl,
  UiStatusIndicator,
  UiSurface,
  useLayoutWidthMotion,
} from '@neoverse-ui/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import LabIcon from '../LabIcon.vue';
import LabSpecimenHeader from '../LabSpecimenHeader.vue';
import type { LabModuleProps } from '../modules/types';
import { formatLocalized, localize } from '../playground-content';
import { motionPageCopy } from './motion-page-copy';

type StandardVariant = Exclude<PageTransitionVariant, 'dissolve'>;
type ScopeMode = 'region' | 'document';
type BackgroundMode = 'shared' | 'surface';

const props = withDefaults(
  defineProps<
    LabModuleProps & {
      variant?: StandardVariant;
      direction?: PageTransitionDirection;
      transitionScope?: ScopeMode;
      background?: BackgroundMode;
      inlineControls?: boolean;
    }
  >(),
  {
    inlineControls: true,
  },
);
const copy = motionPageCopy.presets;

const standardVariants = pageTransitionVariants.filter(
  (variant): variant is StandardVariant => variant !== 'dissolve',
);
const activeVariant = ref<StandardVariant>(props.variant ?? 'glide');
const activeDirection = ref<PageTransitionDirection>(props.direction ?? 'forward');
const activeScope = ref<ScopeMode>(props.transitionScope ?? 'region');
const activeBackground = ref<BackgroundMode>(props.background ?? 'shared');
const activePageIndex = ref(0);
const controlsRoot = ref<HTMLElement | null>(null);
const directionHintBox = ref<HTMLElement | null>(null);
const pageStage = ref<HTMLElement | null>(null);
const pageContent = ref<HTMLElement | null>(null);

// biome-ignore lint/correctness/useHookAtTopLevel: Vue composables belong at <script setup> top level; the playground's React dependency makes Biome apply React hook rules here.
useLayoutWidthMotion({
  root: controlsRoot,
  targets: '[data-motion-page-width]',
  trigger: () => props.locale,
});

const directionOptions = computed(() =>
  pageTransitionDirections.map((value) => ({
    value,
    label: localize(copy.directions[value], props.locale),
  })),
);

const scopeOptions = computed(() =>
  (['region', 'document'] as const).map((value) => ({
    value,
    label: localize(copy.scopes[value], props.locale),
  })),
);

const backgroundOptions = computed(() =>
  (['shared', 'surface'] as const).map((value) => ({
    value,
    label: localize(copy.backgrounds[value], props.locale),
  })),
);

const currentPage = computed(() => copy.pages[activePageIndex.value] ?? copy.pages[0]);
const directional = computed(
  () =>
    activeVariant.value !== 'fade' &&
    activeVariant.value !== 'veil' &&
    activeVariant.value !== 'morph',
);
const wholePageEffect = computed(() => isWholePageTransitionVariant(activeVariant.value));
const behaviorSummary = computed(() => {
  if (wholePageEffect.value) return copy.behaviorWholePage;
  return activeBackground.value === 'surface' ? copy.behaviorDistinct : copy.behaviorShared;
});

const activeCallSnippet = computed(() => {
  const parts = [`variant: '${activeVariant.value}'`];
  if (directional.value) parts.push(`direction: '${activeDirection.value}'`);
  if (activeScope.value === 'region') parts.push('target');
  if (!wholePageEffect.value && activeBackground.value === 'shared') {
    parts.push('contentTarget');
  } else if (!wholePageEffect.value && activeBackground.value === 'surface') {
    parts.push("background: 'surface'");
  }
  if (activeVariant.value === 'iris') parts.push('origin');
  return `startViewTransition(update, { ${parts.join(', ')} })`;
});

async function transitionToPage(
  nextIndex: number,
  options: {
    variant?: StandardVariant;
    direction?: PageTransitionDirection;
    origin?: PageTransitionOrigin | null;
  } = {},
): Promise<void> {
  const variant = options.variant ?? activeVariant.value;
  const direction = options.direction ?? activeDirection.value;
  const total = copy.pages.length;
  const targetIndex = ((nextIndex % total) + total) % total;

  await startViewTransition(
    async () => {
      activePageIndex.value = targetIndex;
      await nextTick();
    },
    {
      variant,
      direction,
      target: activeScope.value === 'region' ? pageStage.value : null,
      contentTarget: pageContent.value,
      resizeTarget: pageStage.value,
      background: activeBackground.value,
      scope: activeScope.value,
      origin: options.origin ?? null,
    },
  );
}

function selectVariant(variant: StandardVariant, event?: MouseEvent): void {
  activeVariant.value = variant;
  const origin = event?.currentTarget instanceof Element ? event.currentTarget : null;
  void transitionToPage(activePageIndex.value + 1, { variant, origin });
}

function setDirection(value: string): void {
  if (value === 'forward' || value === 'backward' || value === 'up' || value === 'down') {
    activeDirection.value = value;
  }
}

function setScope(value: string): void {
  if (value === 'region' || value === 'document') {
    activeScope.value = value;
  }
}

function setBackground(value: string): void {
  if (value === 'shared' || value === 'surface') {
    activeBackground.value = value;
  }
}

function stepPage(delta: 1 | -1, event?: MouseEvent): void {
  const origin = event?.currentTarget instanceof Element ? event.currentTarget : null;
  const stepDirection: PageTransitionDirection =
    activeDirection.value === 'up' || activeDirection.value === 'down'
      ? delta > 0
        ? 'up'
        : 'down'
      : delta > 0
        ? 'forward'
        : 'backward';
  activeDirection.value = stepDirection;
  void transitionToPage(activePageIndex.value + delta, {
    direction: stepDirection,
    origin,
  });
}

let hintAnimation: DisclosureAnimation | undefined;
let detachSizeMotion: (() => void) | undefined;

function syncDirectionHint(expanded: boolean, animate: boolean): void {
  if (!directionHintBox.value) return;
  hintAnimation?.cancel();
  hintAnimation = animateDisclosure(directionHintBox.value, expanded, { animate });
}

watch(
  () => props.variant,
  (next) => {
    if (next && next !== activeVariant.value) {
      activeVariant.value = next;
      void transitionToPage(activePageIndex.value + 1, { variant: next });
    }
  },
);
watch(
  () => props.direction,
  (next) => {
    if (next && next !== activeDirection.value) {
      activeDirection.value = next;
    }
  },
);
watch(
  () => props.transitionScope,
  (next) => {
    if (next && next !== activeScope.value) {
      activeScope.value = next;
    }
  },
);
watch(
  () => props.background,
  (next) => {
    if (next && next !== activeBackground.value) {
      activeBackground.value = next;
      void transitionToPage(activePageIndex.value + 1);
    }
  },
);
watch(
  () => !directional.value,
  (expanded) => syncDirectionHint(expanded, true),
  { flush: 'post' },
);

onMounted(() => {
  syncDirectionHint(!directional.value, false);
  if (controlsRoot.value) {
    detachSizeMotion = attachLayoutSizeMotion(controlsRoot.value, {
      targets: '[data-motion-page-size]',
      attributes: ['class', 'data-variant', 'data-background', 'hidden'],
    });
  }
});

onBeforeUnmount(() => {
  hintAnimation?.cancel();
  detachSizeMotion?.();
  detachSizeMotion = undefined;
});
</script>

<template>
  <UiSurface surface="none" class="playground-specimen-panel grid gap-4">
    <LabSpecimenHeader
      :title="localize(copy.label, props.locale)"
      :description="localize(copy.description, props.locale)"
    />

    <div ref="controlsRoot" data-motion-page-controls class="grid gap-3">
      <fieldset v-if="props.inlineControls" class="m-0 flex flex-wrap gap-1.5 border-0 p-0">
        <legend class="sr-only">{{ localize(copy.label, props.locale) }}</legend>
        <UiButton
          v-for="variant in standardVariants"
          :key="variant"
          :data-motion-page-variant="variant"
          data-motion-page-width
          size="sm"
          :variant="activeVariant === variant ? 'primary' : 'secondary'"
          :aria-pressed="activeVariant === variant"
          @click="selectVariant(variant, $event)"
        >
          {{ localize(copy.variants[variant].label, props.locale) }}
        </UiButton>
      </fieldset>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <div v-if="props.inlineControls" class="flex flex-wrap items-center gap-2">
          <UiSegmentedControl
            data-motion-page-direction
            data-motion-page-width
            :aria-label="localize(copy.directionLabel, props.locale)"
            :model-value="activeDirection"
            :options="directionOptions"
            size="sm"
            surface="glass-subtle"
            @update:model-value="setDirection"
          />
          <UiSegmentedControl
            data-motion-page-scope
            data-motion-page-width
            :aria-label="localize(copy.scopeLabel, props.locale)"
            :model-value="activeScope"
            :options="scopeOptions"
            size="sm"
            surface="glass-subtle"
            @update:model-value="setScope"
          />
          <UiSegmentedControl
            data-motion-page-background
            data-motion-page-width
            :aria-label="localize(copy.backgroundLabel, props.locale)"
            :model-value="activeBackground"
            :options="backgroundOptions"
            size="sm"
            surface="glass-subtle"
            @update:model-value="setBackground"
          />
        </div>
        <div v-else class="flex flex-wrap items-center gap-2">
          <UiBadge size="sm" variant="info">{{
            localize(copy.variants[activeVariant].label, props.locale)
          }}</UiBadge>
          <UiBadge size="sm" variant="neutral">{{
            localize(copy.backgrounds[activeBackground], props.locale)
          }}</UiBadge>
        </div>

        <div class="flex items-center gap-1.5">
          <UiButton
            data-motion-page-prev
            data-motion-page-width
            size="sm"
            variant="secondary"
            @click="stepPage(-1, $event)"
          >
            {{ localize(copy.previous, props.locale) }}
          </UiButton>
          <UiButton
            data-motion-page-next
            data-motion-page-width
            size="sm"
            variant="secondary"
            @click="stepPage(1, $event)"
          >
            {{ localize(copy.next, props.locale) }}
          </UiButton>
        </div>
      </div>

      <div
        data-motion-page-size
        :data-variant="activeVariant"
        :data-background="activeBackground"
        class="grid gap-1"
      >
        <p class="min-h-5 text-caption text-secondary" data-motion-page-summary>
          {{ localize(copy.variants[activeVariant].summary, props.locale) }}
        </p>
        <p class="text-caption text-muted" data-motion-page-behavior>
          {{ localize(behaviorSummary, props.locale) }}
        </p>
      </div>

      <div ref="directionHintBox" data-motion-page-direction-hint>
        <p class="text-caption text-muted">
          {{ localize(copy.directionHintNeutral, props.locale) }}
        </p>
      </div>
    </div>

    <div ref="pageStage" data-motion-page-stage class="playground-page-transition-stage">
      <UiCard
        :data-motion-page-card="currentPage.id"
        :data-page-background="activeBackground"
        :data-page-id="currentPage.id"
        surface="solid"
        class="playground-page-card shadow-card"
      >
        <div
          ref="pageContent"
          data-neoverse-page-content
          data-motion-page-content
          class="playground-page-card__content p-5"
        >
          <div :key="currentPage.id" class="playground-page-card__inner">
            <div class="playground-page-card__body" :data-page="currentPage.id">
              <div class="playground-page-card__head">
                <div class="playground-page-card__meta">
                  <div class="playground-page-card__eyebrow">
                    <span
                      data-neoverse-page-morph="accent"
                      class="playground-page-card__accent"
                      :data-page="currentPage.id"
                    />
                    <span class="text-label-sm font-label text-secondary">
                      {{ localize(currentPage.eyebrow, props.locale) }}
                    </span>
                  </div>
                  <div data-neoverse-page-morph="badge" class="playground-page-card__badge">
                    <UiBadge size="sm" variant="info">
                      {{ localize(currentPage.badge, props.locale) }}
                    </UiBadge>
                  </div>
                </div>

                <h4 class="text-title-sm font-title text-primary">
                  {{ localize(currentPage.title, props.locale) }}
                </h4>
                <p class="max-w-reading text-body-sm text-secondary">
                  {{ localize(currentPage.body, props.locale) }}
                </p>
              </div>

              <div
                data-neoverse-page-morph="stage-figure"
                data-motion-page-figure
                class="playground-page-card__figure"
                :data-page="currentPage.id"
                aria-hidden="true"
              >
                <span class="playground-page-card__figure-orb" />
                <span class="playground-page-card__figure-bar" />
              </div>
            </div>

            <div
              class="flex flex-wrap items-center justify-between gap-3 border-t border-subtle pt-3"
            >
              <UiStatusIndicator size="sm" status="success">
                {{ localize(currentPage.status, props.locale) }}
              </UiStatusIndicator>
              <div class="flex items-center gap-2">
                <span class="text-caption tabular-nums text-muted">
                  {{
                    formatLocalized(copy.pageCounter, props.locale, {
                      current: activePageIndex + 1,
                      total: copy.pages.length,
                    })
                  }}
                </span>
                <UiButton
                  data-motion-page-cta
                  size="sm"
                  variant="primary"
                  @click="stepPage(1, $event)"
                >
                  <span>{{ localize(currentPage.cta, props.locale) }}</span>
                  <LabIcon name="arrow-right" />
                </UiButton>
              </div>
            </div>
          </div>
        </div>
      </UiCard>
    </div>

    <code class="truncate text-code text-secondary" :title="activeCallSnippet">
      {{ activeCallSnippet }}
    </code>
  </UiSurface>
</template>
