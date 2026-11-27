<script setup lang="ts">
import {
  bridgeDialogMaterialScope,
  focusElement,
  installFocusModality,
  openOverlayWithMotion,
  ownsDocumentModalKeyboard,
  trapModalTabKey,
} from '@neoverse-ui/overlay-runtime';
import { getSurfaceClass } from '@neoverse-ui/tokens';
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch, watchPostEffect } from 'vue';
import type { DialogProps, DialogRole, DialogSize } from '../../types';

defineOptions({ inheritAttrs: false });
const dialogSurfaceClass = getSurfaceClass('auto', 'overlay');

const props = withDefaults(
  defineProps<
    DialogProps & {
      size?: DialogSize;
      role?: DialogRole;
    }
  >(),
  {
    open: false,
    size: 'md',
    role: 'dialog',
    closeOnEscape: true,
    closeOnBackdrop: false,
  },
);
const emit = defineEmits<{ 'update:open': [value: boolean] }>();
const element = ref<HTMLDialogElement | null>(null);
const materialSource = ref<HTMLSpanElement | null>(null);
const mounted = ref(false);
const titleId = `${useId()}-dialog-title`;
const descriptionId = `${useId()}-dialog-description`;
let focusReturn: HTMLElement | null = null;
let keydownListening = false;

watchPostEffect((onCleanup) => {
  if (!mounted.value || !materialSource.value || !element.value) return;
  const disconnect = bridgeDialogMaterialScope(materialSource.value, element.value);
  if (disconnect) onCleanup(disconnect);
});

function restoreFocus() {
  const target = focusReturn;
  focusReturn = null;
  if (target?.isConnected) focusElement(target, { preventScroll: true });
}

function requestClose() {
  emit('update:open', false);
}

function onDocumentKeydown(event: KeyboardEvent) {
  const dialog = element.value;
  if (!dialog?.open || !props.open || event.defaultPrevented) return;
  if (!ownsDocumentModalKeyboard(dialog)) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    if (props.closeOnEscape) requestClose();
    return;
  }

  if (event.key === 'Tab') {
    trapModalTabKey(event, dialog);
  }
}

function setDocumentListeners(active: boolean) {
  if (typeof document === 'undefined') return;
  if (active && !keydownListening) {
    document.addEventListener('keydown', onDocumentKeydown);
    keydownListening = true;
  } else if (!active && keydownListening) {
    document.removeEventListener('keydown', onDocumentKeydown);
    keydownListening = false;
  }
}

function showDialogNode(dialog: HTMLDialogElement) {
  if (typeof dialog.show === 'function') dialog.show();
  else dialog.setAttribute('open', '');
}

function closeDialogNode(dialog: HTMLDialogElement) {
  if (typeof dialog.close === 'function') dialog.close();
  else if (dialog.hasAttribute('open')) {
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('close'));
  }
}

async function syncOpen() {
  await nextTick();
  const dialog = element.value;
  if (!dialog) return;
  installFocusModality(dialog.ownerDocument);
  if (props.open && !dialog.open) {
    focusReturn = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    openOverlayWithMotion(
      dialog,
      props.motionSource === undefined ? focusReturn : props.motionSource,
      () => showDialogNode(dialog),
    );
    setDocumentListeners(true);
    focusElement(dialog, { preventScroll: true });
  } else if (!props.open && dialog.open) {
    setDocumentListeners(false);
    closeDialogNode(dialog);
  } else {
    setDocumentListeners(props.open && dialog.open);
  }
}

function onCancel(event: Event) {
  event.preventDefault();
  if (props.closeOnEscape) requestClose();
}

function onBackdropClick() {
  if (props.closeOnBackdrop) requestClose();
}

function onNativeClose() {
  if (element.value?.open) return;
  setDocumentListeners(false);
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
  if (typeof document !== 'undefined') installFocusModality(document);
  void syncOpen();
});
onBeforeUnmount(() => {
  setDocumentListeners(false);
  if (element.value?.open) closeDialogNode(element.value);
  restoreFocus();
});
</script>

<template>
  <span v-if="mounted" ref="materialSource" hidden />
  <Teleport v-if="mounted" to="body">
    <div class="ui-overlay-portal">
      <div
        class="ui-dialog__backdrop"
        :data-open="props.open ? 'true' : undefined"
        aria-hidden="true"
        @click="onBackdropClick"
      />
      <dialog
        v-bind="$attrs"
        ref="element"
        tabindex="-1"
        class="ui-overlay-panel ui-dialog nv-presence"
        :class="dialogSurfaceClass"
        :role="props.role"
        :data-size="props.size"
        data-neoverse-motion="pop"
        data-surface="auto"
        data-neoverse-glass-occluder="topmost"
        data-neoverse-glass-edge-pass="css"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="description ? descriptionId : undefined"
        @cancel="onCancel"
        @close="onNativeClose"
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
    </div>
  </Teleport>
</template>
