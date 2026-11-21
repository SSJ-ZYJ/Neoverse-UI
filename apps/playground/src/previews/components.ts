import {
  type FieldControlAttrs,
  type FormControlValue,
  UiAction,
  UiAvatar,
  UiBadge,
  UiBreadcrumb,
  UiButton,
  UiCheckbox,
  UiControlSurface,
  UiDisclosure,
  UiEmptyState,
  UiField,
  UiIconButton,
  UiInput,
  UiNavigationItem,
  UiNotice,
  UiPagination,
  UiRadioGroup,
  UiSelect,
  UiSkeleton,
  UiStatCard,
  UiStatusIndicator,
  UiStepFlow,
  UiSwitch,
  UiTable,
  UiTabs,
  UiTextarea,
  UiTimeline,
  UiToast,
  UiTooltipSurface,
} from '@neoverse-ui/vue';
import { computed, defineComponent, h, type PropType, ref, type VNode } from 'vue';
import LabIcon from '../LabIcon.vue';
import {
  formatLocalized,
  type Locale,
  localize,
  localized,
  moduleCopy,
} from '../playground-content';

const previewProps = { locale: { type: String as PropType<Locale>, required: true } } as const;

const iconButtonCount = localized('Items added: {count}', '已添加项目：{count}');
const IconButtonPreview = defineComponent({
  props: previewProps,
  setup(props) {
    const count = ref(0);
    return () =>
      h('div', { class: 'grid justify-items-center gap-3' }, [
        h(
          UiIconButton,
          {
            label: localize(moduleCopy.iconButton.controls.addItem, props.locale),
            onClick: () => {
              count.value += 1;
            },
          },
          () => h(LabIcon, { name: 'plus' }),
        ),
        h(
          'output',
          { class: 'text-caption text-secondary' },
          formatLocalized(iconButtonCount, props.locale, { count: count.value }),
        ),
      ]);
  },
});

export function iconButton(locale: Locale): VNode {
  return h(IconButtonPreview, { locale });
}

export function action(locale: Locale): VNode {
  return h(
    UiAction,
    { href: '#controls-action' },
    {
      default: () => localize(moduleCopy.action.controls.primary, locale),
      leading: () => h(LabIcon, { name: 'globe' }),
    },
  );
}

export function breadcrumb(locale: Locale): VNode {
  return h(UiBreadcrumb, {
    ariaLabel: localize(localized('Documentation breadcrumb', '文档路径导航'), locale),
    items: [
      {
        id: 'home',
        label: localize(moduleCopy.navigationItem.controls.home, locale),
        href: '#top',
      },
      { id: 'docs', label: localize(localized('Docs', '文档'), locale), href: '#composition' },
      {
        id: 'design-system',
        label: localize(localized('Design system', '设计系统'), locale),
        href: '#controls',
      },
      {
        id: 'breadcrumb',
        label: localize(localized('Breadcrumb', '面包屑导航'), locale),
        current: true,
      },
    ],
  });
}

export function navigationItem(locale: Locale): VNode {
  return h(
    UiNavigationItem,
    {
      href: '#controls-navigation-item',
      label: localize(moduleCopy.navigationItem.controls.home, locale),
      active: true,
    },
    { icon: () => h(LabIcon, { name: 'home' }) },
  );
}

const surfaceNavigationLabel = localized('Control surface navigation', '控件表面导航');
const surfaceItems = [
  { id: 'overview', label: localized('Overview', '总览') },
  { id: 'components', label: localized('Components', '组件') },
  { id: 'patterns', label: localized('Patterns', '组合') },
];
const ControlSurfacePreview = defineComponent({
  props: previewProps,
  setup(props) {
    const active = ref('overview');
    return () =>
      h(
        UiControlSurface,
        {
          as: 'nav',
          navigationIndicator: true,
          edgeMode: 'local',
          'aria-label': localize(surfaceNavigationLabel, props.locale),
        },
        () =>
          surfaceItems.map(({ id, label }) =>
            h(UiNavigationItem, {
              key: id,
              href: '#controls-surface',
              label: localize(label, props.locale),
              size: 'sm',
              active: active.value === id,
              surface: 'none',
              onClick(event: MouseEvent) {
                event.preventDefault();
                active.value = id;
              },
            }),
          ),
      );
  },
});

export function controlSurface(locale: Locale): VNode {
  return h(ControlSurfacePreview, { locale });
}

export function badge(locale: Locale): VNode {
  return h(UiBadge, null, () => localize(moduleCopy.badge.controls.neutral, locale));
}

export function indicator(locale: Locale): VNode {
  return h(UiStatusIndicator, { status: 'neutral' }, () =>
    localize(moduleCopy.statusIndicator.controls.neutral, locale),
  );
}

