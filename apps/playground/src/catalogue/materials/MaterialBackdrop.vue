<script setup lang="ts">
import { frameLocale } from '../../app/frame-state';
import MaterialLegend from './MaterialLegend.vue';

interface MaterialBackdropProps {
  edge?: 'framed' | 'inset';
}

const props = withDefaults(defineProps<MaterialBackdropProps>(), {
  edge: 'framed',
});
</script>

<template>
  <div
    class="playground-material-backdrop min-w-0 overflow-visible"
    :class="
      props.edge === 'inset'
        ? 'playground-material-backdrop--inset'
        : 'playground-material-backdrop--framed'
    "
  >
    <slot />
    <MaterialLegend :locale="frameLocale" />
  </div>
</template>
