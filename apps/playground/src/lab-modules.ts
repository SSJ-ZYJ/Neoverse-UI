import type { Component } from 'vue';
import CardModule from './modules/CardModule.vue';
import ColorsModule from './modules/ColorsModule.vue';
import CompositionModule from './modules/CompositionModule.vue';
import ConsumerParityModule from './modules/ConsumerParityModule.vue';
import ControlsModule from './modules/ControlsModule.vue';
import DataDisplayModule from './modules/DataDisplayModule.vue';
import DockModule from './modules/DockModule.vue';
import FormsModule from './modules/FormsModule.vue';
import GiscusModule from './modules/GiscusModule.vue';
import LayoutShapeModule from './modules/LayoutShapeModule.vue';
import MaterialsModule from './modules/MaterialsModule.vue';
import MotionModule from './modules/MotionModule.vue';
import OverlaysModule from './modules/OverlaysModule.vue';
import ScrollbarModule from './modules/ScrollbarModule.vue';
import ShadowModule from './modules/ShadowModule.vue';
import StatusFeedbackModule from './modules/StatusFeedbackModule.vue';
import TerminalModule from './modules/TerminalModule.vue';
import TypographyModule from './modules/TypographyModule.vue';
import { type LocalizedText, localized, moduleCopy } from './playground-content';

export const labModules = [
  {
    id: 'colors',
    label: moduleCopy.colors.label,
    description: moduleCopy.colors.description,
    component: ColorsModule,
  },
  {
    id: 'typography',
    label: moduleCopy.typography.label,
    description: moduleCopy.typography.description,
    component: TypographyModule,
  },
  {
    id: 'layout-shape',
    label: moduleCopy.layoutShape.label,
    description: moduleCopy.layoutShape.description,
    component: LayoutShapeModule,
  },
  {
    id: 'motion',
    label: moduleCopy.motion.label,
    description: moduleCopy.motion.description,
    component: MotionModule,
  },
  {
    id: 'materials',
    label: moduleCopy.materials.label,
    description: moduleCopy.materials.description,
    component: MaterialsModule,
  },
  {
    id: 'shadow',
    label: moduleCopy.shadow.label,
    description: moduleCopy.shadow.description,
    component: ShadowModule,
  },
  {
    id: 'controls',
    label: moduleCopy.controls.label,
    description: moduleCopy.controls.description,
    component: ControlsModule,
  },
  {
    id: 'overlays',
    label: moduleCopy.overlays.label,
    description: moduleCopy.overlays.description,
    component: OverlaysModule,
  },
  {
    id: 'dock',
    label: moduleCopy.dock.label,
    description: moduleCopy.dock.description,
    component: DockModule,
  },
  {
    id: 'status-feedback',
    label: moduleCopy.statusFeedback.label,
    description: moduleCopy.statusFeedback.description,
    component: StatusFeedbackModule,
  },
  {
    id: 'forms',
    label: moduleCopy.forms.label,
    description: moduleCopy.forms.description,
    component: FormsModule,
  },
  {
    id: 'data-display',
    label: moduleCopy.dataDisplay.label,
    description: moduleCopy.dataDisplay.description,
    component: DataDisplayModule,
  },
  {
    id: 'card',
    label: moduleCopy.card.label,
    description: moduleCopy.card.description,
    component: CardModule,
  },
  {
    id: 'scrollbar',
    label: moduleCopy.scrollbar.label,
    description: moduleCopy.scrollbar.description,
    component: ScrollbarModule,
  },
  {
    id: 'terminal',
    label: localized('Terminal', '终端'),
    description: localized(
      'Terminal presentation, input, and output composition.',
      '终端外观、输入与输出组合。',
    ),
    component: TerminalModule,
  },
  {
    id: 'composition',
    label: moduleCopy.composition.label,
    description: moduleCopy.composition.description,
    component: CompositionModule,
  },
  {
    id: 'consumer-parity',
    label: moduleCopy.consumerParity.label,
    description: moduleCopy.consumerParity.description,
    component: ConsumerParityModule,
  },
  {
    id: 'giscus',
    label: moduleCopy.giscus.label,
    description: moduleCopy.giscus.description,
    component: GiscusModule,
  },
] as const satisfies readonly {
  id: string;
  label: LocalizedText;
  description: LocalizedText;
  component: Component;
}[];

export type ModuleId = (typeof labModules)[number]['id'];
export type LabModule = (typeof labModules)[number];