export function skeleton(_locale: Locale): VNode {
  return h(UiSkeleton, {
    variant: 'rect',
    width: '12rem',
    height: '6rem',
    radius: 'var(--neoverse-radius-md)',
  });
}

const noticeMessage = localized(
  'A neutral notice for supporting context.',
  '用于补充上下文的中性提示。',
);

export function notice(locale: Locale): VNode {
  return h(UiNotice, { variant: 'neutral' }, () => localize(noticeMessage, locale));
}

const toastCopy = {
  trigger: localized('Show feedback', '显示反馈'),
  message: localized('Changes saved successfully.', '修改已保存。'),
  dismiss: localized('Dismiss notification', '关闭通知'),
};
const ToastPreview = defineComponent({
  props: previewProps,
  setup(props) {
    const open = ref(false);
    return () =>
      h('div', { class: 'grid justify-items-center' }, [
        h(
          UiButton,
          {
            'data-toast-open': '',
            onClick: () => {
              open.value = true;
            },
          },
          () => localize(toastCopy.trigger, props.locale),
        ),
        h(UiToast, {
          open: open.value,
          variant: 'success',
          duration: 0,
          message: localize(toastCopy.message, props.locale),
          dismissLabel: localize(toastCopy.dismiss, props.locale),
          'onUpdate:open': (value: boolean) => {
            open.value = value;
          },
        }),
      ]);
  },
});

export function toast(locale: Locale): VNode {
  return h(ToastPreview, { locale });
}

export function tooltip(locale: Locale): VNode {
  return h(UiTooltipSurface, { variant: 'neutral', role: 'tooltip' }, () =>
    localize(localized('Neutral tooltip surface', '中性工具提示表面'), locale),
  );
}

const formCopy = {
  notes: localized('Project notes', '项目备注'),
  notesPlaceholder: localized('Describe the next iteration…', '描述下一轮迭代…'),
  runtime: localized('Runtime', '运行时'),
  native: localized('Native', '原生'),
  remote: localized('Remote', '远程'),
  releaseNotifications: localized('Release notifications', '版本发布通知'),
  releaseChannel: localized('Release channel', '发布通道'),
  stable: localized('Stable', '稳定版'),
  preview: localized('Preview', '预览版'),
  autoSync: localized('Automatic synchronization', '自动同步'),
  email: localized('Email address', '邮箱地址'),
  invalidEmail: localized('Enter a valid release email.', '请输入有效的版本通知邮箱。'),
};

const TextareaPreview = defineComponent({
  props: previewProps,
  setup(props) {
    const notes = ref('');
    return () =>
      h(UiTextarea, {
        id: 'forms-notes',
        class: 'w-full max-w-container-sm',
        modelValue: notes.value,
        'onUpdate:modelValue': (value: string) => {
          notes.value = value;
        },
        'aria-label': localize(formCopy.notes, props.locale),
        placeholder: localize(formCopy.notesPlaceholder, props.locale),
        rows: 4,
        'data-form-textarea': '',
      });
  },
});

export function textarea(locale: Locale): VNode {
  return h(TextareaPreview, { locale });
}

const SelectPreview = defineComponent({
  props: previewProps,
  setup(props) {
    const runtime = ref<FormControlValue>('native');
    const options = computed(() => [
      { value: 'native', label: localize(formCopy.native, props.locale) },
      { value: 'remote', label: localize(formCopy.remote, props.locale) },
    ]);
    return () =>
      h(UiSelect, {
        id: 'forms-runtime',
        class: 'w-full max-w-container-sm',
        modelValue: runtime.value,
        'onUpdate:modelValue': (value: FormControlValue) => {
          runtime.value = value;
        },
        'aria-label': localize(formCopy.runtime, props.locale),
        options: options.value,
        'data-form-select': '',
      });
  },
});

export function select(locale: Locale): VNode {
  return h(SelectPreview, { locale });
}

export function choiceControls(locale: Locale): VNode {
  return h('div', { class: 'grid justify-items-start gap-3' }, [
    checkbox(locale),
    radioGroup(locale),
    switchControl(locale),
  ]);
}

const CheckboxPreview = defineComponent({
  props: previewProps,
  setup(props) {
    const checked = ref(true);
    return () =>
      h(
        UiCheckbox,
        {
          modelValue: checked.value,
          'onUpdate:modelValue': (value: boolean) => {
            checked.value = value;
          },
          'data-form-checkbox': '',
          'data-contract-state': 'default',
        },
        () => localize(formCopy.releaseNotifications, props.locale),
      );
  },
});

