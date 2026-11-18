<script setup lang="ts">
import { injectSpecimenSelection } from './lab-specimen-scope';
import { frameLocale } from './frame-state';
import MaterialLegend from './MaterialLegend.vue';

interface MaterialBackdropProps {
  edge?: 'framed' | 'inset';
}

const props = withDefaults(defineProps<MaterialBackdropProps>(), {
  edge: 'framed',
});
const { isFocused } = injectSpecimenSelection();
</script>

<template>
  <div v-if="isFocused" class="playground-material-backdrop--focused">
    <slot />
  </div>
  <div
    v-else
    class="playground-material-backdrop min-w-0 overflow-visible rounded-card p-4 md:p-5"
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
