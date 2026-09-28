<script setup lang="ts">
import { UiNavigationItem } from '@neoverse-ui/vue';
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { localize, localized, moduleCopy } from '../playground-content';
import ActionModule from './ActionModule.vue';
import BreadcrumbModule from './BreadcrumbModule.vue';
import ButtonModule from './ButtonModule.vue';
import ControlSurfaceModule from './ControlSurfaceModule.vue';
import DensityModule from './DensityModule.vue';
import IconButtonModule from './IconButtonModule.vue';
import NavigationItemModule from './NavigationItemModule.vue';
import SegmentedControlModule from './SegmentedControlModule.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.controls;
const breadcrumbCopy = {
  label: localized('Breadcrumb', '面包屑导航'),
  description: localized(
    'Shared route hierarchy with current-page semantics and local overflow handling.',
    '路径层级、当前页语义与局部溢出的共享导航组件。',
  ),
} as const;
const sections = [
  { id: 'controls-button', label: moduleCopy.button.label },
  { id: 'controls-icon-button', label: moduleCopy.iconButton.label },
  { id: 'controls-action', label: moduleCopy.action.label },
  { id: 'controls-breadcrumb', label: breadcrumbCopy.label },
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
        class="h-auto min-h-0 rounded-control px-3 py-1.5 text-body-sm font-regular text-secondary hover:bg-accent-soft hover:text-primary"
      />
    </nav>

    <LabSpecimenSection
      id="controls-button"
      :title="localize(moduleCopy.button.label, props.locale)"
      :description="localize(moduleCopy.button.description, props.locale)"
    >
      <ButtonModule :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="controls-icon-button"
      :title="localize(moduleCopy.iconButton.label, props.locale)"
      :description="localize(moduleCopy.iconButton.description, props.locale)"
    >
      <IconButtonModule :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="controls-action"
      :title="localize(moduleCopy.action.label, props.locale)"
      :description="localize(moduleCopy.action.description, props.locale)"
    >
      <ActionModule :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="controls-breadcrumb"
      :title="localize(breadcrumbCopy.label, props.locale)"
      :description="localize(breadcrumbCopy.description, props.locale)"
    >
      <BreadcrumbModule :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="controls-navigation-item"
      :title="localize(moduleCopy.navigationItem.label, props.locale)"
      :description="localize(moduleCopy.navigationItem.description, props.locale)"
    >
      <NavigationItemModule :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="controls-segmented-control"
      :title="localize(moduleCopy.segmentedControl.label, props.locale)"
      :description="localize(moduleCopy.segmentedControl.description, props.locale)"
    >
      <SegmentedControlModule :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="controls-surface"
      :title="localize(moduleCopy.controlSurface.label, props.locale)"
      :description="localize(moduleCopy.controlSurface.description, props.locale)"
    >
      <ControlSurfaceModule :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="controls-density"
      :title="localize(moduleCopy.density.label, props.locale)"
      :description="localize(moduleCopy.density.description, props.locale)"
    >
      <DensityModule :locale="props.locale" />
    </LabSpecimenSection>
  </div>
</template>
