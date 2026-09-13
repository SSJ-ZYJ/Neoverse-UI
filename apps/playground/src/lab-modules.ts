import type { Component } from 'vue';
import CardModule from './modules/CardModule.vue';
import ColorsModule from './modules/ColorsModule.vue';
import CompositionModule from './modules/CompositionModule.vue';
import ConsumerParityModule from './modules/ConsumerParityModule.vue';
import ControlsModule from './modules/ControlsModule.vue';
import LayoutShapeModule from './modules/LayoutShapeModule.vue';
import MaterialsModule from './modules/MaterialsModule.vue';
import MotionModule from './modules/MotionModule.vue';
import ScrollbarModule from './modules/ScrollbarModule.vue';
import ShadowModule from './modules/ShadowModule.vue';
import StatusFeedbackModule from './modules/StatusFeedbackModule.vue';
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
    id: 'layout-shape',
    groupId: 'foundations',
    label: moduleCopy.layoutShape.label,
    description: moduleCopy.layoutShape.description,
    component: LayoutShapeModule,
  },
  {
    id: 'motion',
    groupId: 'foundations',
    label: moduleCopy.motion.label,
    description: moduleCopy.motion.description,
    component: MotionModule,
  },
  {
    id: 'materials',
    groupId: 'materials',
    label: moduleCopy.materials.label,
    description: moduleCopy.materials.description,
    component: MaterialsModule,
  },
  {
    id: 'shadow',
    groupId: 'materials',
    label: moduleCopy.shadow.label,
    description: moduleCopy.shadow.description,
    component: ShadowModule,
  },
  {
    id: 'controls',
    groupId: 'components',
    label: moduleCopy.controls.label,
    description: moduleCopy.controls.description,
    component: ControlsModule,
  },
  {
    id: 'status-feedback',
    groupId: 'components',
    label: moduleCopy.statusFeedback.label,
    description: moduleCopy.statusFeedback.description,
    component: StatusFeedbackModule,
  },
  {
    id: 'card',
    groupId: 'components',
    label: moduleCopy.card.label,
    description: moduleCopy.card.description,
    component: CardModule,
  },
  {
    id: 'scrollbar',
    groupId: 'components',
    label: moduleCopy.scrollbar.label,
    description: moduleCopy.scrollbar.description,
    component: ScrollbarModule,
  },
  {
    id: 'composition',
    groupId: 'patterns',
    label: moduleCopy.composition.label,
    description: moduleCopy.composition.description,
    component: CompositionModule,
  },
  {
    id: 'consumer-parity',
    groupId: 'validation',
    label: moduleCopy.consumerParity.label,
    description: moduleCopy.consumerParity.description,
    component: ConsumerParityModule,
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
    moduleIds: ['colors', 'typography', 'layout-shape', 'motion'],
  },
  {
    id: 'materials',
    label: groupCopy.materials.label,
    description: groupCopy.materials.description,
    moduleIds: ['materials', 'shadow'],
  },
  {
    id: 'components',
    label: groupCopy.components.label,
    description: groupCopy.components.description,
    moduleIds: ['controls', 'status-feedback', 'card', 'scrollbar'],
  },
  {
    id: 'patterns',
    label: groupCopy.patterns.label,
    description: groupCopy.patterns.description,
    moduleIds: ['composition'],
  },
  {
    id: 'validation',
    label: groupCopy.validation.label,
    description: groupCopy.validation.description,
    moduleIds: ['consumer-parity'],
  },
] as const satisfies readonly {
  id: string;
  label: { en: string; zh: string };
  description: { en: string; zh: string };
  moduleIds: readonly string[];
}[];

export type ModuleGroupId = (typeof moduleGroups)[number]['id'];
