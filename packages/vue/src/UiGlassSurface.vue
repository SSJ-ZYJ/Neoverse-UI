<script setup lang="ts">
import { computed } from 'vue';
import type { GlassSurfaceProps, GlassSurfaceVariant } from './types';

const props = withDefaults(defineProps<GlassSurfaceProps>(), {
  variant: 'subtle',
});

const materialClasses: Record<GlassSurfaceVariant, string> = {
  subtle: 'material-glass-subtle',
  elevated: 'material-glass-elevated',
  immersive: 'material-glass-immersive',
};

const classes = computed(() => [
  materialClasses[props.variant as GlassSurfaceVariant] ?? materialClasses.subtle,
  'rounded-card p-4',
]);
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