export const moduleGroups = [
  {
    id: 'components',
    label: localized('Components', '组件'),
    moduleIds: [
      'controls',
      'overlays',
      'forms',
      'status-feedback',
      'card',
      'data-display',
      'dock',
      'scrollbar',
    ],
  },
  {
    id: 'foundations',
    label: localized('Foundations', '设计基础'),
    moduleIds: ['colors', 'typography', 'layout-shape', 'shadow', 'motion'],
  },
  {
    id: 'compositions',
    label: localized('Compositions', '组合场景'),
    moduleIds: ['composition', 'terminal'],
  },
  {
    id: 'presets',
    label: localized('Presets', '预设'),
    moduleIds: ['materials'],
  },
  {
    id: 'validation',
    label: localized('Validation', '验证'),
    moduleIds: ['consumer-parity', 'giscus'],
  },
] as const satisfies readonly {
  id: string;
  label: LocalizedText;
  moduleIds: readonly ModuleId[];
}[];

export const specimenKinds = ['foundation', 'component', 'composition'] as const;
export type SpecimenKind = (typeof specimenKinds)[number];

export interface LabSpecimen {
  readonly id: string;
  readonly moduleId: ModuleId;
  readonly label: LocalizedText;
  readonly apiNames: readonly string[];
  readonly tags: readonly string[];
  readonly kind: SpecimenKind;
  readonly browse?: boolean;
}

