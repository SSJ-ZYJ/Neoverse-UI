<script setup lang="ts">
import { animateDisclosure, type DisclosureAnimation } from '@neoverse-ui/motion';
import { UiButton, UiNavigationItem, UiSurface } from '@neoverse-ui/vue';
import { onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import type { LabModuleProps } from '../modules/types';
import { localize, moduleCopy } from '../playground-content';

const props = withDefaults(
  defineProps<
    LabModuleProps & {
      expanded?: boolean;
      animate?: boolean;
    }
  >(),
  {
    expanded: true,
    animate: true,
  },
);
const copy = moduleCopy.motion.disclosure;
const items = [
  { id: 'overview', label: copy.items.overview },
  { id: 'tokens', label: copy.items.tokens },
  { id: 'reduced', label: copy.items.reduced },
] as const;
// biome-ignore lint/correctness/useHookAtTopLevel: Vue's useId belongs at <script setup> top level; the playground's React dependency makes Biome apply React hook rules here.
const listId = `${useId()}-disclosure-list`;
const list = ref<HTMLElement | null>(null);
const expanded = ref(props.expanded);
let animation: DisclosureAnimation | undefined;

watch(
  () => props.expanded,
  (value) => {
    expanded.value = value;
  },
);

function apply(value: boolean, animate: boolean): void {
  if (list.value === null) return;
  animation?.cancel();
  animation = animateDisclosure(list.value, value, { animate });
}

watch(
  () => expanded.value,
  (value) => apply(value, props.animate),
  { flush: 'post' },
);
onMounted(() => apply(expanded.value, false));
onBeforeUnmount(() => animation?.cancel());
</script>

<template>
  <UiSurface surface="none" class="playground-specimen-panel grid w-full max-w-reading-wide gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <UiButton
        data-motion-disclosure-toggle
        size="sm"
        variant="secondary"
        :aria-expanded="expanded"
        :aria-controls="listId"
        @click="expanded = !expanded"
      >
        {{ localize(expanded ? copy.collapse : copy.expand, props.locale) }}
      </UiButton>
      <code class="text-code text-secondary">animateDisclosure(list, expanded)</code>
    </div>

    <ul
      :id="listId"
      ref="list"
      data-motion-disclosure-list
      class="playground-explorer__specimens grid gap-1"
    >
      <li v-for="(item, index) in items" :key="item.id">
        <UiNavigationItem
          as="span"
          size="sm"
          stretch
          indicator-placement="start"
          class="playground-explorer__link playground-explorer__leaf"
          :label="localize(item.label, props.locale)"
          :active="index === 0"
        />
      </li>
    </ul>

    <p class="text-caption text-secondary">{{ localize(copy.hint, props.locale) }}</p>
  </UiSurface>
</template>
