<script setup lang="ts">
import { UiSurface } from '@neoverse-ui/vue';
import ColorSwatchCell from '../ColorSwatchCell.vue';
import { primitiveColorGroups, semanticColorGroups } from '../lab-data';
import type { LabModuleProps } from '../modules/types';
import { localize, moduleCopy } from '../playground-content';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="color-gallery">
    <section class="color-gallery__section" aria-labelledby="colors-primitive-title">
      <header class="grid gap-1">
        <h2 id="colors-primitive-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.colors.primitive.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.colors.primitive.description, props.locale) }}
        </p>
      </header>

      <div class="color-gallery__scales">
        <article v-for="group in primitiveColorGroups" :key="group.pattern">
          <header class="color-gallery__scale-heading">
            <h3 class="text-label font-label text-primary">
              {{ localize(group.label, props.locale) }}
            </h3>
            <code class="text-code text-muted">{{ group.pattern }}</code>
          </header>
          <ol class="color-gallery__scale" data-color-scale>
            <li
              v-for="token in group.items"
              :key="token.variable"
              class="color-gallery__shade"
              data-color-swatch-cell
              :title="token.variable"
            >
              <span
                class="color-gallery__chip"
                :data-transparent="token.step === 'transparent' || undefined"
                aria-hidden="true"
              >
                <span :style="{ backgroundColor: `var(${token.variable})` }" />
              </span>
              <code class="color-gallery__step text-code text-secondary">{{ token.step }}</code>
            </li>
          </ol>
        </article>
      </div>
    </section>

    <section class="color-gallery__section" aria-labelledby="colors-alias-title">
      <header class="grid gap-1">
        <h2 id="colors-alias-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.colors.aliases.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.colors.aliases.description, props.locale) }}
        </p>
      </header>

      <div class="color-gallery__roles" data-color-roles>
        <UiSurface
          v-for="group in semanticColorGroups"
          :key="group.label.en"
          as="article"
          surface="subtle"
          class="color-gallery__role-group"
        >
          <h3 class="text-label-lg font-label text-primary">
            {{ localize(group.label, props.locale) }}
          </h3>
          <ul class="color-gallery__role-list">
            <ColorSwatchCell
              v-for="token in group.items"
              :key="token.variable"
              :label="token.label"
              :locale="props.locale"
              :variable="token.variable"
              :class-name="token.className"
            />
          </ul>
        </UiSurface>
      </div>
    </section>
  </div>
</template>

<style scoped>
.color-gallery {
  display: grid;
  gap: var(--neoverse-space-8);
  container-type: inline-size;
}

.color-gallery__section,
.color-gallery__scales {
  display: grid;
  gap: var(--neoverse-space-4);
}

.color-gallery__scales > article {
  content-visibility: auto;
  contain-intrinsic-size: auto 110px;
}

.color-gallery__scale-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--neoverse-space-1) var(--neoverse-space-3);
  margin-block-end: var(--neoverse-space-2);
}

.color-gallery__scale,
.color-gallery__role-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.color-gallery__scale {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--neoverse-space-2) var(--neoverse-space-1);
}

.color-gallery__shade {
  display: grid;
  gap: var(--neoverse-space-1);
  text-align: center;
}

.color-gallery__chip {
  display: grid;
  min-block-size: var(--neoverse-space-8);
  overflow: hidden;
  border: var(--neoverse-border-width-thin) solid var(--neoverse-color-border-default);
  border-radius: var(--neoverse-radius-control-inner);
  contain: strict;
}

.color-gallery__chip[data-transparent] {
  background:
    repeating-conic-gradient(
      var(--neoverse-color-surface-subtle) 0% 25%,
      var(--neoverse-color-border-default) 0% 50%
    )
    0 0 / var(--neoverse-space-3) var(--neoverse-space-3);
}

.color-gallery__step {
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.color-gallery__roles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  align-items: start;
  gap: var(--neoverse-space-3);
}

.color-gallery__role-group {
  padding: var(--neoverse-space-3);
  content-visibility: auto;
  contain-intrinsic-size: auto 340px;
}

.color-gallery__role-list {
  margin-block-start: var(--neoverse-space-1);
}

@container (min-width: 17rem) {
  .color-gallery__scale {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@container (min-width: 38rem) {
  .color-gallery__scale {
    grid-template-columns: repeat(11, minmax(0, 1fr));
  }
}

.color-gallery__scale:has([data-transparent]) {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
</style>
