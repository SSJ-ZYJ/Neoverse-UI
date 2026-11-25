<script setup lang="ts">
import { animateDisclosure, type DisclosureAnimation } from '@neoverse-ui/motion';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{ expanded: boolean }>();
defineOptions({ inheritAttrs: false });

const element = ref<HTMLElement | null>(null);
let animation: DisclosureAnimation | undefined;

function apply(expanded: boolean, animate: boolean): void {
  if (element.value === null) return;
  animation?.cancel();
  animation = animateDisclosure(element.value, expanded, { animate });
}

watch(
  () => props.expanded,
  (expanded) => apply(expanded, true),
  { flush: 'post' },
);
onMounted(() => apply(props.expanded, false));
onBeforeUnmount(() => animation?.cancel());
</script>

<template>
  <ul ref="element" v-bind="$attrs">
    <slot />
  </ul>
</template>
