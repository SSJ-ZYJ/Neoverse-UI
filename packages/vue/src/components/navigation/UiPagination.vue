<script setup lang="ts">
import { attachLayoutReflow, attachSelectionIndicator } from '@neoverse-ui/motion';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { PaginationProps } from '../../types';

const props = defineProps<PaginationProps>();
const emit = defineEmits<{ 'update:page': [value: number] }>();
const navigation = ref<HTMLElement | null>(null);
const track = ref<HTMLElement | null>(null);
const indicator = ref<HTMLElement | null>(null);
let disposeIndicator: (() => void) | undefined;
let disposeLayout: (() => void) | undefined;
onMounted(() => {
  if (track.value && indicator.value) {
    disposeIndicator = attachSelectionIndicator(
      track.value,
      indicator.value,
      '[aria-current="page"]',
    );
  }
  if (navigation.value && track.value) {
    disposeLayout = attachLayoutReflow(
      navigation.value,
      track.value,
      'button, .ui-pagination__ellipsis',
    );
  }
});
onBeforeUnmount(() => {
  disposeIndicator?.();
  disposeLayout?.();
});
const count = computed(() =>
  Number.isFinite(props.totalPages) ? Math.max(0, Math.floor(props.totalPages)) : 0,
);
const current = computed(() =>
  count.value === 0 ? 0 : Math.min(Math.max(1, Math.floor(props.page)), count.value),
);
const pages = computed((): Array<number | 'leading-gap' | 'trailing-gap'> => {
  if (count.value === 0) return [];
  const picked = new Set([1, count.value]);
  const start =
    current.value <= 5 ? 1 : current.value >= count.value - 4 ? count.value - 4 : current.value - 2;
  const end =
    current.value <= 5 ? 5 : current.value >= count.value - 4 ? count.value : current.value + 2;
  for (let index = Math.max(1, start); index <= Math.min(count.value, end); index += 1) {
    picked.add(index);
  }
  const sorted = [...picked].sort((a, b) => a - b);
  const result: Array<number | 'leading-gap' | 'trailing-gap'> = [];
  for (const number of sorted) {
    const previous = result[result.length - 1];
    if (typeof previous === 'number' && number - previous === 2) result.push(previous + 1);
    else if (typeof previous === 'number' && number - previous > 2) {
      result.push(previous === 1 ? 'leading-gap' : 'trailing-gap');
    }
    result.push(number);
  }
  return result;
});
function change(page: number): void {
  if (count.value === 0 || page < 1 || page > count.value || page === current.value) return;
  emit('update:page', page);
}
</script>

<template>
  <nav ref="navigation" class="ui-pagination" :aria-label="ariaLabel">
    <button
      type="button"
      class="ui-pagination__button"
      :aria-label="previousLabel"
      :disabled="current <= 1"
      @click="change(current - 1)"
    >
      <span aria-hidden="true">‹</span>
    </button>
    <div ref="track" class="ui-pagination__pages">
      <span
        ref="indicator"
        class="ui-pagination__indicator"
        aria-hidden="true"
        data-ready="false"
      />
      <template v-for="entry in pages" :key="entry">
        <span
          v-if="typeof entry === 'string'"
          class="ui-pagination__ellipsis nv-appear"
          data-neoverse-motion="fade"
          aria-hidden="true"
          >…</span
        >
        <button
          v-else
          type="button"
          class="ui-pagination__button nv-appear"
          data-neoverse-motion="fade"
          :class="{ 'ui-pagination__button--current': current === entry }"
          :aria-label="`${pageLabel} ${entry}`"
          :aria-current="current === entry ? 'page' : undefined"
          @click="change(entry)"
        >
          {{ entry }}
        </button>
      </template>
    </div>
    <button
      type="button"
      class="ui-pagination__button"
      :aria-label="nextLabel"
      :disabled="current === 0 || current >= count"
      @click="change(current + 1)"
    >
      <span aria-hidden="true">›</span>
    </button>
  </nav>
</template>
