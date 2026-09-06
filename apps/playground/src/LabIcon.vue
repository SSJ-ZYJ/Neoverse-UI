<script setup lang="ts">
type LabIconName =
  | 'activity'
  | 'arrow-right'
  | 'article'
  | 'bookmark'
  | 'check'
  | 'close'
  | 'folder'
  | 'github'
  | 'globe'
  | 'home'
  | 'mail'
  | 'menu'
  | 'message'
  | 'plus'
  | 'spark'
  | 'target';

interface LabIconProps {
  name: LabIconName;
}

const props = defineProps<LabIconProps>();

const paths: Record<LabIconName, string> = {
  activity: 'M4 13h3l2-7 4 12 2-7h5',
  'arrow-right': 'M5 12h14M13 6l6 6-6 6',
  article: 'M6 3h9l3 3v15H6V3Zm3 6h6M9 13h6M9 17h4',
  bookmark: 'M7 4h10v16l-5-3-5 3V4Z',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M18 6 6 18',
  folder: 'M3 6h7l2 2h9v10H3V6Z',
  github:
    'M8 18c-3 1-3-2-4-2m8 4v-3c0-1-.5-2-1-2 4-.5 8-2 8-7a5.5 5.5 0 0 0-1.5-3.8A5 5 0 0 0 18 1s-1.5 0-3 1a13 13 0 0 0-6 0C7.5 1 6 1 6 1a5 5 0 0 0-.5 4.2A5.5 5.5 0 0 0 4 9c0 5 4 6.5 8 7-.5.5-1 1-1 2v3',
  globe:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21c-2.2-2.5-3.3-5.5-3.3-9S9.8 5.5 12 3ZM3 12h18',
  home: 'm4 10 8-7 8 7v10h-5v-6H9v6H4V10Z',
  mail: 'M3 6h18v12H3V6Zm1 1 8 6 8-6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  message: 'M4 5h16v11H8l-4 4V5Z',
  plus: 'M12 5v14M5 12h14',
  spark: 'm12 3 1.6 6.4L20 11l-6.4 1.6L12 19l-1.6-6.4L4 11l6.4-1.6L12 3Z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-4h.01',
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
