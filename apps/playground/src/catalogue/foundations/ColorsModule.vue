<script setup lang="ts">
import type { LabModuleProps } from '../../features/catalogue/types';
import ColorPalettesExample from './ColorPalettesExample.vue';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <ColorPalettesExample id="foundation-colors" class="scroll-mt-24" :locale="props.locale" />
</template>
