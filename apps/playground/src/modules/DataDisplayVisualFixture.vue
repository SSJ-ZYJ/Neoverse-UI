<script setup lang="ts">
import type { StatCardProps, StepFlowItem, TimelineItem } from '@neoverse-ui/vue';
import { UiStatCard, UiStepFlow, UiTimeline } from '@neoverse-ui/vue';
import { computed } from 'vue';
import LabSpecimenSection from '../LabSpecimenSection.vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { type LocalizedText, localize, localized } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();

type VisualMetric = {
  label: LocalizedText;
  value: number;
  unit?: string;
  footnote?: LocalizedText;
  trend?: LocalizedText;
};

const minimumMetrics: readonly VisualMetric[] = [
  {
    label: localized(
      'Average response time across all supported browsers',
      '所有受支持浏览器中的平均响应时间',
    ),
    value: 14,
    unit: 'ms',
    footnote: localized('Median across the release validation run', '发布验收运行中的中位数'),
  },
  {
    label: localized('Builds', '构建次数'),
    value: 128,
    trend: localized('+12 this week', '本周增加 12 次'),
  },
] as const;

const maximumMetrics: readonly VisualMetric[] = [
  {
    label: localized('Latency', '延迟'),
    value: 14,
    unit: 'ms',
    footnote: localized('Median response time', '平均响应时间'),
  },
  {
    label: localized('Coverage', '覆盖率'),
    value: 98.6,
    unit: '%',
    trend: localized('+2.4% this month', '本月增加 2.4%'),
  },
  {
    label: localized('Published packages', '已发布包'),
    value: 8,
    footnote: localized('Shared design system', '共享设计系统'),
  },
  {
    label: localized(
      'Consumer projects validated across Vue and React',
      '已在 Vue 与 React 消费项目中完成验收',
    ),
    value: 4,
    footnote: localized(
      'Long supporting copy stays readable as the card wraps inside a narrow grid column.',
      '较长的补充说明会随卡片网格列宽自然换行并保持可读。',
    ),
  },
] as const;

const statCardProps = (metric: VisualMetric): StatCardProps => ({
  label: localize(metric.label, props.locale),
  value: metric.value,
  ...(metric.unit === undefined ? {} : { unit: metric.unit }),
  ...(metric.footnote === undefined ? {} : { footnote: localize(metric.footnote, props.locale) }),
  ...(metric.trend === undefined ? {} : { trend: localize(metric.trend, props.locale) }),
});

const minimumTimelineContent = [
  {
    id: 'design',
    title: localized('Design contract', '设计契约'),
    description: localized(
      'Shared tokens and consumer requirements are agreed.',
      '共享 Token 与消费需求已确认。',
    ),
    time: '2026-10-01',
  },
  {
    id: 'review',
    title: localized('Visual review', '视觉验收'),
    description: localized(
      'The final milestone has no trailing connector.',
      '最后一个里程碑不会绘制多余的尾部连接线。',
    ),
    time: '2026-10-13',
  },
] as const;

const maximumTimelineContent = [
  {
    id: 'request',
    title: localized('Consumer request', '消费需求'),
    description: localized('The shared need is accepted.', '共享能力需求已审核。'),
    time: '2026-10-01',
  },
  {
    id: 'contract',
    title: localized('Contract review', '契约审核'),
    description: localized('API and status semantics are recorded.', 'API 与状态语义已记录。'),
    time: '2026-10-03',
  },
  {
    id: 'tokens',
    title: localized('Semantic tokens', '语义 Token'),
    description: localized('Theme roles are mapped.', '主题角色已映射。'),
    time: '2026-10-05',
  },
  {
    id: 'components',
    title: localized('Component implementation', '组件实现'),
    description: localized(
      'This longer milestone description wraps over several lines while its timeline connector remains centered between both nodes.',
      '这条较长的里程碑说明会换成多行，时间线连接线仍应保持在相邻节点的中心位置。',
    ),
    time: '2026-10-07',
  },
  {
    id: 'adapters',
    title: localized('Framework adapters', '框架适配器'),
    description: localized('Public exports are checked.', '公开导出已检查。'),
    time: '2026-10-08',
  },
  {
    id: 'playground',
    title: localized('Design Lab examples', 'Design Lab 示例'),
    description: localized('Consumer-facing examples are prepared.', '消费示例已准备。'),
    time: '2026-10-09',
  },
  {
    id: 'unit-tests',
    title: localized('Component behavior', '组件行为'),
    description: localized('Value and state updates are verified.', '数值与状态更新已验证。'),
    time: '2026-10-10',
  },
  {
    id: 'consumer',
    title: localized('Real consumer integration', '真实消费接入'),
    description: localized(
      'The package is rendered in a presentation project.',
      '组件已在演示文稿项目中渲染。',
    ),
    time: '2026-10-11',
  },
  {
    id: 'visual-review',
    title: localized('Light and dark review', '浅色与深色审阅'),
    description: localized('Desktop and narrow layouts are reviewed.', '桌面与窄屏布局已审阅。'),
    time: '2026-10-12',
  },
  {
    id: 'release',
    title: localized('Release evidence', '发布证据'),
    description: localized(
      'Screenshots and consumer results are recorded.',
      '截图与消费结果已记录。',
    ),
    time: '2026-10-13',
  },
] as const;

