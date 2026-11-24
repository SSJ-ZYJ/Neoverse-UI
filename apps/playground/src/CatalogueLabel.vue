<script setup lang="ts">
import { computed } from 'vue';
import { catalogueSecondary, type Locale, type LocalizedText } from './playground-content';

const props = defineProps<{
  label: LocalizedText;
  locale: Locale;
}>();

const secondary = computed(() => catalogueSecondary(props.label, props.locale));
</script>

<template>
  <span>
    {{ props.label[props.locale] }}
    <span
      v-if="secondary"
      class="playground-catalogue-label__secondary"
      lang="en"
      aria-hidden="true"
    >
      {{ secondary }}
    </span>
  </span>
</template>
