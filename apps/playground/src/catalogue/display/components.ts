import { UiBreadcrumb, UiPagination, UiStepFlow, UiTimeline } from '@neoverse-ui/vue';
import { defineComponent, h, type PropType, ref, type VNode } from 'vue';
import { type Locale, localize, localized, moduleCopy } from '../../content/playground-content';
import {
  checkbox,
  radioGroup as radioGroupSpecimen,
  switchControl as switchSpecimen,
} from '../../features/specimens/lab-interactive-specimens';

const previewProps = { locale: { type: String as PropType<Locale>, required: true } } as const;

export function breadcrumb(locale: Locale): VNode {
  return h(UiBreadcrumb, {
    ariaLabel: localize(localized('Documentation breadcrumb', '文档路径导航'), locale),
    // The sample lives inside the Design Lab route, so its links must not
    // navigate: the trail keeps real anchors for semantics and styling while
    // the click stays inert like the other specimen previews.
    onClick: (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest('a')) event.preventDefault();
    },
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

const ChoiceControlsPreview = defineComponent({
  props: previewProps,
  setup(props) {
    // The aggregate fixture reuses the same sessions as the individual leaves.
    const sessions = [
      checkbox.createSession(),
      radioGroupSpecimen.createSession(),
      switchSpecimen.createSession(),
    ];
    return () =>
      h(
        'div',
        { class: 'grid justify-items-start gap-3' },
        sessions.map((session) => session.render(props.locale)),
      );
  },
});

export function choiceControls(locale: Locale): VNode {
  return h(ChoiceControlsPreview, { locale });
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
