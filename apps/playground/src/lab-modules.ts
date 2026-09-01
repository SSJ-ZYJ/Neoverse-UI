import type { Component } from 'vue';
import BadgeModule from './modules/BadgeModule.vue';
import BorderModule from './modules/BorderModule.vue';
import ButtonModule from './modules/ButtonModule.vue';
import CardModule from './modules/CardModule.vue';
import ColorsModule from './modules/ColorsModule.vue';
import GlassModule from './modules/GlassModule.vue';
import IconButtonModule from './modules/IconButtonModule.vue';
import MotionModule from './modules/MotionModule.vue';
import RadiusModule from './modules/RadiusModule.vue';
import SegmentedControlModule from './modules/SegmentedControlModule.vue';
import ShadowModule from './modules/ShadowModule.vue';
import SkeletonModule from './modules/SkeletonModule.vue';
import ScrollbarModule from './modules/ScrollbarModule.vue';
import SpacingModule from './modules/SpacingModule.vue';
import SurfaceModule from './modules/SurfaceModule.vue';
import TypographyModule from './modules/TypographyModule.vue';
import { groupCopy, moduleCopy } from './playground-content';

export const labModules = [
  {
    id: 'colors',
    groupId: 'foundations',
    label: moduleCopy.colors.label,
    description: moduleCopy.colors.description,
    component: ColorsModule,
  },
  {
    id: 'typography',
    groupId: 'foundations',
    label: moduleCopy.typography.label,
    description: moduleCopy.typography.description,
    component: TypographyModule,
  },
  {
    id: 'spacing',
    groupId: 'foundations',
    label: moduleCopy.spacing.label,
    description: moduleCopy.spacing.description,
    component: SpacingModule,
  },
  {
    id: 'radius',
    groupId: 'foundations',
    label: moduleCopy.radius.label,
    description: moduleCopy.radius.description,
    component: RadiusModule,
  },
  {
    id: 'border',
    groupId: 'foundations',
    label: moduleCopy.border.label,
    description: moduleCopy.border.description,
    component: BorderModule,
  },
  {
    id: 'shadow',
    groupId: 'foundations',
    label: moduleCopy.shadow.label,
    description: moduleCopy.shadow.description,
    component: ShadowModule,
  },
  {
    id: 'surface',
    groupId: 'surfaces',
    label: moduleCopy.surface.label,
    description: moduleCopy.surface.description,
    component: SurfaceModule,
  },
  {
    id: 'glass',
    groupId: 'surfaces',
    label: moduleCopy.glass.label,
    description: moduleCopy.glass.description,
    component: GlassModule,
  },
  {
    id: 'motion',
    groupId: 'motion',
    label: moduleCopy.motion.label,
    description: moduleCopy.motion.description,
    component: MotionModule,
  },
  {
    id: 'button',
    groupId: 'components',
    label: moduleCopy.button.label,
    description: moduleCopy.button.description,
    component: ButtonModule,
  },
  {
    id: 'icon-button',
    groupId: 'components',
    label: moduleCopy.iconButton.label,
    description: moduleCopy.iconButton.description,
    component: IconButtonModule,
  },
  {
    id: 'badge',
    groupId: 'components',
    label: moduleCopy.badge.label,
    description: moduleCopy.badge.description,
    component: BadgeModule,
  },
  {
    id: 'card',
    groupId: 'components',
    label: moduleCopy.card.label,
    description: moduleCopy.card.description,
    component: CardModule,
  },
  {
    id: 'segmented-control',
    groupId: 'components',
    label: moduleCopy.segmentedControl.label,
    description: moduleCopy.segmentedControl.description,
    component: SegmentedControlModule,
  },
  {
    id: 'skeleton',
    groupId: 'components',
    label: moduleCopy.skeleton.label,
    description: moduleCopy.skeleton.description,
    component: SkeletonModule,
  },
  {
    id: 'scrollbar',
    groupId: 'components',
    label: moduleCopy.scrollbar.label,
    description: moduleCopy.scrollbar.description,
    component: ScrollbarModule,
  },
] as const satisfies readonly {
  id: string;
  groupId: string;
  label: { en: string; zh: string };
  description: { en: string; zh: string };
  component: Component;
}[];

export type ModuleId = (typeof labModules)[number]['id'];
export type LabModule = (typeof labModules)[number];

export const moduleGroups = [
  {
    id: 'foundations',
    label: groupCopy.foundations.label,
    description: groupCopy.foundations.description,
    moduleIds: ['colors', 'typography', 'spacing', 'radius', 'border', 'shadow'],
  },
  {
    id: 'surfaces',
    label: groupCopy.surfaces.label,
    description: groupCopy.surfaces.description,
    moduleIds: ['surface', 'glass'],
  },
  {
    id: 'motion',
    label: groupCopy.motion.label,
    description: groupCopy.motion.description,
    moduleIds: ['motion'],
  },
  {
    id: 'components',
    label: groupCopy.components.label,
    description: groupCopy.components.description,
    moduleIds: [
      'button',
      'icon-button',
      'badge',
      'card',
      'segmented-control',
      'skeleton',
      'scrollbar',
    ],
  },
] as const satisfies readonly {
  id: string;
  label: { en: string; zh: string };
  description: { en: string; zh: string };
  moduleIds: readonly string[];
}[];

export type ModuleGroupId = (typeof moduleGroups)[number]['id'];
