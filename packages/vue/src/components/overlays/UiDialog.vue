<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import type { DialogProps } from '../../types';

const props = withDefaults(defineProps<DialogProps>(), {
  open: false,
  closeOnEscape: true,
  closeOnBackdrop: false,
});
const emit = defineEmits<{ 'update:open': [value: boolean] }>();
const element = ref<HTMLDialogElement | null>(null);
const mounted = ref(false);
const titleId = `${useId()}-dialog-title`;
const descriptionId = `${useId()}-dialog-description`;
let focusReturn: HTMLElement | null = null;

function restoreFocus() {
  const target = focusReturn;
  focusReturn = null;
  if (target?.isConnected) target.focus({ preventScroll: true });
}

async function syncOpen() {
  await nextTick();
  const dialog = element.value;
  if (!dialog) return;
  if (props.open && !dialog.open) {
    focusReturn = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
  } else if (!props.open && dialog.open) {
    dialog.close();
  }
}

function requestClose() {
  emit('update:open', false);
}

function onCancel(event: Event) {
  event.preventDefault();
  if (props.closeOnEscape) requestClose();
}

function onBackdropClick(event: MouseEvent) {
  if (props.closeOnBackdrop && event.target === element.value) requestClose();
}

function onDialogKeydown(event: KeyboardEvent) {
  // Escape remains a native cancel action unless the consumer explicitly locks it.
  if (event.key === 'Escape' && !props.closeOnEscape) event.preventDefault();
}

function onNativeClose() {
  if (props.open) requestClose();
  restoreFocus();
}

watch(
  () => props.open,
  () => void syncOpen(),
  { flush: 'post' },
);
onMounted(() => {
  mounted.value = true;
  void syncOpen();
});
onBeforeUnmount(() => {
  if (element.value?.open) element.value.close();
  restoreFocus();
});
</script>

<template>
  <Teleport v-if="mounted" to="body">
    <dialog
      ref="element"
      class="ui-dialog material-glass-elevated"
      data-neoverse-motion="pop"
      data-surface="glass-elevated"
      data-neoverse-glass-occluder="topmost"
      :aria-labelledby="titleId"
      :aria-describedby="description ? descriptionId : undefined"
      @cancel="onCancel"
      @close="onNativeClose"
      @click="onBackdropClick"
      @keydown="onDialogKeydown"
    >
      <header class="ui-dialog__header">
        <h2 :id="titleId" class="ui-dialog__title">{{ title }}</h2>
        <p v-if="description" :id="descriptionId" class="ui-dialog__description">
          {{ description }}
        </p>
      </header>
      <div class="ui-dialog__body"><slot /></div>
      <footer v-if="$slots.footer" class="ui-dialog__footer"><slot name="footer" /></footer>
    </dialog>
  </Teleport>
</template>
