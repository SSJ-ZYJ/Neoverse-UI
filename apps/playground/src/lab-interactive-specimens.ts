import {
  type ButtonProps,
  type CardProps,
  type CheckboxProps,
  type DockProps,
  type FormControlValue,
  type InputProps,
  type SegmentedControlProps,
  type SelectProps,
  type TabsProps,
  UiBadge,
  UiButton,
  UiCard,
  UiCheckbox,
  UiDock,
  UiInput,
  UiNavigationItem,
  UiSegmentedControl,
  UiSelect,
  UiTabs,
} from '@neoverse-ui/vue';
import { h } from 'vue';
import LabIcon from './LabIcon.vue';
import { defineSpecimen } from './lab-specimen-config';
import {
  formatLocalized,
  type Locale,
  localize,
  localized,
  moduleCopy,
  tokenCopy,
} from './playground-content';

const disabled = { kind: 'boolean', label: localized('Disabled', '禁用') } as const;
const loading = { kind: 'boolean', label: localized('Loading', '加载中') } as const;
const readonly = { kind: 'boolean', label: localized('Read-only', '只读') } as const;
const glassOptions = [
  { value: 'none', label: localized('None', '无') },
  { value: 'glass-subtle', label: tokenCopy.glassVariants.subtle },
  { value: 'glass-elevated', label: tokenCopy.glassVariants.elevated },
  { value: 'glass-immersive', label: tokenCopy.glassVariants.immersive },
] as const;
const surfaceLabel = localized('Surface', '表面');
const activeOption = localized('Selected option', '所选选项');

const buttonLabel = localized('Try action', '体验操作');
const buttonClicks = localized('Activations: {count}', '触发次数：{count}');
/** The editable Button specimen */
export const button = defineSpecimen<ButtonProps, { clicks: number }>()({
  initialProps: { variant: 'secondary', size: 'sm', disabled: false, loading: false },
  initialState: () => ({ clicks: 0 }),
  controls: {
    props: {
      variant: {
        kind: 'select',
        label: localized('Variant', '变体'),
        options: [
          { value: 'primary', label: localized('Primary', '主要') },
          { value: 'secondary', label: localized('Secondary', '次要') },
          { value: 'ghost', label: localized('Ghost', '无填充') },
        ],
      },
      size: {
        kind: 'select',
        label: localized('Size', '尺寸'),
        options: [
          { value: 'sm', label: localized('Small', '小') },
          { value: 'md', label: localized('Medium', '中') },
          { value: 'lg', label: localized('Large', '大') },
        ],
      },
      disabled,
      loading,
    },
  },
  render: ({ props, state, setState, locale }) =>
    h('div', { class: 'grid justify-items-center gap-3' }, [
      h(UiButton, { ...props, onClick: () => setState('clicks', state.clicks + 1) }, () =>
        localize(buttonLabel, locale),
      ),
      h(
        'output',
        { class: 'text-caption text-secondary' },
        formatLocalized(buttonClicks, locale, { count: state.clicks }),
      ),
    ]),
});

const segmentCopy = moduleCopy.segmentedControl;
const segments = [
  { value: 'overview', label: segmentCopy.options.overview, disabled: false },
  { value: 'details', label: segmentCopy.options.details, disabled: true },
  { value: 'activity', label: segmentCopy.options.activity, disabled: false },
] as const;
const enabledSegments = segments.filter((option) => option.disabled === false);
type SegmentValue = (typeof enabledSegments)[number]['value'];

function segmentOptions(locale: Locale): SegmentedControlProps['options'] {
  return segments.map(({ label, ...option }) => ({ ...option, label: localize(label, locale) }));
}

const localizedSegments = { en: segmentOptions('en'), zh: segmentOptions('zh') };
/** The editable SegmentedControl specimen */
export const segmented = defineSpecimen<
  Pick<SegmentedControlProps, 'disabled' | 'loading' | 'surface'>,
  { modelValue: SegmentValue }
>()({
  initialProps: { disabled: false, loading: false },
  initialState: () => ({ modelValue: 'overview' }),
  controls: {
    props: {
      disabled,
      loading,
      surface: { kind: 'select', label: surfaceLabel, options: glassOptions },
    },
    state: { modelValue: { kind: 'select', label: activeOption, options: enabledSegments } },
  },
  note: localized(
    'Size is read-only: the component supports only sm.',
    '尺寸为只读：此组件仅支持 sm。',
  ),
  stateDisabled: (props) => props.disabled === true || props.loading === true,
  render: ({ props, state, setState, locale }) =>
    h(UiSegmentedControl, {
      ...props,
      ariaLabel: localize(segmentCopy.aria.view, locale),
      options: localizedSegments[locale],
      modelValue: state.modelValue,
      'onUpdate:modelValue': (value: string) => {
        const option = enabledSegments.find((entry) => entry.value === value);
        if (option !== undefined) setState('modelValue', option.value);
      },
    }),
});

