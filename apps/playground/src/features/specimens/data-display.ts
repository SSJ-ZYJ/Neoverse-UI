import {
  type AvatarProps,
  type StatCardProps,
  type TableProps,
  type TabsProps,
  UiAvatar,
  UiDisclosure,
  UiStatCard,
  UiTable,
  UiTabs,
} from '@neoverse-ui/vue';
import { h } from 'vue';
import EmptyStatePreview from '../../catalogue/display/EmptyStatePreview.vue';
import { type Locale, localize, localized } from '../../content/playground-content';
import { defineSpecimen } from './lab-specimen-config';
import { shapeLabel, sizeLabel, sizeOptions, surfaceLabel, surfaceOptions } from './shared';

const tabsLabel = localized('Member sections', '成员页面分区');
/** Appearance choices shared by the Tabs gallery and Inspector */
export const tabsVariantOptions = [
  { value: 'glass', label: localized('Glass', '玻璃') },
  { value: 'underline', label: localized('Underline', '下划线') },
  { value: 'pill', label: localized('Pill', '胶囊') },
] as const;
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
export const tabs = defineSpecimen<
  { variant?: NonNullable<TabsProps['variant']> | 'auto' },
  { modelValue: TabValue }
>()({
  initialProps: { variant: 'auto' },
  initialState: () => ({ modelValue: 'overview' }),
  controls: {
    props: {
      variant: {
        kind: 'select',
        label: localized('Appearance', '外观'),
        options: [{ value: 'auto', label: localized('Automatic', '自动') }, ...tabsVariantOptions],
      },
    },
    state: {
      modelValue: {
        kind: 'select',
        label: localized('Selected Tab', '所选标签页'),
        options: enabledTabs,
      },
    },
  },
  render: ({ props, state, setState, locale }) =>
    h(
      UiTabs,
      {
        ...(props.variant && props.variant !== 'auto' ? { variant: props.variant } : {}),
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

const avatarShapeOptions = [
  { value: 'circle', label: localized('Circle', '圆形') },
  { value: 'rounded', label: localized('Rounded', '圆角') },
] as const;
const avatarPlaceholderOptions = [
  { value: 'initials', label: localized('Initials', '首字母') },
  { value: 'icon', label: localized('Default icon', '默认图标') },
] as const;

/** The editable Avatar specimen */
export const avatar = defineSpecimen<AvatarProps>()({
  initialProps: { size: 'md', shape: 'circle', placeholder: 'initials' },
  initialState: () => ({}),
  controls: {
    props: {
      size: { kind: 'select', label: sizeLabel, options: sizeOptions },
      shape: { kind: 'select', label: shapeLabel, options: avatarShapeOptions },
      placeholder: {
        kind: 'select',
        label: localized('Placeholder', '占位样式'),
        options: avatarPlaceholderOptions,
      },
    },
  },
  render: ({ props }) =>
    h(UiAvatar, {
      ...props,
      name: 'Shenshijun',
      fallback: 'SSJ',
      'data-avatar-sample': '',
    }),
});

const tableCaption = localized('Package compatibility matrix', '包兼容性矩阵');
const tableColumns = [
  localized('Package', '包'),
  localized('Runtime', '运行时'),
  localized('Status', '状态'),
];
const tableRows = [
  ['@neoverse-ui/vue', 'Vue 3.5+'],
  ['@neoverse-ui/react', 'React 19'],
  ['@neoverse-ui/tailwind', 'Tailwind CSS 4'],
] as const;
const tableReady = localized('Ready', '可用');

/** The editable Table specimen */
export const table = defineSpecimen<TableProps>()({
  initialProps: { striped: true, hoverable: true },
  initialState: () => ({}),
  controls: {
    props: {
      striped: { kind: 'boolean', label: localized('Striped', '斑马纹') },
      hoverable: { kind: 'boolean', label: localized('Hoverable', '悬停高亮') },
    },
  },
  render: ({ props, locale }) => {
    const caption = localize(tableCaption, locale);
    const ready = localize(tableReady, locale);
    return h(
      UiTable,
      { ...props, caption, 'aria-label': caption, 'data-data-display-table': '' },
      () => [
        h('thead', [
          h(
            'tr',
            tableColumns.map((column) => h('th', localize(column, locale))),
          ),
        ]),
        h(
          'tbody',
          tableRows.map(([name, runtime]) =>
            h('tr', { key: name }, [h('td', name), h('td', runtime), h('td', ready)]),
          ),
        ),
      ],
    );
  },
});

const disclosureCopy = {
  summary: localized('Implementation notes', '实现说明'),
  body: localized(
    'Consumers own the content; the shared component owns summary geometry, focus feedback, and state treatment.',
    '消费端负责内容，共享组件负责摘要几何、焦点反馈与状态表现。',
  ),
};

/** The editable Disclosure specimen */
export const disclosure = defineSpecimen<Record<never, never>, { open: boolean }>()({
  initialProps: {},
  initialState: () => ({ open: false }),
  controls: {
    state: { open: { kind: 'boolean', label: localized('Expanded', '已展开') } },
  },
  render: ({ state, setState, locale }) =>
    h(
      UiDisclosure,
      {
        summary: localize(disclosureCopy.summary, locale),
        open: state.open,
        class: 'w-full max-w-container-sm',
        'data-data-display-disclosure': state.open ? 'open' : 'closed',
        'onUpdate:open': (value: boolean) => setState('open', value),
      },
      () => h('p', { class: 'text-body-sm text-secondary' }, localize(disclosureCopy.body, locale)),
    ),
});

type EmptyStatePreviewProps = Pick<
  InstanceType<typeof EmptyStatePreview>['$props'],
  'category' | 'variant'
>;

/** The editable Empty State specimen */
export const emptyState = defineSpecimen<
  EmptyStatePreviewProps,
  { projectCreated: boolean; filterActive: boolean }
>()({
  initialProps: { category: 'all', variant: 'scenario' },
  initialState: () => ({ projectCreated: false, filterActive: true }),
  controls: {
    props: {
      category: {
        kind: 'select',
        group: 'content',
        label: localized('Scenario category', '场景分类'),
        options: [
          { value: 'all', label: localized('All scenarios', '全部场景') },
          { value: 'onboarding', label: localized('Onboarding', '首次使用') },
          { value: 'search', label: localized('No results', '无匹配结果') },
          { value: 'activity', label: localized('No activity', '暂无活动') },
          { value: 'access', label: localized('Restricted access', '权限受限') },
        ],
      },
      variant: {
        kind: 'select',
        group: 'appearance',
        label: localized('Variant', '样式'),
        options: [
          { value: 'scenario', label: localized('Match scenario', '随场景') },
          { value: 'default', label: localized('Centered', '居中引导') },
          { value: 'outlined', label: localized('Outlined panel', '虚线面板') },
          { value: 'compact', label: localized('Compact row', '紧凑列表行') },
          { value: 'subtle', label: localized('Subtle surface', '柔和表面') },
        ],
      },
    },
  },
  render: ({ locale, props, state, setState }) =>
    h(EmptyStatePreview, {
      ...props,
      locale,
      projectCreated: state.projectCreated,
      filterActive: state.filterActive,
      'onUpdate:projectCreated': (value: boolean) => setState('projectCreated', value),
      'onUpdate:filterActive': (value: boolean) => setState('filterActive', value),
    }),
});

/** The editable StatCard specimen */
export const statCard = defineSpecimen<StatCardProps>()({
  initialProps: { surface: 'auto' },
  initialState: () => ({}),
  controls: {
    props: {
      surface: { kind: 'select', label: surfaceLabel, options: surfaceOptions },
    },
  },
  render: ({ props, locale }) =>
    h(UiStatCard, {
      ...props,
      label: localize(localized('Latency', '延迟'), locale),
      value: 0,
      unit: 'ms',
      footnote: localize(localized('Native value, including zero', '支持原生数值，包括零'), locale),
    }),
});