const minimumStepsContent = [
  {
    id: 'prepare',
    title: localized('Prepare', '准备'),
    description: localized('A completed first step.', '已完成的第一步。'),
    status: 'complete',
    statusLabel: localized('Completed', '已完成'),
  },
  {
    id: 'review',
    title: localized('Review in a narrow container', '在窄容器中审阅'),
    description: localized(
      'Long step descriptions wrap below the marker without crossing the vertical connector.',
      '较长的步骤说明会在标记下方自然换行，不会与纵向连接线交叠。',
    ),
    status: 'current',
    statusLabel: localized('Current step', '当前步骤'),
  },
] as const;

const maximumStepsContent = [
  {
    id: 'scope',
    title: localized('Scope', '范围'),
    description: localized('Confirm the shared use case.', '确认共享使用场景。'),
    status: 'complete',
    statusLabel: localized('Completed', '已完成'),
  },
  {
    id: 'design',
    title: localized('Design', '设计'),
    description: localized('Reuse the existing tokens.', '复用已有 Token。'),
    status: 'complete',
    statusLabel: localized('Completed', '已完成'),
  },
  {
    id: 'build',
    title: localized('Build and integrate', '构建并接入'),
    description: localized(
      'The current step is visible while the horizontal connector crosses the center of every marker.',
      '当前步骤保持清晰可见，横向连接线穿过每个标记的中心。',
    ),
    status: 'current',
    statusLabel: localized('Current step', '当前步骤'),
  },
  {
    id: 'behavior',
    title: localized('Behavior', '行为验收'),
    description: localized('Check ordered state changes.', '检查有序状态变化。'),
    status: 'pending',
    statusLabel: localized('Pending', '待完成'),
  },
  {
    id: 'layout',
    title: localized('Responsive layout', '响应式布局'),
    description: localized('Compare wide and narrow containers.', '比较宽窄容器。'),
    status: 'pending',
    statusLabel: localized('Pending', '待完成'),
  },
  {
    id: 'release',
    title: localized('Release evidence', '发布证据'),
    description: localized('Review screenshots in both themes.', '审阅两种主题下的截图。'),
    status: 'pending',
    statusLabel: localized('Pending', '待完成'),
  },
] as const;

const minimumTimeline = computed<readonly TimelineItem[]>(() =>
  minimumTimelineContent.map((item) => ({
    ...item,
    title: localize(item.title, props.locale),
    description: localize(item.description, props.locale),
  })),
);
const maximumTimeline = computed<readonly TimelineItem[]>(() =>
  maximumTimelineContent.map((item) => ({
    ...item,
    title: localize(item.title, props.locale),
    description: localize(item.description, props.locale),
  })),
);
const minimumSteps = computed<readonly StepFlowItem[]>(() =>
  minimumStepsContent.map((item) => ({
    ...item,
    title: localize(item.title, props.locale),
    description: localize(item.description, props.locale),
    statusLabel: localize(item.statusLabel, props.locale),
  })),
);
const maximumSteps = computed<readonly StepFlowItem[]>(() =>
  maximumStepsContent.map((item) => ({
    ...item,
    title: localize(item.title, props.locale),
    description: localize(item.description, props.locale),
    statusLabel: localize(item.statusLabel, props.locale),
  })),
);