const inputLabel = localized('Preview text input', '预览文本输入框');
const inputPlaceholder = localized('Enter a project name', '输入项目名称');
/** The editable Input specimen */
export const input = defineSpecimen<
  Pick<InputProps, 'disabled' | 'readonly' | 'validation'>,
  { modelValue: Extract<InputProps['modelValue'], string> }
>()({
  initialProps: { disabled: false, readonly: false },
  initialState: () => ({ modelValue: 'Neoverse Studio' }),
  controls: {
    props: {
      disabled,
      readonly,
      validation: {
        kind: 'select',
        label: localized('Validation', '校验'),
        options: [
          { value: 'none', label: localized('None', '无') },
          { value: 'error', label: localized('Error', '错误') },
          { value: 'warning', label: localized('Warning', '警告') },
          { value: 'success', label: localized('Success', '成功') },
        ],
      },
    },
    state: { modelValue: { kind: 'text', label: localized('Value', '输入值') } },
  },
  stateDisabled: (props) => props.disabled === true || props.readonly === true,
  render: ({ props, state, setState, locale }) =>
    h('div', { class: 'w-full max-w-container-sm' }, [
      h(UiInput, {
        ...props,
        'aria-label': localize(inputLabel, locale),
        placeholder: localize(inputPlaceholder, locale),
        modelValue: state.modelValue,
        'onUpdate:modelValue': (value: string) => setState('modelValue', value),
      }),
    ]),
});

const runtimeLabel = localized('Runtime', '运行时');
const runtimes = [
  { value: 'native', label: localized('Native', '原生') },
  { value: 'remote', label: localized('Remote', '远程') },
] as const;
type Runtime = (typeof runtimes)[number]['value'];

function runtimeOptions(locale: Locale): SelectProps['options'] {
  return runtimes.map(({ value, label }) => ({ value, label: localize(label, locale) }));
}

const localizedRuntimes = { en: runtimeOptions('en'), zh: runtimeOptions('zh') };

/** The editable Select specimen */
export const select = defineSpecimen<
  Pick<SelectProps, 'disabled' | 'readonly'>,
  { modelValue: Runtime }
>()({
  initialProps: { disabled: false, readonly: false },
  initialState: () => ({ modelValue: 'native' }),
  controls: {
    props: { disabled, readonly },
    state: { modelValue: { kind: 'select', label: localized('Value', '值'), options: runtimes } },
  },
  stateDisabled: (props) => props.disabled === true || props.readonly === true,
  render: ({ props, state, setState, locale }) =>
    h(UiSelect, {
      ...props,
      id: 'forms-runtime',
      class: 'w-full max-w-container-sm',
      modelValue: state.modelValue,
      'onUpdate:modelValue': (value: FormControlValue) => {
        const option = runtimes.find((entry) => entry.value === value);
        if (option !== undefined) setState('modelValue', option.value);
      },
      'aria-label': localize(runtimeLabel, locale),
      options: localizedRuntimes[locale],
      'data-form-select': '',
    }),
});

const releaseNotifications = localized('Release notifications', '版本发布通知');

/** The editable Checkbox specimen */
export const checkbox = defineSpecimen<Pick<CheckboxProps, 'disabled'>, { modelValue: boolean }>()({
  initialProps: { disabled: false },
  initialState: () => ({ modelValue: true }),
  controls: {
    props: { disabled },
    state: { modelValue: { kind: 'boolean', label: localized('Checked', '已勾选') } },
  },
  stateDisabled: (props) => props.disabled === true,
  render: ({ props, state, setState, locale }) =>
    h(
      UiCheckbox,
      {
        ...props,
        modelValue: state.modelValue,
        'onUpdate:modelValue': (value: boolean) => setState('modelValue', value),
        'data-form-checkbox': '',
        'data-contract-state': 'default',
      },
      () => localize(releaseNotifications, locale),
    ),
});

const tabsLabel = localized('Member sections', '成员页面分区');
const tabOptions = [
  { value: 'overview', label: localized('Overview', '概览'), disabled: false },
  { value: 'disabled', label: localized('Disabled', '未启用'), disabled: true },
  { value: 'activity', label: localized('Activity', '动态'), disabled: false },
] as const;
const enabledTabs = tabOptions.filter((option) => !option.disabled);
type TabValue = (typeof enabledTabs)[number]['value'];

