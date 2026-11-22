import type { Component } from 'vue';
import * as interactive from './lab-interactive-specimens';
import type { FocusedPreview } from './lab-specimen-config';
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
import * as components from './previews/components';
import * as compositions from './previews/compositions';
import * as foundations from './previews/foundations';
import * as overlays from './previews/overlays';

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

/**
 * Explorer sections follow one rule: a section states design intent, a module is
 * a family that can be read on its own, and the utility section holds lab
 * tooling rather than design content. Modules therefore appear exactly once.
 */
export const moduleGroups = [
  {
    id: 'foundations',
    label: localized('Foundations', '设计基础'),
    kind: 'design',
    moduleIds: ['colors', 'typography', 'layout-shape', 'motion'],
  },
  {
    id: 'materials',
    label: localized('Materials & elevation', '材质与层级'),
    kind: 'design',
    moduleIds: ['materials', 'shadow'],
  },
  {
    id: 'components',
    label: localized('Components', '组件'),
    kind: 'design',
    moduleIds: [
      'controls',
      'forms',
      'overlays',
      'status-feedback',
      'data-display',
      'card',
      'dock',
      'scrollbar',
      'terminal',
    ],
  },
  {
    id: 'compositions',
    label: localized('Compositions', '组合场景'),
    kind: 'design',
    moduleIds: ['composition'],
  },
  {
    id: 'tools',
    label: localized('Lab tools', '实验室工具'),
    kind: 'utility',
    moduleIds: ['consumer-parity', 'giscus'],
  },
] as const satisfies readonly {
  id: string;
  label: LocalizedText;
  kind: 'design' | 'utility';
  moduleIds: readonly ModuleId[];
}[];

export type ModuleGroup = (typeof moduleGroups)[number];

export const specimenKinds = ['foundation', 'component', 'composition'] as const;
export type SpecimenKind = (typeof specimenKinds)[number];

export interface LabSpecimen {
  readonly id: string;
  readonly moduleId: ModuleId;
  readonly label: LocalizedText;
  readonly apiNames: readonly string[];
  readonly tags: readonly string[];
  readonly kind: SpecimenKind;
  readonly preview: FocusedPreview;
  readonly browse?: boolean;
}

