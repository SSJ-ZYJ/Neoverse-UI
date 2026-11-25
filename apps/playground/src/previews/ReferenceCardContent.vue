<script setup lang="ts">
import { UiBadge, UiButton } from '@neoverse-ui/vue';
import LabIcon from '../LabIcon.vue';
import { type Locale, localize, moduleCopy } from '../playground-content';

const props = defineProps<{
  locale: Locale;
  presentation: 'focused' | 'gallery' | 'qa';
  titleId?: string;
}>();

const copy = moduleCopy.card;
</script>

<template>
  <div class="grid gap-3">
    <div
      class="flex items-center justify-between"
      :class="props.presentation === 'focused' ? 'flex-wrap gap-2' : 'gap-3'"
    >
      <div v-if="props.presentation === 'gallery'" class="flex items-center gap-2">
        <LabIcon name="spark" />
        <h5 class="text-label font-label text-primary">
          {{ localize(copy.reference, props.locale) }}
        </h5>
      </div>
      <component
        :is="props.presentation === 'qa' ? 'h4' : 'h3'"
        v-else
        :id="props.titleId"
        class="text-label font-label text-primary"
      >
        {{ localize(copy.reference, props.locale) }}
      </component>
      <UiBadge variant="success">{{ localize(copy.ready, props.locale) }}</UiBadge>
    </div>
    <p class="text-secondary" :class="props.presentation === 'qa' ? 'text-caption' : 'text-body'">
      {{ localize(copy.body, props.locale) }}
    </p>
    <UiButton v-if="props.presentation === 'gallery'" variant="ghost" class="justify-self-start">
      {{ localize(copy.continue, props.locale) }}
      <template #trailing><LabIcon name="arrow-right" /></template>
    </UiButton>
  </div>
</template>
