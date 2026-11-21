<script setup lang="ts">
import ColorPalettesExample from '../previews/ColorPalettesExample.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <ColorPalettesExample id="foundation-colors" class="scroll-mt-24" :locale="props.locale" />
</template>
