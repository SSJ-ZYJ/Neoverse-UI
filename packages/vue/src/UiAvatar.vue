<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AvatarProps } from './types';

const props = withDefaults(defineProps<AvatarProps>(), { size: 'md', shape: 'rounded' });
const failedSource = ref<string | undefined>();
const hasImage = computed(() => Boolean(props.src) && props.src !== failedSource.value);
const initials = computed(() => {
  if (props.fallback) return props.fallback;
  const words = props.name.trim().split(/\s+/u).filter(Boolean);
  if (words.length > 1)
    return words
      .slice(0, 2)
      .map((word) => [...word][0])
      .join('')
      .toLocaleUpperCase();
  return [...(words[0] ?? '?')].slice(0, 2).join('').toLocaleUpperCase();
});
</script>

<template>
  <span
    class="ui-avatar material-glass-subtle"
    :class="[`ui-avatar--${size}`, `ui-avatar--${shape}`]"
    role="img"
    :aria-label="name"
    data-surface="glass-subtle"
  >
    <img
      v-if="hasImage"
      class="ui-avatar__image"
      :src="src"
      alt=""
      loading="lazy"
      decoding="async"
      @error="failedSource = src"
    >
    <span v-else class="ui-avatar__fallback" aria-hidden="true">{{ initials }}</span>
  </span>
</template>
