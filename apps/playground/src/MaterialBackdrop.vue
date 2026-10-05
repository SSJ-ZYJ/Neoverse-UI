<script setup lang="ts">
interface MaterialBackdropProps {
  edge?: 'framed' | 'inset';
}

const props = withDefaults(defineProps<MaterialBackdropProps>(), {
  edge: 'framed',
});
</script>

<template>
  <div
    class="playground-material-backdrop overflow-visible rounded-card p-4 md:p-5"
    :class="
      props.edge === 'inset'
        ? 'playground-material-backdrop--inset'
        : 'playground-material-backdrop--framed'
    "
  >
    <slot />
  </div>
</template>