export const labSpecimens = [
  {
    id: 'data-display-tabs',
    moduleId: 'data-display',
    label: localized('Tabs', '标签页'),
    apiNames: ['UiTabs'],
    tags: ['tabs', 'panel', 'keyboard'],
    kind: 'component',
  },
  {
    id: 'data-display-avatar',
    moduleId: 'data-display',
    label: localized('Avatar', '头像'),
    apiNames: ['UiAvatar'],
    tags: ['avatar', 'identity', 'image'],
    kind: 'component',
  },
  {
    id: 'data-display-pagination',
    moduleId: 'data-display',
    label: localized('Pagination', '分页'),
    apiNames: ['UiPagination'],
    tags: ['pagination', 'navigation', 'list'],
    kind: 'component',
  },
  {
    id: 'data-display-empty-state',
    moduleId: 'data-display',
    label: localized('Empty state', '空状态'),
    apiNames: ['UiEmptyState'],
    tags: ['empty', 'placeholder', 'action'],
    kind: 'component',
  },
  {
    id: 'data-display-stat-card',
    moduleId: 'data-display',
    label: localized('Metric cards', '指标卡'),
    apiNames: ['UiStatCard'],
    tags: ['data', 'metric', 'card', 'glass'],
    kind: 'component',
  },
  {
    id: 'data-display-timeline',
    moduleId: 'data-display',
    label: localized('Timeline', '时间线'),
    apiNames: ['UiTimeline'],
    tags: ['data', 'timeline', 'milestone'],
    kind: 'component',
  },
  {
    id: 'data-display-step-flow',
    moduleId: 'data-display',
    label: localized('Step flow', '步骤流'),
    apiNames: ['UiStepFlow'],
    tags: ['data', 'steps', 'flow'],
    kind: 'component',
  },
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
    browse: false,
    kind: 'foundation',
  },
  {
    id: 'layout-shape-spacing',
    moduleId: 'layout-shape',
    label: moduleCopy.spacing.label,
    apiNames: [],
    tags: ['foundation', 'spacing', 'tokens'],
    kind: 'foundation',
  },
  {
    id: 'layout-shape-radius',
    moduleId: 'layout-shape',
    label: moduleCopy.radius.label,
    apiNames: [],
    tags: ['foundation', 'radius', 'tokens'],
    kind: 'foundation',
  },
  {
    id: 'layout-shape-border',
    moduleId: 'layout-shape',
    label: moduleCopy.border.label,
    apiNames: [],
    tags: ['foundation', 'border', 'tokens'],
    kind: 'foundation',
  },
  {
    id: 'shadow-primitive',
    moduleId: 'shadow',
    label: moduleCopy.shadow.primitive.label,
    apiNames: [],
    tags: ['foundation', 'shadow', 'primitive', 'tokens'],
    kind: 'foundation',
  },
  {
    id: 'shadow-alias',
    moduleId: 'shadow',
    label: moduleCopy.shadow.aliases.label,
    apiNames: [],
    tags: ['foundation', 'shadow', 'semantic', 'tokens'],
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
    id: 'foundation-motion-presence',
    moduleId: 'motion',
    label: moduleCopy.motion.presence.label,
    apiNames: ['UiPresence'],
    tags: ['foundation', 'motion', 'presence', 'transition', 'stagger', 'view-transition'],
    kind: 'foundation',
  },
  {
    id: 'foundation-motion-width',
    moduleId: 'motion',
    label: moduleCopy.motion.width.label,
    apiNames: [],
    tags: ['foundation', 'motion', 'layout', 'width', 'resize', 'language'],
    kind: 'foundation',
  },
  {
    id: 'foundation-motion-page',
    moduleId: 'motion',
    label: moduleCopy.motion.page.label,
    apiNames: [],
    tags: ['foundation', 'motion', 'dissolve', 'particle', 'webgl', 'view-transition'],
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
    id: 'materials-glass',
    moduleId: 'materials',
    label: moduleCopy.glass.label,
    apiNames: ['UiSurface'],
    tags: ['material', 'glass', 'refraction', 'optics'],
    kind: 'foundation',
  },
  {
    id: 'terminal-composition',
    moduleId: 'terminal',
    label: localized('Terminal composition', '终端组件组合'),
    apiNames: [
      'UiTerminalSurface',
      'UiTerminalLine',
      'UiTerminalTranscript',
      'UiTerminalPrompt',
      'UiTerminalEcho',
    ],
    tags: ['terminal', 'surface', 'input', 'stream', 'scrollbar', 'glass'],
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
    id: 'overlays-popover',
    moduleId: 'overlays',
    label: localized('Popover', '弹出层'),
    apiNames: ['UiPopover'],
    tags: ['overlay', 'popover', 'top-layer'],
    kind: 'component',
  },
  {
    id: 'overlays-dropdown-menu',
    moduleId: 'overlays',
    label: localized('Dropdown menu', '下拉菜单'),
    apiNames: ['UiDropdownMenu'],
    tags: ['overlay', 'dropdown', 'menu', 'top-layer'],
    kind: 'component',
  },
  {
    id: 'overlays-context-menu',
    moduleId: 'overlays',
    label: localized('Context menu', '右键菜单'),
    apiNames: ['UiContextMenu'],
    tags: ['overlay', 'menu', 'context-menu', 'top-layer', 'submenu'],
    kind: 'component',
  },
  {
    id: 'overlays-dialog',
    moduleId: 'overlays',
    label: localized('Modal dialog', '模态对话框'),
    apiNames: ['UiDialog'],
    tags: ['overlay', 'dialog', 'modal', 'focus'],
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
    id: 'status-feedback-toast',
    moduleId: 'status-feedback',
    label: localized('Toast', '短暂反馈'),
    apiNames: ['UiToast'],
    tags: ['toast', 'status', 'feedback', 'notification'],
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
    id: 'forms-choice-controls',
    moduleId: 'forms',
    label: localized('Choice controls', '选择控件'),
    apiNames: ['UiCheckbox', 'UiRadioGroup', 'UiSwitch'],
    tags: ['form', 'checkbox', 'radio', 'switch', 'selection', 'control'],
    browse: false,
    kind: 'component',
  },
  {
    id: 'forms-checkbox',
    moduleId: 'forms',
    label: localized('Checkbox', '复选框'),
    apiNames: ['UiCheckbox'],
    tags: ['form', 'checkbox', 'selection'],
    kind: 'component',
  },
  {
    id: 'forms-radio-group',
    moduleId: 'forms',
    label: localized('Radio group', '单选组'),
    apiNames: ['UiRadioGroup'],
    tags: ['form', 'radio', 'selection'],
    kind: 'component',
  },
  {
    id: 'forms-switch',
    moduleId: 'forms',
    label: localized('Switch', '开关'),
    apiNames: ['UiSwitch'],
    tags: ['form', 'switch', 'selection'],
    kind: 'component',
  },
  {
    id: 'forms-field-states',
    moduleId: 'forms',
    label: localized('Field states', '字段状态'),
    apiNames: ['UiField'],
    tags: ['form', 'field', 'validation', 'readonly', 'message'],
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
  {
    id: 'giscus-themes',
    moduleId: 'giscus',
    label: moduleCopy.giscus.label,
    apiNames: [],
    tags: ['theme', 'giscus', 'comments', 'iframe', 'consumer'],
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