export const labSpecimens = [
  {
    id: 'data-display-tabs',
    preview: interactive.tabs,
    moduleId: 'data-display',
    label: localized('Tabs', '标签页'),
    apiNames: ['UiTabs'],
    tags: ['tabs', 'panel', 'keyboard'],
    kind: 'component',
  },
  {
    id: 'data-display-avatar',
    preview: components.avatar,
    moduleId: 'data-display',
    label: localized('Avatar', '头像'),
    apiNames: ['UiAvatar'],
    tags: ['avatar', 'identity', 'image'],
    kind: 'component',
  },
  {
    id: 'data-display-pagination',
    preview: components.pagination,
    moduleId: 'data-display',
    label: localized('Pagination', '分页'),
    apiNames: ['UiPagination'],
    tags: ['pagination', 'navigation', 'list'],
    kind: 'component',
  },
  {
    id: 'data-display-empty-state',
    preview: components.emptyState,
    moduleId: 'data-display',
    label: localized('Empty state', '空状态'),
    apiNames: ['UiEmptyState'],
    tags: ['empty', 'placeholder', 'action'],
    kind: 'component',
  },
  {
    id: 'data-display-stat-card',
    preview: components.statCard,
    moduleId: 'data-display',
    label: localized('Metric cards', '指标卡'),
    apiNames: ['UiStatCard'],
    tags: ['data', 'metric', 'card', 'glass'],
    kind: 'component',
  },
  {
    id: 'data-display-timeline',
    preview: components.timeline,
    moduleId: 'data-display',
    label: localized('Timeline', '时间线'),
    apiNames: ['UiTimeline'],
    tags: ['data', 'timeline', 'milestone'],
    kind: 'component',
  },
  {
    id: 'data-display-step-flow',
    preview: components.stepFlow,
    moduleId: 'data-display',
    label: localized('Step flow', '步骤流'),
    apiNames: ['UiStepFlow'],
    tags: ['data', 'steps', 'flow'],
    kind: 'component',
  },
  {
    id: 'foundation-colors',
    preview: foundations.colors,
    moduleId: 'colors',
    label: localized('Color scales and roles', '色彩刻度与语义角色'),
    apiNames: [],
    tags: ['foundation', 'color', 'tokens'],
    kind: 'foundation',
  },
  {
    id: 'foundation-typography',
    preview: foundations.typography,
    moduleId: 'typography',
    label: localized('Type scale', '字号刻度'),
    apiNames: [],
    tags: ['foundation', 'typography', 'tokens'],
    kind: 'foundation',
  },
  {
    id: 'foundation-prose',
    preview: foundations.prose,
    moduleId: 'typography',
    label: localized('Prose & content semantics', '正文与内容语义'),
    apiNames: [],
    tags: ['foundation', 'prose', 'content', 'reading', 'typography'],
    kind: 'foundation',
  },
  {
    id: 'foundation-layout-shape',
    preview: foundations.layoutShape,
    moduleId: 'layout-shape',
    label: moduleCopy.layoutShape.label,
    apiNames: [],
    tags: ['foundation', 'layout', 'geometry'],
    browse: false,
    kind: 'foundation',
  },
  {
    id: 'layout-shape-spacing',
    preview: foundations.spacing,
    moduleId: 'layout-shape',
    label: moduleCopy.spacing.label,
    apiNames: [],
    tags: ['foundation', 'spacing', 'tokens'],
    kind: 'foundation',
  },
  {
    id: 'layout-shape-radius',
    preview: foundations.radius,
    moduleId: 'layout-shape',
    label: moduleCopy.radius.label,
    apiNames: [],
    tags: ['foundation', 'radius', 'tokens'],
    kind: 'foundation',
  },
  {
    id: 'layout-shape-border',
    preview: foundations.border,
    moduleId: 'layout-shape',
    label: moduleCopy.border.label,
    apiNames: [],
    tags: ['foundation', 'border', 'tokens'],
    kind: 'foundation',
  },
  {
    id: 'shadow-primitive',
    preview: foundations.shadowPrimitive,
    moduleId: 'shadow',
    label: moduleCopy.shadow.primitive.label,
    apiNames: [],
    tags: ['foundation', 'shadow', 'primitive', 'tokens'],
    kind: 'foundation',
  },
  {
    id: 'shadow-alias',
    preview: foundations.shadowAlias,
    moduleId: 'shadow',
    label: moduleCopy.shadow.aliases.label,
    apiNames: [],
    tags: ['foundation', 'shadow', 'semantic', 'tokens'],
    kind: 'foundation',
  },
  {
    id: 'foundation-motion',
    preview: foundations.motion,
    moduleId: 'motion',
    label: localized('Motion tokens', '动效令牌'),
    apiNames: [],
    tags: ['foundation', 'motion', 'tokens'],
    kind: 'foundation',
  },
  {
    id: 'foundation-motion-presence',
    preview: foundations.motionPresence,
    moduleId: 'motion',
    label: moduleCopy.motion.presence.label,
    apiNames: ['UiPresence'],
    tags: ['foundation', 'motion', 'presence', 'transition', 'stagger', 'view-transition'],
    kind: 'foundation',
  },
  {
    id: 'foundation-motion-width',
    preview: foundations.motionWidth,
    moduleId: 'motion',
    label: moduleCopy.motion.width.label,
    apiNames: [],
    tags: ['foundation', 'motion', 'layout', 'width', 'resize', 'language'],
    kind: 'foundation',
  },
  {
    id: 'foundation-motion-page',
    preview: foundations.motionPage,
    moduleId: 'motion',
    label: moduleCopy.motion.page.label,
    apiNames: [],
    tags: ['foundation', 'motion', 'dissolve', 'particle', 'webgl', 'view-transition'],
    kind: 'foundation',
  },
  {
    id: 'materials-surface',
    preview: foundations.surface,
    moduleId: 'materials',
    label: localized('Surface presets', '表面预设'),
    apiNames: ['UiSurface'],
    tags: ['surface', 'material', 'primitive'],
    kind: 'component',
  },

  {
    id: 'materials-glass',
    preview: foundations.glass,
    moduleId: 'materials',
    label: moduleCopy.glass.label,
    apiNames: ['UiSurface'],
    tags: ['material', 'glass', 'refraction', 'optics'],
    kind: 'foundation',
  },
  {
    id: 'terminal-composition',
    preview: foundations.terminal,
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
    preview: interactive.button,
    moduleId: 'controls',
    label: moduleCopy.button.label,
    apiNames: ['UiButton'],
    tags: ['control', 'button', 'action'],
    kind: 'component',
  },
  {
    id: 'controls-icon-button',
    preview: components.iconButton,
    moduleId: 'controls',
    label: moduleCopy.iconButton.label,
    apiNames: ['UiIconButton'],
    tags: ['control', 'button', 'icon'],
    kind: 'component',
  },
  {
    id: 'controls-action',
    preview: components.action,
    moduleId: 'controls',
    label: moduleCopy.action.label,
    apiNames: ['UiAction'],
    tags: ['control', 'link', 'destination'],
    kind: 'component',
  },
  {
    id: 'controls-breadcrumb',
    preview: components.breadcrumb,
    moduleId: 'controls',
    label: localized('Breadcrumb', '面包屑导航'),
    apiNames: ['UiBreadcrumb'],
    tags: ['control', 'navigation', 'breadcrumb'],
    kind: 'component',
  },
  {
    id: 'overlays-popover',
    preview: overlays.popover,
    moduleId: 'overlays',
    label: localized('Popover', '弹出层'),
    apiNames: ['UiPopover'],
    tags: ['overlay', 'popover', 'top-layer'],
    kind: 'component',
  },
  {
    id: 'overlays-dropdown-menu',
    preview: overlays.dropdownMenu,
    moduleId: 'overlays',
    label: localized('Dropdown menu', '下拉菜单'),
    apiNames: ['UiDropdownMenu'],
    tags: ['overlay', 'dropdown', 'menu', 'top-layer'],
    kind: 'component',
  },
  {
    id: 'overlays-context-menu',
    preview: overlays.contextMenu,
    moduleId: 'overlays',
    label: localized('Context menu', '右键菜单'),
    apiNames: ['UiContextMenu'],
    tags: ['overlay', 'menu', 'context-menu', 'top-layer', 'submenu'],
    kind: 'component',
  },
  {
    id: 'overlays-dialog',
    preview: overlays.dialog,
    moduleId: 'overlays',
    label: localized('Modal dialog', '模态对话框'),
    apiNames: ['UiDialog'],
    tags: ['overlay', 'dialog', 'modal', 'focus'],
    kind: 'component',
  },
  {
    id: 'controls-navigation-item',
    preview: components.navigationItem,
    moduleId: 'controls',
    label: moduleCopy.navigationItem.label,
    apiNames: ['UiNavigationItem'],
    tags: ['control', 'navigation', 'destination'],
    kind: 'component',
  },
  {
    id: 'controls-segmented-control',
    preview: interactive.segmented,
    moduleId: 'controls',
    label: moduleCopy.segmentedControl.label,
    apiNames: ['UiSegmentedControl'],
    tags: ['control', 'selection', 'segmented'],
    kind: 'component',
  },
  {
    id: 'controls-surface',
    preview: components.controlSurface,
    moduleId: 'controls',
    label: moduleCopy.controlSurface.label,
    apiNames: ['UiControlSurface'],
    tags: ['control', 'surface', 'toolbar'],
    kind: 'component',
  },
  {
    id: 'dock-component',
    preview: interactive.dock,
    moduleId: 'dock',
    label: moduleCopy.dock.label,
    apiNames: ['UiDock'],
    tags: ['dock', 'navigation', 'composition', 'control-surface'],
    kind: 'component',
  },
  {
    id: 'status-feedback-badge',
    preview: components.badge,
    moduleId: 'status-feedback',
    label: moduleCopy.badge.label,
    apiNames: ['UiBadge'],
    tags: ['status', 'badge', 'feedback'],
    kind: 'component',
  },
  {
    id: 'status-feedback-indicator',
    preview: components.indicator,
    moduleId: 'status-feedback',
    label: moduleCopy.statusIndicator.label,
    apiNames: ['UiStatusIndicator'],
    tags: ['status', 'indicator', 'feedback'],
    kind: 'component',
  },
  {
    id: 'status-feedback-skeleton',
    preview: components.skeleton,
    moduleId: 'status-feedback',
    label: moduleCopy.skeleton.label,
    apiNames: ['UiSkeleton'],
    tags: ['loading', 'skeleton', 'feedback'],
    kind: 'component',
  },
  {
    id: 'status-feedback-notice',
    preview: components.notice,
    moduleId: 'status-feedback',
    label: localized('Notice', '提示'),
    apiNames: ['UiNotice'],
    tags: ['notice', 'status', 'feedback'],
    kind: 'component',
  },
  {
    id: 'status-feedback-toast',
    preview: components.toast,
    moduleId: 'status-feedback',
    label: localized('Toast', '短暂反馈'),
    apiNames: ['UiToast'],
    tags: ['toast', 'status', 'feedback', 'notification'],
    kind: 'component',
  },
  {
    id: 'status-feedback-tooltip',
    preview: components.tooltip,
    moduleId: 'status-feedback',
    label: localized('Tooltip surface', '工具提示表面'),
    apiNames: ['UiTooltipSurface'],
    tags: ['tooltip', 'surface', 'overlay'],
    kind: 'component',
  },
  {
    id: 'forms-input',
    preview: interactive.input,
    moduleId: 'forms',
    label: localized('Text input', '文本输入'),
    apiNames: ['UiInput'],
    tags: ['form', 'input', 'text', 'control'],
    kind: 'component',
  },
  {
    id: 'forms-textarea',
    preview: components.textarea,
    moduleId: 'forms',
    label: localized('Textarea', '多行文本'),
    apiNames: ['UiTextarea'],
    tags: ['form', 'textarea', 'text', 'control'],
    kind: 'component',
  },
  {
    id: 'forms-select',
    preview: interactive.select,
    moduleId: 'forms',
    label: localized('Select', '选择框'),
    apiNames: ['UiSelect'],
    tags: ['form', 'select', 'selection', 'control'],
    kind: 'component',
  },
  {
    id: 'forms-choice-controls',
    preview: components.choiceControls,
    moduleId: 'forms',
    label: localized('Choice controls', '选择控件'),
    apiNames: ['UiCheckbox', 'UiRadioGroup', 'UiSwitch'],
    tags: ['form', 'checkbox', 'radio', 'switch', 'selection', 'control'],
    browse: false,
    kind: 'component',
  },
  {
    id: 'forms-checkbox',
    preview: interactive.checkbox,
    moduleId: 'forms',
    label: localized('Checkbox', '复选框'),
    apiNames: ['UiCheckbox'],
    tags: ['form', 'checkbox', 'selection'],
    kind: 'component',
  },
  {
    id: 'forms-radio-group',
    preview: components.radioGroup,
    moduleId: 'forms',
    label: localized('Radio group', '单选组'),
    apiNames: ['UiRadioGroup'],
    tags: ['form', 'radio', 'selection'],
    kind: 'component',
  },
  {
    id: 'forms-switch',
    preview: components.switchControl,
    moduleId: 'forms',
    label: localized('Switch', '开关'),
    apiNames: ['UiSwitch'],
    tags: ['form', 'switch', 'selection'],
    kind: 'component',
  },
  {
    id: 'forms-field-states',
    preview: components.field,
    moduleId: 'forms',
    label: localized('Field states', '字段状态'),
    apiNames: ['UiField'],
    tags: ['form', 'field', 'validation', 'readonly', 'message'],
    kind: 'component',
  },
  {
    id: 'data-display-table',
    preview: components.table,
    moduleId: 'data-display',
    label: localized('Table', '表格'),
    apiNames: ['UiTable'],
    tags: ['data', 'table', 'overflow', 'content'],
    kind: 'component',
  },
  {
    id: 'data-display-disclosure',
    preview: components.disclosure,
    moduleId: 'data-display',
    label: localized('Disclosure', '渐进披露'),
    apiNames: ['UiDisclosure'],
    tags: ['disclosure', 'details', 'summary', 'content'],
    kind: 'component',
  },
  {
    id: 'card-card',
    preview: interactive.card,
    moduleId: 'card',
    label: moduleCopy.card.label,
    apiNames: ['UiCard'],
    tags: ['card', 'surface', 'content'],
    kind: 'component',
  },
  {
    id: 'scrollbar-component',
    preview: foundations.scrollbar,
    moduleId: 'scrollbar',
    label: moduleCopy.scrollbar.label,
    apiNames: ['UiScrollbar'],
    tags: ['scrollbar', 'navigation', 'overlay'],
    kind: 'component',
  },
  {
    id: 'composition-standard-mode',
    preview: compositions.standardComposition,
    moduleId: 'composition',
    label: moduleCopy.composition.previewModes.standard.label,
    apiNames: [],
    tags: ['composition', 'glass', 'standard'],
    kind: 'composition',
  },
  {
    id: 'composition-accessibility-mode',
    preview: compositions.accessibleComposition,
    moduleId: 'composition',
    label: moduleCopy.composition.previewModes.accessibility.label,
    apiNames: [],
    tags: ['composition', 'accessibility', 'reduced-transparency'],
    kind: 'composition',
  },
  {
    id: 'composition-control-cluster',
    preview: compositions.controlCluster,
    moduleId: 'composition',
    label: moduleCopy.composition.scenes.controlCluster.label,
    apiNames: [],
    tags: ['composition', 'controls', 'workspace'],
    kind: 'composition',
  },
  {
    id: 'composition-project-card',
    preview: compositions.projectCard,
    moduleId: 'composition',
    label: moduleCopy.composition.scenes.projectCard.label,
    apiNames: [],
    tags: ['composition', 'card', 'content'],
    kind: 'composition',
  },
  {
    id: 'composition-floating-toolbar',
    preview: compositions.floatingToolbar,
    moduleId: 'composition',
    label: moduleCopy.composition.scenes.floatingToolbar.label,
    apiNames: [],
    tags: ['composition', 'toolbar', 'controls'],
    kind: 'composition',
  },
  {
    id: 'composition-docs-article-header',
    preview: compositions.docsArticleHeader,
    moduleId: 'composition',
    label: moduleCopy.composition.scenes.docsArticleHeader.label,
    apiNames: [],
    tags: ['composition', 'reading', 'header'],
    kind: 'composition',
  },
  {
    id: 'composition-docs-navigation-group',
    preview: compositions.docsNavigationGroup,
    moduleId: 'composition',
    label: moduleCopy.composition.scenes.docsNavigationGroup.label,
    apiNames: [],
    tags: ['composition', 'navigation', 'reading'],
    kind: 'composition',
  },
  {
    id: 'composition-docs-toolbar',
    preview: compositions.docsToolbar,
    moduleId: 'composition',
    label: moduleCopy.composition.scenes.docsToolbar.label,
    apiNames: [],
    tags: ['composition', 'toolbar', 'reading'],
    kind: 'composition',
  },
  {
    id: 'composition-docs-content-surface',
    preview: compositions.docsContentSurface,
    moduleId: 'composition',
    label: moduleCopy.composition.scenes.docsContentSurface.label,
    apiNames: [],
    tags: ['composition', 'reading', 'surface'],
    kind: 'composition',
  },
  {
    id: 'composition-reading',
    preview: compositions.reading,
    moduleId: 'composition',
    label: localized('Reading composition', '正文阅读组合'),
    apiNames: [],
    tags: ['composition', 'reading', 'content'],
    kind: 'composition',
  },
  {
    id: 'giscus-themes',
    preview: compositions.giscus,
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

/** Specimens the Explorer may link to; aggregate comparisons stay out of the tree. */
export function browsableSpecimens(moduleId: ModuleId): readonly LabSpecimen[] {
  return specimensForModule(moduleId).filter((specimen) => specimen.browse !== false);
}

/** A family needs a disclosure only when it holds more than one browsable specimen. */
export function isExpandableModule(moduleId: ModuleId): boolean {
  return browsableSpecimens(moduleId).length > 1;
}

export function moduleGroupFor(moduleId: ModuleId): ModuleGroup | undefined {
  return moduleGroups.find((group) => group.moduleIds.some((id) => id === moduleId));
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
