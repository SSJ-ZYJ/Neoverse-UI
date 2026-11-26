<script setup lang="ts">
import { bridgePortalMaterialScope } from '@neoverse-ui/overlay-runtime';
import { getSurfaceClass } from '@neoverse-ui/tokens';
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useSlots,
  useTemplateRef,
  watch,
  watchPostEffect,
} from 'vue';
import type { ToastProps } from '../../types';
import UiPresence from '../motion/UiPresence.vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ToastProps>(), {
  open: false,
  variant: 'neutral',
});
const emit = defineEmits<{ 'update:open': [value: boolean] }>();
const mounted = ref(false);
const materialSource = useTemplateRef<HTMLSpanElement>('materialSource');
const host = useTemplateRef<HTMLDivElement>('host');
const slots = useSlots();
const presentation = () => props.presentation ?? (slots.action ? 'action' : 'compact');
const duration = computed(() => props.duration ?? (presentation() === 'notification' ? 0 : 4000));
let timer: ReturnType<typeof setTimeout> | undefined;

function pause() {
  clearTimeout(timer);
  timer = undefined;
}

function resume() {
  pause();
  if (props.open && duration.value > 0) {
    timer = setTimeout(() => emit('update:open', false), duration.value);
  }
}

watch(
  () => [props.open, duration.value],
  () => resume(),
);
watchPostEffect((onCleanup) => {
  if (!materialSource.value || !host.value) return;
  const disconnect = bridgePortalMaterialScope(materialSource.value, host.value);
  if (disconnect) onCleanup(disconnect);
});
onMounted(() => {
  mounted.value = true;
  resume();
});
onBeforeUnmount(pause);
</script>

<template>
  <span v-if="mounted" ref="materialSource" hidden />
  <Teleport v-if="mounted" to="body">
    <div ref="host" class="ui-toast-container">
      <div
        v-bind="$attrs"
        class="ui-toast"
        :class="`ui-toast--${variant}`"
        :data-presentation="presentation()"
        :role="variant === 'danger' ? 'alert' : 'status'"
        @pointerenter="pause"
        @pointerleave="resume"
        @focusin="pause"
        @focusout="resume"
      >
        <UiPresence
          :show="open"
          variant="rise"
          class="ui-toast__surface"
          :class="getSurfaceClass('auto', 'overlay')"
          data-surface="auto"
          data-neoverse-glass-occluder="topmost"
          data-neoverse-surface-overflow="visible"
          data-neoverse-surface-hover="static"
        >
          <span class="ui-toast__indicator" aria-hidden="true" />
          <div class="ui-toast__message"><slot>{{ message }}</slot></div>
          <div v-if="$slots.action" class="ui-toast__action"><slot name="action" /></div>
        </UiPresence>
        <UiPresence
          as="button"
          :show="open"
          variant="rise"
          class="ui-toast__dismiss"
          :class="getSurfaceClass('auto', 'overlay')"
          type="button"
          data-surface="auto"
          data-neoverse-glass-occluder="topmost"
          data-neoverse-surface-overflow="visible"
          data-neoverse-surface-hover="static"
          :aria-label="dismissLabel"
          @click="emit('update:open', false)"
        >
          <span class="ui-toast__dismiss-wash" aria-hidden="true" />
          <svg
            class="ui-toast__dismiss-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </UiPresence>
      </div>
    </div>
  </Teleport>
</template>
