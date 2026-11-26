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
      <UiPresence
        v-bind="$attrs"
        :show="open"
        variant="rise"
        class="ui-toast"
        :class="[getSurfaceClass('auto', 'overlay'), `ui-toast--${variant}`]"
        data-surface="auto"
        :data-presentation="presentation()"
        data-neoverse-glass-occluder="topmost"
        data-neoverse-surface-overflow="visible"
        data-neoverse-surface-hover="static"
        :role="variant === 'danger' ? 'alert' : 'status'"
        @pointerenter="pause"
        @pointerleave="resume"
        @focusin="pause"
        @focusout="resume"
      >
        <span class="ui-toast__indicator" aria-hidden="true" />
        <div class="ui-toast__message"><slot>{{ message }}</slot></div>
        <div v-if="$slots.action" class="ui-toast__action"><slot name="action" /></div>
        <button
          v-if="presentation() === 'notification' || duration <= 0"
          class="ui-toast__dismiss"
          type="button"
          :aria-label="dismissLabel"
          @click="emit('update:open', false)"
        >
          <span aria-hidden="true">×</span>
        </button>
      </UiPresence>
    </div>
  </Teleport>
</template>
