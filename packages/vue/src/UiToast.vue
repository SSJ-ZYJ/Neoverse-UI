<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ToastProps } from './types';
import UiPresence from './UiPresence.vue';

const props = withDefaults(defineProps<ToastProps>(), {
  open: false,
  variant: 'neutral',
  duration: 4000,
});
const emit = defineEmits<{ 'update:open': [value: boolean] }>();
const mounted = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

function pause() {
  clearTimeout(timer);
  timer = undefined;
}

function resume() {
  pause();
  if (props.open && props.duration > 0) {
    timer = setTimeout(() => emit('update:open', false), props.duration);
  }
}

watch(
  () => [props.open, props.duration],
  () => resume(),
);
onMounted(() => {
  mounted.value = true;
  resume();
});
onBeforeUnmount(pause);
</script>

<template>
  <Teleport v-if="mounted" to="body">
    <div class="ui-toast-container">
      <UiPresence
        :show="open"
        variant="rise"
        class="ui-toast material-glass-elevated"
        :class="`ui-toast--${variant}`"
        data-surface="glass-elevated"
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
        <slot name="action" />
        <button
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
