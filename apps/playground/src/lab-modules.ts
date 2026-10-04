import type { Component } from 'vue';
import CardModule from './modules/CardModule.vue';
import ColorsModule from './modules/ColorsModule.vue';
import CompositionModule from './modules/CompositionModule.vue';
import ConsumerParityModule from './modules/ConsumerParityModule.vue';
import ControlsModule from './modules/ControlsModule.vue';
import DataDisplayModule from './modules/DataDisplayModule.vue';
import DockModule from './modules/DockModule.vue';
import FormsModule from './modules/FormsModule.vue';
import LayoutShapeModule from './modules/LayoutShapeModule.vue';
import MaterialsModule from './modules/MaterialsModule.vue';
import MotionModule from './modules/MotionModule.vue';
import ScrollbarModule from './modules/ScrollbarModule.vue';
import ShadowModule from './modules/ShadowModule.vue';
import StatusFeedbackModule from './modules/StatusFeedbackModule.vue';
import TypographyModule from './modules/TypographyModule.vue';
import { groupCopy, type LocalizedText, localized, moduleCopy } from './playground-content';

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
    id: 'dock',
    groupId: 'components',
    label: moduleCopy.dock.label,
    description: moduleCopy.dock.description,
    component: DockModule,
  },
  {
    id: 'status-feedback',
    groupId: 'components',
    label: moduleCopy.statusFeedback.label,
    description: moduleCopy.statusFeedback.description,
    component: StatusFeedbackModule,
  },
  {
    id: 'forms',
    groupId: 'components',
    label: moduleCopy.forms.label,
    description: moduleCopy.forms.description,
    component: FormsModule,
  },
  {
    id: 'data-display',
    groupId: 'components',
    label: moduleCopy.dataDisplay.label,
    description: moduleCopy.dataDisplay.description,
    component: DataDisplayModule,
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
  label: LocalizedText;
  description: LocalizedText;
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
    moduleIds: [
      'controls',
      'dock',
      'status-feedback',
      'forms',
      'data-display',
      'card',
      'scrollbar',
    ],
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
  label: LocalizedText;
  description: LocalizedText;
  moduleIds: readonly ModuleId[];
}[];

export type ModuleGroupId = (typeof moduleGroups)[number]['id'];
export const specimenKinds = ['foundation', 'component', 'composition'] as const;
export type SpecimenKind = (typeof specimenKinds)[number];

export interface LabSpecimen {
  readonly id: string;
  readonly moduleId: ModuleId;
  readonly label: LocalizedText;
  readonly apiNames: readonly string[];
  readonly tags: readonly string[];
  readonly kind: SpecimenKind;
}