function memberTabOptions(locale: Locale): TabsProps['options'] {
  return tabOptions.map(({ label, ...option }) => ({ ...option, label: localize(label, locale) }));
}

const localizedTabs = { en: memberTabOptions('en'), zh: memberTabOptions('zh') };

/** The editable Tabs specimen */
export const tabs = defineSpecimen<TabsProps, { modelValue: TabValue }>()({
  initialProps: {},
  initialState: () => ({ modelValue: 'overview' }),
  controls: {
    state: {
      modelValue: {
        kind: 'select',
        label: localized('Selected Tab', '所选标签页'),
        options: enabledTabs,
      },
    },
  },
  render: ({ state, setState, locale }) =>
    h(
      UiTabs,
      {
        modelValue: state.modelValue,
        'onUpdate:modelValue': (value: string) => {
          const option = enabledTabs.find((entry) => entry.value === value);
          if (option !== undefined) setState('modelValue', option.value);
        },
        options: localizedTabs[locale],
        ariaLabel: localize(tabsLabel, locale),
        'data-tabs-sample': '',
      },
      {
        default: ({ value }: { value: string }) =>
          h('p', { class: 'text-body-sm text-secondary', 'data-tabs-panel-state': '' }, value),
      },
    ),
});

const cardCopy = moduleCopy.card;
const cardBody = localized(
  'Compare surface presets on the same backdrop without changing the content.',
  '在同一背景上对比表面预设，卡片内容保持不变。',
);
/** The editable Card specimen */
export const card = defineSpecimen<CardProps>()({
  initialProps: { as: 'article' },
  initialState: () => ({}),
  controls: {
    props: {
      surface: {
        kind: 'select',
        label: surfaceLabel,
        options: [
          { value: 'solid', label: localized('Solid', '不透明') },
          { value: 'elevated', label: localized('Elevated', '抬升') },
          ...glassOptions,
        ],
      },
    },
  },
  render: ({ props, locale }) =>
    h(
      UiCard,
      { ...props, 'aria-labelledby': 'live-card-title', class: 'w-full max-w-container-sm' },
      () =>
        h('div', { class: 'grid gap-3' }, [
          h('div', { class: 'flex flex-wrap items-center justify-between gap-2' }, [
            h(
              'h3',
              { id: 'live-card-title', class: 'text-label font-label text-primary' },
              localize(cardCopy.reference, locale),
            ),
            h(UiBadge, { variant: 'success' }, () => localize(cardCopy.ready, locale)),
          ]),
          h('p', { class: 'text-body text-secondary' }, localize(cardBody, locale)),
        ]),
    ),
});

const dockCopy = moduleCopy.dock;
const dockItems = [
  { value: 'home', label: dockCopy.items.home, icon: 'home' },
  { value: 'projects', label: dockCopy.items.projects, icon: 'folder' },
  { value: 'focus', label: dockCopy.items.focus, icon: 'target' },
  { value: 'activity', label: dockCopy.items.activity, icon: 'activity' },
] as const;
type DockDestination = (typeof dockItems)[number]['value'];

/** The editable Dock specimen */
export const dock = defineSpecimen<DockProps, { destination: DockDestination }>()({
  initialProps: { compact: false, scale: 'md', navigationIndicator: true },
  initialState: () => ({ destination: 'home' }),
  controls: {
    props: {
      compact: { kind: 'boolean', label: dockCopy.states.compact.label },
      scale: {
        kind: 'select',
        label: localized('Scale', '缩放档位'),
        options: [
          { value: 'md', label: localized('Medium', '中') },
          { value: 'lg', label: localized('Large', '大') },
        ],
      },
      navigationIndicator: {
        kind: 'boolean',
        label: localized('Navigation indicator', '导航指示器'),
      },
    },
    state: {
      destination: {
        kind: 'select',
        label: localized('Active destination', '当前导航项'),
        options: dockItems,
      },
    },
  },
  render: ({ props, state, setState, locale }) =>
    h('div', { class: 'playground-stage__dock scrollbar-immersive' }, [
      h('div', { class: 'playground-dock-preview__content' }, [
        h(UiDock, { ...props, 'aria-label': localize(dockCopy.ariaLabel, locale) }, () =>
          dockItems.map(({ value, label, icon }) => {
            const active = state.destination === value;
            return h(
              UiNavigationItem,
              {
                key: value,
                as: 'button',
                label: localize(label, locale),
                compact: props.compact === true,
                active,
                'aria-current': active ? 'location' : undefined,
                onClick: () => setState('destination', value),
              },
              { icon: () => h(LabIcon, { name: icon }) },
            );
          }),
        ),
      ]),
    ]),
});
