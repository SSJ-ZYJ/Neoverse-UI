<script setup lang="ts">
import { createDrawerController, type DrawerController } from '@neoverse-ui/overlay-runtime';
import { onBeforeUnmount, onMounted, onUpdated, ref, useTemplateRef } from 'vue';
import type { DrawerProps } from '../../types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<DrawerProps>(), {
  open: false,
  modal: true,
  side: 'left',
  closeOnOutside: true,
});
const emit = defineEmits<{ 'update:open': [value: boolean] }>();
const element = useTemplateRef<HTMLDialogElement>('element');
// Retarget the same panel and slot subtree when the inline layout becomes modal.
const host = useTemplateRef<HTMLDivElement>('host');
const backdrop = useTemplateRef<HTMLDivElement>('backdrop');
const mounted = ref(false);
let controller: DrawerController | undefined;

function onOpenChange(open: boolean) {
  emit('update:open', open);
}

function sync() {
  const dialog = element.value;
  const scrim = props.modal ? backdrop.value : null;
  if (!dialog || (props.modal && (!scrim || dialog.parentElement !== host.value))) return;
  controller ??= createDrawerController(dialog);
  controller.sync({
    open: props.open,
    backdrop: scrim,
    closeOnOutside: props.closeOnOutside,
    onOpenChange,
  });
}

onMounted(() => {
  mounted.value = true;
  sync();
});
onUpdated(sync);
onBeforeUnmount(() => controller?.dispose());
</script>

<template>
  <Teleport v-if="mounted && props.modal" to="body">
    <div
      ref="host"
      class="ui-drawer__host"
      :data-open="props.open ? 'true' : 'false'"
      :data-side="props.side"
      :inert="!props.open"
      :style="props.width === undefined ? undefined : { '--neoverse-drawer-width': props.width }"
    >
      <div ref="backdrop" class="ui-drawer__backdrop" aria-hidden="true" />
    </div>
  </Teleport>
  <Teleport v-if="mounted || !props.modal" :to="host ?? 'body'" :disabled="!props.modal || !host">
    <dialog
      :tabindex="props.modal ? -1 : undefined"
      v-bind="$attrs"
      ref="element"
      class="ui-drawer material-glass-subtle"
      :aria-modal="props.modal || undefined"
      closedby="none"
      :data-side="props.side"
      :data-modal="props.modal ? 'true' : 'false'"
      data-surface="glass-subtle"
      data-neoverse-glass-edge-stroke
      data-neoverse-surface-hover="static"
      :data-neoverse-glass-occluder="props.modal ? 'topmost' : undefined"
      :data-neoverse-glass-edge-pass="props.modal ? 'css' : undefined"
    >
      <slot />
    </dialog>
  </Teleport>
</template>