export const labSpecimens = [
  {
    id: 'foundation-colors',
    moduleId: 'colors',
    label: moduleCopy.colors.label,
    apiNames: [],
    tags: ['foundation', 'color', 'tokens'],
    kind: 'foundation',
  },
  {
    id: 'foundation-typography',
    moduleId: 'typography',
    label: moduleCopy.typography.label,
    apiNames: [],
    tags: ['foundation', 'typography', 'tokens'],
    kind: 'foundation',
  },
  {
    id: 'foundation-prose',
    moduleId: 'typography',
    label: localized('Prose & content semantics', '正文与内容语义'),
    apiNames: [],
    tags: ['foundation', 'prose', 'content', 'reading', 'typography'],
    kind: 'foundation',
  },
  {
    id: 'foundation-layout-shape',
    moduleId: 'layout-shape',
    label: moduleCopy.layoutShape.label,
    apiNames: [],
    tags: ['foundation', 'layout', 'geometry'],
    kind: 'foundation',
  },
  {
    id: 'foundation-motion',
    moduleId: 'motion',
    label: moduleCopy.motion.label,
    apiNames: [],
    tags: ['foundation', 'motion', 'tokens'],
    kind: 'foundation',
  },
  {
    id: 'materials-surface',
    moduleId: 'materials',
    label: localized('Surface presets', '表面预设'),
    apiNames: ['UiSurface'],
    tags: ['surface', 'material', 'primitive'],
    kind: 'component',
  },

  {
    id: 'controls-button',
    moduleId: 'controls',
    label: moduleCopy.button.label,
    apiNames: ['UiButton'],
    tags: ['control', 'button', 'action'],
    kind: 'component',
  },
  {
    id: 'controls-icon-button',
    moduleId: 'controls',
    label: moduleCopy.iconButton.label,
    apiNames: ['UiIconButton'],
    tags: ['control', 'button', 'icon'],
    kind: 'component',
  },
  {
    id: 'controls-action',
    moduleId: 'controls',
    label: moduleCopy.action.label,
    apiNames: ['UiAction'],
    tags: ['control', 'link', 'destination'],
    kind: 'component',
  },
  {
    id: 'controls-breadcrumb',
    moduleId: 'controls',
    label: localized('Breadcrumb', '面包屑导航'),
    apiNames: ['UiBreadcrumb'],
    tags: ['control', 'navigation', 'breadcrumb'],
    kind: 'component',
  },
  {
    id: 'controls-navigation-item',
    moduleId: 'controls',
    label: moduleCopy.navigationItem.label,
    apiNames: ['UiNavigationItem'],
    tags: ['control', 'navigation', 'destination'],
    kind: 'component',
  },
  {
    id: 'controls-segmented-control',
    moduleId: 'controls',
    label: moduleCopy.segmentedControl.label,
    apiNames: ['UiSegmentedControl'],
    tags: ['control', 'selection', 'segmented'],
    kind: 'component',
  },
  {
    id: 'controls-surface',
    moduleId: 'controls',
    label: moduleCopy.controlSurface.label,
    apiNames: ['UiControlSurface'],
    tags: ['control', 'surface', 'toolbar'],
    kind: 'component',
  },
  {
    id: 'dock-component',
    moduleId: 'dock',
    label: moduleCopy.dock.label,
    apiNames: ['UiDock'],
    tags: ['dock', 'navigation', 'composition', 'control-surface'],
    kind: 'component',
  },
  {
    id: 'status-feedback-badge',
    moduleId: 'status-feedback',
    label: moduleCopy.badge.label,
    apiNames: ['UiBadge'],
    tags: ['status', 'badge', 'feedback'],
    kind: 'component',
  },
  {
    id: 'status-feedback-indicator',
    moduleId: 'status-feedback',
    label: moduleCopy.statusIndicator.label,
    apiNames: ['UiStatusIndicator'],
    tags: ['status', 'indicator', 'feedback'],
    kind: 'component',
  },
  {
    id: 'status-feedback-skeleton',
    moduleId: 'status-feedback',
    label: moduleCopy.skeleton.label,
    apiNames: ['UiSkeleton'],
    tags: ['loading', 'skeleton', 'feedback'],
    kind: 'component',
  },
  {
    id: 'status-feedback-notice',
    moduleId: 'status-feedback',
    label: localized('Notice', '提示'),
    apiNames: ['UiNotice'],
    tags: ['notice', 'status', 'feedback'],
    kind: 'component',
  },
  {
    id: 'status-feedback-tooltip',
    moduleId: 'status-feedback',
    label: localized('Tooltip surface', '工具提示表面'),
    apiNames: ['UiTooltipSurface'],
    tags: ['tooltip', 'surface', 'overlay'],
    kind: 'component',
  },
  {
    id: 'forms-input',
    moduleId: 'forms',
    label: localized('Text input', '文本输入'),
    apiNames: ['UiInput'],
    tags: ['form', 'input', 'text', 'control'],
    kind: 'component',
  },
  {
    id: 'forms-textarea',
    moduleId: 'forms',
    label: localized('Textarea', '多行文本'),
    apiNames: ['UiTextarea'],
    tags: ['form', 'textarea', 'text', 'control'],
    kind: 'component',
  },
  {
    id: 'forms-select',
    moduleId: 'forms',
    label: localized('Select', '选择框'),
    apiNames: ['UiSelect'],
    tags: ['form', 'select', 'selection', 'control'],
    kind: 'component',
  },
  {
    id: 'data-display-table',
    moduleId: 'data-display',
    label: localized('Table', '表格'),
    apiNames: ['UiTable'],
    tags: ['data', 'table', 'overflow', 'content'],
    kind: 'component',
  },
  {
    id: 'data-display-disclosure',
    moduleId: 'data-display',
    label: localized('Disclosure', '渐进披露'),
    apiNames: ['UiDisclosure'],
    tags: ['disclosure', 'details', 'summary', 'content'],
    kind: 'component',
  },
  {
    id: 'card-card',
    moduleId: 'card',
    label: moduleCopy.card.label,
    apiNames: ['UiCard'],
    tags: ['card', 'surface', 'content'],
    kind: 'component',
  },
  {
    id: 'scrollbar-component',
    moduleId: 'scrollbar',
    label: moduleCopy.scrollbar.label,
    apiNames: ['UiScrollbar'],
    tags: ['scrollbar', 'navigation', 'overlay'],
    kind: 'component',
  },
  {
    id: 'composition-standard-mode',
    moduleId: 'composition',
    label: moduleCopy.composition.previewModes.standard.label,
    apiNames: [],
    tags: ['composition', 'glass', 'standard'],
    kind: 'composition',
  },
  {
    id: 'composition-accessibility-mode',
    moduleId: 'composition',
    label: moduleCopy.composition.previewModes.accessibility.label,
    apiNames: [],
    tags: ['composition', 'accessibility', 'reduced-transparency'],
    kind: 'composition',
  },
  {
    id: 'composition-control-cluster',
    moduleId: 'composition',
    label: moduleCopy.composition.scenes.controlCluster.label,
    apiNames: [],
    tags: ['composition', 'controls', 'workspace'],
    kind: 'composition',
  },
  {
    id: 'composition-project-card',
    moduleId: 'composition',
    label: moduleCopy.composition.scenes.projectCard.label,
    apiNames: [],
    tags: ['composition', 'card', 'content'],
    kind: 'composition',
  },
  {
    id: 'composition-floating-toolbar',
    moduleId: 'composition',
    label: moduleCopy.composition.scenes.floatingToolbar.label,
    apiNames: [],
    tags: ['composition', 'toolbar', 'controls'],
    kind: 'composition',
  },
  {
    id: 'composition-docs-article-header',
    moduleId: 'composition',
    label: moduleCopy.composition.scenes.docsArticleHeader.label,
    apiNames: [],
    tags: ['composition', 'reading', 'header'],
    kind: 'composition',
  },
  {
    id: 'composition-docs-navigation-group',
    moduleId: 'composition',
    label: moduleCopy.composition.scenes.docsNavigationGroup.label,
    apiNames: [],
    tags: ['composition', 'navigation', 'reading'],
    kind: 'composition',
  },
  {
    id: 'composition-docs-toolbar',
    moduleId: 'composition',
    label: moduleCopy.composition.scenes.docsToolbar.label,
    apiNames: [],
    tags: ['composition', 'toolbar', 'reading'],
    kind: 'composition',
  },
  {
    id: 'composition-docs-content-surface',
    moduleId: 'composition',
    label: moduleCopy.composition.scenes.docsContentSurface.label,
    apiNames: [],
    tags: ['composition', 'reading', 'surface'],
    kind: 'composition',
  },
  {
    id: 'composition-reading',
    moduleId: 'composition',
    label: localized('Reading composition', '正文阅读组合'),
    apiNames: [],
    tags: ['composition', 'reading', 'content'],
    kind: 'composition',
  },
] as const satisfies readonly LabSpecimen[];

