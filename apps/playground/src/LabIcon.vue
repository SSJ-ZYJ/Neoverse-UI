<script setup lang="ts">
type LabIconName = 'arrow-right' | 'check' | 'close' | 'menu' | 'plus' | 'spark';

interface LabIconProps {
  name: LabIconName;
}

const props = defineProps<LabIconProps>();

const paths: Record<LabIconName, string> = {
  'arrow-right': 'M5 12h14M13 6l6 6-6 6',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M18 6 6 18',
  menu: 'M4 7h16M4 12h16M4 17h16',
  plus: 'M12 5v14M5 12h14',
  spark: 'm12 3 1.6 6.4L20 11l-6.4 1.6L12 19l-1.6-6.4L4 11l6.4-1.6L12 3Z',
};
</script>

<template>
  <svg
    aria-hidden="true"
    class="size-4 shrink-0 fill-none stroke-current stroke-2"
    viewBox="0 0 24 24"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path :d="paths[props.name]" />
  </svg>
</template>
