<script setup lang="ts">
import { UiNavigationItem } from '@neoverse-ui/vue';
import { localize, moduleCopy } from '../playground-content';
import ActionModule from './ActionModule.vue';
import ButtonModule from './ButtonModule.vue';
import ControlSurfaceModule from './ControlSurfaceModule.vue';
import DensityModule from './DensityModule.vue';
import IconButtonModule from './IconButtonModule.vue';
import NavigationItemModule from './NavigationItemModule.vue';
import SegmentedControlModule from './SegmentedControlModule.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.controls;
const sections = [
  { id: 'controls-button', label: moduleCopy.button.label },
  { id: 'controls-icon-button', label: moduleCopy.iconButton.label },
  { id: 'controls-action', label: moduleCopy.action.label },
  { id: 'controls-navigation-item', label: moduleCopy.navigationItem.label },
  { id: 'controls-segmented-control', label: moduleCopy.segmentedControl.label },
  { id: 'controls-surface', label: moduleCopy.controlSurface.label },
  { id: 'controls-density', label: moduleCopy.density.label },
] as const;
</script>

<template>
  <div class="grid gap-grid">
    <nav
      class="flex flex-wrap gap-1 rounded-control border border-subtle bg-surface-subtle p-1"
      :aria-label="localize(copy.label, props.locale)"
    >
      <UiNavigationItem
        v-for="section in sections"
        :key="section.id"
        :href="`#${section.id}`"
        :label="localize(section.label, props.locale)"
        size="lg"
        class="h-auto min-h-0 rounded-control px-3 py-1.5 text-caption font-regular text-secondary hover:bg-accent-soft hover:text-primary"
      />
    </nav>

    <section
      id="controls-button"
      class="scroll-mt-24 grid gap-2"
      :aria-labelledby="`${copy.id}-button-title`"
    >
      <header class="grid gap-1">
        <h3 :id="`${copy.id}-button-title`" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.button.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.button.description, props.locale) }}
        </p>
      </header>
      <ButtonModule :locale="props.locale" />
    </section>

    <section
      id="controls-icon-button"
      class="scroll-mt-24 grid gap-2"
      :aria-labelledby="`${copy.id}-icon-title`"
    >
      <header class="grid gap-1">
        <h3 :id="`${copy.id}-icon-title`" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.iconButton.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.iconButton.description, props.locale) }}
        </p>
      </header>
      <IconButtonModule :locale="props.locale" />
    </section>

    <section
      id="controls-action"
      class="scroll-mt-24 grid gap-2"
      :aria-labelledby="`${copy.id}-action-title`"
    >
      <header class="grid gap-1">
        <h3 :id="`${copy.id}-action-title`" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.action.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.action.description, props.locale) }}
        </p>
      </header>
      <ActionModule :locale="props.locale" />
    </section>

    <section
      id="controls-navigation-item"
      class="scroll-mt-24 grid gap-2"
      :aria-labelledby="`${copy.id}-navigation-title`"
    >
      <header class="grid gap-1">
        <h3 :id="`${copy.id}-navigation-title`" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.navigationItem.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.navigationItem.description, props.locale) }}
        </p>
      </header>
      <NavigationItemModule :locale="props.locale" />
    </section>

    <section
      id="controls-segmented-control"
      class="scroll-mt-24 grid gap-2"
      :aria-labelledby="`${copy.id}-segmented-title`"
    >
      <header class="grid gap-1">
        <h3 :id="`${copy.id}-segmented-title`" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.segmentedControl.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.segmentedControl.description, props.locale) }}
        </p>
      </header>
      <SegmentedControlModule :locale="props.locale" />
    </section>

    <section
      id="controls-surface"
      class="scroll-mt-24 grid gap-2"
      :aria-labelledby="`${copy.id}-surface-title`"
    >
      <header class="grid gap-1">
        <h3 :id="`${copy.id}-surface-title`" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.controlSurface.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.controlSurface.description, props.locale) }}
        </p>
      </header>
      <ControlSurfaceModule :locale="props.locale" />
    </section>

    <section
      id="controls-density"
      class="scroll-mt-24 grid gap-2"
      :aria-labelledby="`${copy.id}-density-title`"
    >
      <header class="grid gap-1">
        <h3 :id="`${copy.id}-density-title`" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.density.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.density.description, props.locale) }}
        </p>
      </header>
      <DensityModule :locale="props.locale" />
    </section>
  </div>
</template>