export type SpecimenId = (typeof labSpecimens)[number]['id'];

export function isModuleId(value: unknown): value is ModuleId {
  return typeof value === 'string' && labModules.some((module) => module.id === value);
}

export function isSpecimenId(value: unknown): value is SpecimenId {
  return typeof value === 'string' && labSpecimens.some((specimen) => specimen.id === value);
}

export function specimenById(id: string): LabSpecimen | undefined {
  return labSpecimens.find((specimen) => specimen.id === id);
}

export function specimensForModule(moduleId: ModuleId): readonly LabSpecimen[] {
  return labSpecimens.filter((specimen) => specimen.moduleId === moduleId);
}

export interface ResolvedLabHash {
  readonly moduleId: ModuleId;
  readonly specimenId?: SpecimenId;
  readonly canonicalHash: string;
}

export function resolveLabHash(hash: string): ResolvedLabHash | null {
  const normalized = hash.startsWith('#') ? hash.slice(1) : hash;

  if (isModuleId(normalized)) {
    return { moduleId: normalized, canonicalHash: normalized };
  }

  if (isSpecimenId(normalized)) {
    const specimen = specimenById(normalized);
    if (specimen !== undefined) {
      return {
        moduleId: specimen.moduleId,
        specimenId: normalized,
        canonicalHash: normalized,
      };
    }
  }

  return null;
}