export function checkbox(locale: Locale): VNode {
  return h(CheckboxPreview, { locale });
}

const RadioGroupPreview = defineComponent({
  props: previewProps,
  setup(props) {
    const channel = ref<FormControlValue>('stable');
    const options = computed(() => [
      { value: 'stable', label: localize(formCopy.stable, props.locale) },
      { value: 'preview', label: localize(formCopy.preview, props.locale) },
    ]);
    return () =>
      h(UiRadioGroup, {
        modelValue: channel.value,
        'onUpdate:modelValue': (value: FormControlValue) => {
          channel.value = value;
        },
        name: 'forms-release-channel',
        ariaLabel: localize(formCopy.releaseChannel, props.locale),
        options: options.value,
        'data-form-radio-group': '',
        'data-contract-state': 'default',
      });
  },
});

export function radioGroup(locale: Locale): VNode {
  return h(RadioGroupPreview, { locale });
}

const SwitchPreview = defineComponent({
  props: previewProps,
  setup(props) {
    const enabled = ref(true);
    return () =>
      h(
        UiSwitch,
        {
          modelValue: enabled.value,
          'onUpdate:modelValue': (value: boolean) => {
            enabled.value = value;
          },
          'data-form-switch': '',
          'data-contract-state': 'default',
        },
        () => localize(formCopy.autoSync, props.locale),
      );
  },
});

export function switchControl(locale: Locale): VNode {
  return h(SwitchPreview, { locale });
}

const FieldPreview = defineComponent({
  props: previewProps,
  setup(props) {
    const email = ref('invalid-address');
    return () =>
      h(
        UiField,
        {
          class: 'w-full max-w-container-sm',
          controlId: 'forms-validation-error',
          label: localize(formCopy.email, props.locale),
          message: localize(formCopy.invalidEmail, props.locale),
          validation: 'error',
          required: true,
        },
        {
          default: ({ controlAttrs }: { controlAttrs: FieldControlAttrs }) =>
            h(UiInput, {
              ...controlAttrs,
              modelValue: email.value,
              'onUpdate:modelValue': (value: string) => {
                email.value = value;
              },
              validation: 'error',
              type: 'email',
            }),
        },
      );
  },
});

export function field(locale: Locale): VNode {
  return h(FieldPreview, { locale });
}

const tabOptions = [
  { value: 'overview', label: localized('Overview', '概览') },
  { value: 'disabled', label: localized('Disabled', '未启用'), disabled: true },
  { value: 'activity', label: localized('Activity', '动态') },
];
const tabsLabel = localized('Member sections', '成员页面分区');
const TabsPreview = defineComponent({
  props: previewProps,
  setup(props) {
    const selected = ref('overview');
    const options = computed(() =>
      tabOptions.map(({ label, ...option }) => ({
        ...option,
        label: localize(label, props.locale),
      })),
    );
    return () =>
      h(
        UiTabs,
        {
          modelValue: selected.value,
          'onUpdate:modelValue': (value: string) => {
            selected.value = value;
          },
          options: options.value,
          ariaLabel: localize(tabsLabel, props.locale),
          'data-tabs-sample': '',
        },
        {
          default: ({ value }: { value: string }) =>
            h('p', { class: 'text-body-sm text-secondary', 'data-tabs-panel-state': '' }, value),
        },
      );
  },
});

export function tabs(locale: Locale): VNode {
  return h(TabsPreview, { locale });
}

export function avatar(_locale: Locale): VNode {
  return h(UiAvatar, {
    name: 'Shenshijun',
    fallback: 'SSJ',
    size: 'md',
    shape: 'circle',
    'data-avatar-sample': '',
  });
}

const paginationCopy = {
  name: localized('Member list pages', '成员列表页码'),
  previous: localized('Previous page', '上一页'),
  next: localized('Next page', '下一页'),
  page: localized('Page', '第'),
};
const PaginationPreview = defineComponent({
  props: previewProps,
  setup(props) {
    const page = ref(4);
    return () =>
      h(UiPagination, {
        page: page.value,
        'onUpdate:page': (value: number) => {
          page.value = value;
        },
        totalPages: 18,
        ariaLabel: localize(paginationCopy.name, props.locale),
        previousLabel: localize(paginationCopy.previous, props.locale),
        nextLabel: localize(paginationCopy.next, props.locale),
        pageLabel: localize(paginationCopy.page, props.locale),
        'data-pagination-sample': '',
      });
  },
});

export function pagination(locale: Locale): VNode {
  return h(PaginationPreview, { locale });
}

