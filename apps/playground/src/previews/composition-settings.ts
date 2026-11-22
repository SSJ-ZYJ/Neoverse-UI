import { glassMaterial } from '@neoverse-ui/tokens';
import type { BadgeVariant, SurfacePreset } from '@neoverse-ui/vue';
import type { CompositionPreset } from '../lab-specimen-config';
import { type LocalizedText, localized, moduleCopy } from '../playground-content';

export const compactControl = {
  kind: 'boolean',
  group: 'layout',
  label: localized('Compact layout', '紧凑布局'),
} as const;

export const surfaceControl = {
  kind: 'select',
  group: 'appearance',
  label: localized('Surface', '表面'),
  options: [
    { value: 'glass-subtle', label: glassMaterial.tiers.subtle },
    { value: 'glass-elevated', label: glassMaterial.tiers.elevated },
    { value: 'glass-immersive', label: glassMaterial.tiers.immersive },
    { value: 'elevated', label: localized('Elevated', '抬升') },
  ] as const satisfies readonly { value: SurfacePreset; label: LocalizedText }[],
} as const;

type CompositionSurface = (typeof surfaceControl.options)[number]['value'];

function labeledOptions<Value extends string>(labels: Readonly<Record<Value, LocalizedText>>) {
  const options: { value: Value; label: LocalizedText }[] = [];
  for (const value in labels) options.push({ value, label: labels[value] });
  return options;
}

function modeControl<Mode extends string>(modes: Readonly<Record<Mode, LocalizedText>>) {
  return {
    kind: 'select',
    group: 'interaction',
    label: localized('Mode', '模式'),
    options: labeledOptions(modes),
  } as const;
}

export const controlClusterMode = modeControl(moduleCopy.composition.scenes.controlCluster.modes);
export type ControlClusterMode = (typeof controlClusterMode.options)[number]['value'];
export interface ControlClusterConfiguration {
  compact: boolean;
  showStatus: boolean;
  surface: CompositionSurface;
}

export const controlClusterPresets = [
  {
    id: 'default-workspace',
    label: localized('Default Workspace', '默认工作区'),
    props: { compact: false, showStatus: true, surface: 'glass-subtle' },
    state: { mode: 'focus' },
  },
  {
    id: 'compact-workspace',
    label: localized('Compact Workspace', '紧凑工作区'),
    props: { compact: true, showStatus: false, surface: 'elevated' },
    state: { mode: 'review' },
  },
] as const satisfies readonly CompositionPreset<
  string,
  ControlClusterConfiguration,
  { mode: ControlClusterMode }
>[];

export const showActionsControl = {
  kind: 'boolean',
  group: 'content',
  label: localized('Show extra actions', '显示额外操作'),
} as const;

export interface ToolbarConfiguration {
  compact: boolean;
  showActions: boolean;
  surface: CompositionSurface;
}

export const floatingToolbarMode = modeControl(moduleCopy.composition.scenes.floatingToolbar.modes);
export type FloatingToolbarMode = (typeof floatingToolbarMode.options)[number]['value'];

export const floatingToolbarPresets = [
  {
    id: 'standard-toolbar',
    label: localized('Standard Toolbar', '标准工具栏'),
    props: { compact: false, showActions: true, surface: 'glass-immersive' },
    state: { mode: 'canvas' },
  },
  {
    id: 'compact-toolbar',
    label: localized('Compact Toolbar', '紧凑工具栏'),
    props: { compact: true, showActions: false, surface: 'glass-subtle' },
    state: { mode: 'inspect' },
  },
] as const satisfies readonly CompositionPreset<
  string,
  ToolbarConfiguration,
  { mode: FloatingToolbarMode }
>[];

export const projectContentControl = {
  kind: 'select',
  group: 'layout',
  label: localized('Content detail', '内容详略'),
  options: labeledOptions({
    overview: localized('Overview', '概览'),
    detailed: localized('Detailed', '详细'),
  }),
} as const;

export const projectStatusLabels = {
  'in-progress': localized('In progress', '进行中'),
  'needs-review': localized('Needs review', '待审阅'),
  blocked: localized('Blocked', '受阻'),
};

export const projectStatusControl = {
  kind: 'select',
  group: 'content',
  label: localized('Project status', '项目状态'),
  options: labeledOptions(projectStatusLabels),
} as const;

type ProjectStatus = keyof typeof projectStatusLabels;

export const projectBadgeVariants = {
  'in-progress': 'success',
  'needs-review': 'warning',
  blocked: 'danger',
} as const satisfies Record<ProjectStatus, BadgeVariant>;

export interface ProjectCardConfiguration {
  content: (typeof projectContentControl.options)[number]['value'];
  status: ProjectStatus;
  progress: number;
  surface: CompositionSurface;
}

export const projectCardPresets = [
  {
    id: 'detailed-card',
    label: localized('Detailed Card', '详细卡片'),
    props: { content: 'detailed', status: 'in-progress', progress: 68, surface: 'glass-elevated' },
    state: {},
  },
  {
    id: 'overview-card',
    label: localized('Overview Card', '概览卡片'),
    props: { content: 'overview', status: 'needs-review', progress: 40, surface: 'elevated' },
    state: {},
  },
] as const satisfies readonly CompositionPreset<
  string,
  ProjectCardConfiguration,
  Record<never, never>
>[];

export const docsToolbarMode = modeControl(moduleCopy.composition.scenes.docsToolbar.modes);
export type DocsToolbarMode = (typeof docsToolbarMode.options)[number]['value'];

export const docsToolbarPresets = [
  {
    id: 'reading-toolbar',
    label: localized('Reading Toolbar', '阅读工具栏'),
    props: { compact: false, showActions: true, surface: 'glass-subtle' },
    state: { mode: 'read' },
  },
  {
    id: 'editing-toolbar',
    label: localized('Editing Toolbar', '编辑工具栏'),
    props: { compact: true, showActions: false, surface: 'glass-elevated' },
    state: { mode: 'edit' },
  },
] as const satisfies readonly CompositionPreset<
  string,
  ToolbarConfiguration,
  { mode: DocsToolbarMode }
>[];
