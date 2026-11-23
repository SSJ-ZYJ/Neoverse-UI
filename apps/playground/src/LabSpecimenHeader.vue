<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string;
    description?: string | undefined;
    titleId?: string;
    headingLevel?: 2 | 3;
    size?: 'section' | 'subsection';
  }>(),
  { headingLevel: 3, size: 'subsection' },
);
</script>

<template>
  <header class="min-w-0">
    <div class="grid min-w-0 gap-1">
      <component
        :is="`h${props.headingLevel}`"
        :id="props.titleId"
        class="font-title text-primary"
        :class="props.size === 'section' ? 'text-title-lg' : 'text-title-md'"
      >
        {{ props.title }}
      </component>
      <p
        v-if="props.description"
        class="max-w-reading-wide text-secondary"
        :class="props.size === 'section' ? 'text-body-md' : 'text-body-sm'"
      >
        {{ props.description }}
      </p>
    </div>
    <div v-if="$slots.action" class="shrink-0">
      <slot name="action" />
    </div>
  </header>
</template>
