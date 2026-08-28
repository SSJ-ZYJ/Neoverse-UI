<script setup lang="ts">
interface LabSectionProps {
  id: string;
  title: string;
  description: string;
  showHeader?: boolean;
}

const props = withDefaults(defineProps<LabSectionProps>(), {
  showHeader: true,
});
</script>
<template>
  <section
    :id="props.id"
    :class="['scroll-mt-4', props.showHeader ? '' : 'pt-1']"
    :aria-labelledby="props.showHeader ? `${props.id}-title` : undefined"
    :aria-label="props.showHeader ? undefined : props.title"
  >
    <header
      v-if="props.showHeader"
      class="mb-4 flex flex-wrap items-baseline justify-between gap-2"
    >
      <h2 :id="`${props.id}-title`" class="text-subtitle font-heading tracking-heading">
        {{ props.title }}
      </h2>
      <p class="max-w-container-md text-caption text-secondary">
        {{ props.description }}
      </p>
    </header>
    <div class="grid gap-grid">
      <slot />
    </div>
  </section>
</template>