const copy = {
  metric: {
    title: localized('Metric cards', '指标卡'),
    description: localized(
      'Two and four metric cards exercise wrapping, Aurora Glass edges, and readable supporting text.',
      '两项与四项指标用于检查换行、极光玻璃边缘与补充文字可读性。',
    ),
    minimum: localized('Two metrics · narrow container', '两项指标 · 窄容器'),
    maximum: localized('Four metrics · wide container', '四项指标 · 宽容器'),
  },
  timeline: {
    title: localized('Timeline', '时间线'),
    description: localized(
      'Two and ten milestones exercise the first and last connector boundaries, long text, and narrow layout.',
      '两项与十项里程碑用于检查首尾连接边界、长文本与窄屏布局。',
    ),
    minimum: localized('Two milestones · narrow container', '两项里程碑 · 窄容器'),
    maximum: localized('Ten milestones · long content', '十项里程碑 · 长内容'),
    minimumAria: localized('Two milestone timeline', '两项里程碑时间线'),
    maximumAria: localized('Ten milestone timeline', '十项里程碑时间线'),
  },
  steps: {
    title: localized('Step flow', '步骤流'),
    description: localized(
      'Two and six steps exercise narrow vertical and wide horizontal connectors.',
      '两步与六步流程用于检查窄屏纵线与宽屏横线。',
    ),
    minimum: localized('Two steps · narrow container', '两步 · 窄容器'),
    maximum: localized('Six steps · wide container', '六步 · 宽容器'),
    minimumAria: localized('Two delivery steps', '两步交付流程'),
    maximumAria: localized('Six delivery steps', '六步交付流程'),
  },
} as const;
</script>

<template>
  <div class="grid gap-grid" data-presentation-visual-fixture>
    <LabSpecimenSection
      id="data-display-stat-card"
      :title="localize(copy.metric.title, props.locale)"
      :description="localize(copy.metric.description, props.locale)"
    >
      <MaterialBackdrop edge="inset">
        <div class="grid gap-grid">
          <section class="grid min-w-0 gap-2 max-w-container-sm" data-stat-variation="minimum">
            <h4 class="text-body-sm font-label text-secondary">
              {{ localize(copy.metric.minimum, props.locale) }}
            </h4>
            <div class="ui-stat-grid">
              <UiStatCard
                v-for="metric in minimumMetrics"
                :key="metric.label.en"
                v-bind="statCardProps(metric)"
              />
            </div>
          </section>
          <section class="grid min-w-0 gap-2" data-stat-variation="maximum">
            <h4 class="text-body-sm font-label text-secondary">
              {{ localize(copy.metric.maximum, props.locale) }}
            </h4>
            <div class="ui-stat-grid">
              <UiStatCard
                v-for="metric in maximumMetrics"
                :key="metric.label.en"
                v-bind="statCardProps(metric)"
              />
            </div>
          </section>
        </div>
      </MaterialBackdrop>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="data-display-timeline"
      :title="localize(copy.timeline.title, props.locale)"
      :description="localize(copy.timeline.description, props.locale)"
    >
      <MaterialBackdrop edge="inset">
        <div class="grid gap-grid">
          <section class="grid min-w-0 gap-2 max-w-container-sm" data-timeline-variation="minimum">
            <h4 class="text-body-sm font-label text-secondary">
              {{ localize(copy.timeline.minimum, props.locale) }}
            </h4>
            <UiTimeline
              :items="minimumTimeline"
              :aria-label="localize(copy.timeline.minimumAria, props.locale)"
            />
          </section>
          <section class="grid min-w-0 gap-2" data-timeline-variation="maximum">
            <h4 class="text-body-sm font-label text-secondary">
              {{ localize(copy.timeline.maximum, props.locale) }}
            </h4>
            <UiTimeline
              :items="maximumTimeline"
              :aria-label="localize(copy.timeline.maximumAria, props.locale)"
            />
          </section>
        </div>
      </MaterialBackdrop>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="data-display-step-flow"
      :title="localize(copy.steps.title, props.locale)"
      :description="localize(copy.steps.description, props.locale)"
    >
      <MaterialBackdrop edge="inset">
        <div class="grid gap-grid">
          <section class="grid min-w-0 gap-2 max-w-container-sm" data-step-variation="minimum">
            <h4 class="text-body-sm font-label text-secondary">
              {{ localize(copy.steps.minimum, props.locale) }}
            </h4>
            <UiStepFlow
              :items="minimumSteps"
              :aria-label="localize(copy.steps.minimumAria, props.locale)"
            />
          </section>
          <section class="grid min-w-0 gap-2" data-step-variation="maximum">
            <h4 class="text-body-sm font-label text-secondary">
              {{ localize(copy.steps.maximum, props.locale) }}
            </h4>
            <UiStepFlow
              :items="maximumSteps"
              :aria-label="localize(copy.steps.maximumAria, props.locale)"
            />
          </section>
        </div>
      </MaterialBackdrop>
    </LabSpecimenSection>
  </div>
</template>