const emptyStateCopy = {
  title: localized('No projects yet', '暂无项目'),
  description: localized('Create a project to get started.', '创建项目后即可在这里查看。'),
  action: localized('Create project', '创建项目'),
  project: localized('Untitled project', '未命名项目'),
  remove: localized('Remove project', '移除项目'),
};
const EmptyStatePreview = defineComponent({
  props: previewProps,
  setup(props) {
    const projectCreated = ref(false);
    return () => {
      if (projectCreated.value) {
        return h('div', { class: 'grid justify-items-center gap-3' }, [
          h(
            'p',
            { class: 'text-body-sm text-primary', role: 'status' },
            localize(emptyStateCopy.project, props.locale),
          ),
          h(
            UiButton,
            {
              size: 'sm',
              onClick: () => {
                projectCreated.value = false;
              },
            },
            () => localize(emptyStateCopy.remove, props.locale),
          ),
        ]);
      }

      return h(
        UiEmptyState,
        {
          title: localize(emptyStateCopy.title, props.locale),
          description: localize(emptyStateCopy.description, props.locale),
          'data-empty-state-sample': '',
        },
        {
          icon: () => h(LabIcon, { name: 'folder' }),
          action: () =>
            h(
              UiButton,
              {
                size: 'sm',
                onClick: () => {
                  projectCreated.value = true;
                },
              },
              () => localize(emptyStateCopy.action, props.locale),
            ),
        },
      );
    };
  },
});

export function emptyState(locale: Locale): VNode {
  return h(EmptyStatePreview, { locale });
}

export function statCard(locale: Locale): VNode {
  return h(UiStatCard, {
    label: localize(localized('Latency', '延迟'), locale),
    value: 0,
    unit: 'ms',
    footnote: localize(localized('Native value, including zero', '支持原生数值，包括零'), locale),
  });
}

const milestones = [
  {
    id: 'design',
    title: localized('Design', '设计'),
    description: localized('Shared visual contracts', '共享视觉契约'),
    date: '2026-10-01',
  },
  {
    id: 'implementation',
    title: localized('Implementation', '实现'),
    description: localized('Tokens → CSS → Vue adapters', '设计令牌 → CSS → Vue 适配器'),
    date: '2026-10-09',
  },
  {
    id: 'validation',
    title: localized('Validation', '验收'),
    description: localized('Consumer and release evidence', '消费端与发布证据'),
    date: '2026-10-12',
  },
];

export function timeline(locale: Locale): VNode {
  return h(UiTimeline, {
    items: milestones.map(({ id, title, description, date }) => ({
      id,
      title: localize(title, locale),
      description: localize(description, locale),
      time: date,
      dateTime: date,
    })),
    ariaLabel: localize(localized('Milestones', '里程碑'), locale),
  });
}

const steps = [
  {
    id: 'plan',
    title: localized('Plan', '规划'),
    description: localized('Define the contract', '定义契约'),
    status: 'complete',
    statusLabel: localized('Completed', '已完成'),
  },
  {
    id: 'build',
    title: localized('Build', '实现'),
    description: localized('Reuse the shared material', '复用共享材质'),
    status: 'current',
    statusLabel: localized('Current', '当前步骤'),
  },
  {
    id: 'verify',
    title: localized('Verify', '验证'),
    description: localized('Review real consumer evidence', '查看真实的消费端证据'),
    status: 'pending',
    statusLabel: localized('Pending', '待完成'),
  },
] as const;

export function stepFlow(locale: Locale): VNode {
  return h(UiStepFlow, {
    class: 'w-full max-w-reading-wide',
    items: steps.map(({ id, title, description, status, statusLabel }) => ({
      id,
      title: localize(title, locale),
      description: localize(description, locale),
      status,
      statusLabel: localize(statusLabel, locale),
    })),
    ariaLabel: localize(localized('Delivery steps', '交付步骤'), locale),
  });
}

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

export function table(locale: Locale): VNode {
  const caption = localize(tableCaption, locale);
  const ready = localize(tableReady, locale);
  return h(UiTable, { caption, 'aria-label': caption, 'data-data-display-table': '' }, () => [
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
  ]);
}

const disclosureCopy = {
  summary: localized('Implementation notes', '实现说明'),
  body: localized(
    'Consumers own the content; the shared component owns summary geometry, focus feedback, and state treatment.',
    '消费端负责内容，共享组件负责摘要几何、焦点反馈与状态表现。',
  ),
};

export function disclosure(locale: Locale): VNode {
  return h(
    UiDisclosure,
    {
      summary: localize(disclosureCopy.summary, locale),
      'data-data-display-disclosure': 'closed',
    },
    () => h('p', { class: 'text-body-sm text-secondary' }, localize(disclosureCopy.body, locale)),
  );
}
