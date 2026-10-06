<script setup lang="ts">
import {
  motionRoles,
  type PresenceOrigin,
  type PresenceVariant,
  presenceAppearClassName,
  presenceVanishClassName,
} from '@neoverse-ui/motion';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { presence } from './presence';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    show: boolean;
    variant?: PresenceVariant;
    origin?: PresenceOrigin;
    as?: string;
  }>(),
  { variant: 'fade', as: 'div' },
);

const fallbackExitDurationMs = 400;
const exitDurationBufferMs = 50;

const mounted = ref(props.show);
const leaving = ref(false);
const element = ref<HTMLElement | null>(null);
let exitTimer: number | undefined;

watch(
  () => props.show,
  (show) => {
    window.clearTimeout(exitTimer);
    exitTimer = undefined;
    if (show) {
      /* Interrupting an exit restores the resting state immediately; the
         appear animation restarts from its own first frame. */
      mounted.value = true;
      leaving.value = false;
      return;
    }
    leaving.value = true;
    scheduleUnmountFallback();
  },
);

function scheduleUnmountFallback(): void {
  const node = element.value;
  let duration = fallbackExitDurationMs;
  if (node !== null) {
    const raw = window.getComputedStyle(node).getPropertyValue(motionRoles.exit.duration).trim();
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed)) {
      if (raw.endsWith('ms')) {
        duration = parsed;
      } else if (raw.endsWith('s')) {
        duration = parsed * 1000;
      }
    }
  }
  exitTimer = window.setTimeout(finishExit, duration + exitDurationBufferMs);
}

function finishExit(): void {
  window.clearTimeout(exitTimer);
  exitTimer = undefined;
  mounted.value = false;
  leaving.value = false;
}

function onAnimationEnd(event: AnimationEvent): void {
  if (event.target !== element.value || event.animationName !== presenceVanishClassName) return;
  finishExit();
}

onBeforeUnmount(() => {
  window.clearTimeout(exitTimer);
});

const presenceAttrs = computed(() => presence(props.variant, props.origin));
const classes = computed(() => [
  presenceAppearClassName,
  leaving.value ? presenceVanishClassName : '',
]);
</script>

<template>
  <component
    :is="props.as"
    v-if="mounted"
    ref="element"
    v-bind="{ ...presenceAttrs, ...$attrs }"
    :class="classes"
    @animationend="onAnimationEnd"
  >
    <slot />
  </component>
</template>
