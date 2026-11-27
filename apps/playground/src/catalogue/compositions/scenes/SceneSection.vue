<script setup lang="ts">
import { type Locale, localize, moduleCopy } from '../../../content/playground-content';

const props = defineProps<{
  id: string;
  scene: keyof typeof moduleCopy.composition.scenes;
  locale: Locale;
  wide?: boolean;
}>();
const scenes = moduleCopy.composition.scenes;
</script>

<template>
  <section
    :id="props.id"
    class="grid gap-2"
    :class="{ 'md:col-span-2': props.wide }"
    :aria-labelledby="`${props.id}-title`"
  >
    <header class="grid gap-1">
      <h3 :id="`${props.id}-title`" class="text-subtitle font-heading tracking-heading">
        {{ localize(scenes[props.scene].label, props.locale) }}
      </h3>
      <p class="text-caption text-secondary">
        {{ localize(scenes[props.scene].description, props.locale) }}
      </p>
    </header>
    <slot />
  </section>
</template>
