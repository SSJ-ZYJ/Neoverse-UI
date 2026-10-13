<script setup lang="ts">
import {
  UiDisclosure,
  UiStatCard,
  UiStepFlow,
  UiSurface,
  UiTable,
  UiTimeline,
} from '@neoverse-ui/vue';
import LabSpecimenSection from '../LabSpecimenSection.vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, localized } from '../playground-content';
import DataDisplayVisualFixture from './DataDisplayVisualFixture.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const visualFixtureEnabled =
  new URLSearchParams(window.location.search).get('visual-fixture') === '1';
const milestones = [
  {
    id: 'design',
    title: 'Design / 设计',
    description: 'Shared visual contracts',
    time: '2026-10-01',
    dateTime: '2026-10-01',
  },
  {
    id: 'implementation',
    title: 'Implementation / 实现',
    description: 'Tokens → CSS → Vue adapters',
    time: '2026-10-09',
    dateTime: '2026-10-09',
  },
  {
    id: 'validation',
    title: 'Validation / 验收',
    description: 'Consumer and release evidence',
    time: '2026-10-12',
    dateTime: '2026-10-12',
  },
] as const;
const steps = [
  {
    id: 'plan',
    title: 'Plan / 规划',
    description: 'Define the contract',
    status: 'complete',
    statusLabel: 'Completed / 已完成',
  },
  {
    id: 'build',
    title: 'Build / 实现',
    description: 'Reuse the shared material',
    status: 'current',
    statusLabel: 'Current / 当前步骤',
  },
  {
    id: 'verify',
    title: 'Verify / 验证',
    description: 'Review real consumer evidence',
    status: 'pending',
    statusLabel: 'Pending / 待完成',
  },
] as const;
const copy = {
  table: {
    label: localized('Table', '表格'),
    description: localized(
      'Native table semantics sit inside a local overflow region with inset material hierarchy, striped rows, and quiet hover feedback.',
      '原生表格语义位于局部溢出区域中，并使用内嵌材质层级、斑马纹和克制的悬浮反馈。',
    ),
    caption: localized('Package compatibility matrix', '包兼容性矩阵'),
    columns: [
      localized('Package', '包'),
      localized('Runtime', '运行时'),
      localized('Status', '状态'),
    ],
    rows: [
      ['@neoverse-ui/vue', 'Vue 3.5+', localized('Ready', '可用')],
      ['@neoverse-ui/react', 'React 19', localized('Ready', '可用')],
      ['@neoverse-ui/tailwind', 'Tailwind CSS 4', localized('Ready', '可用')],
    ],
  },
  disclosure: {
    label: localized('Disclosure', '渐进披露'),
    description: localized(
      'Native details and summary semantics use the same inset material without an empty hairline shell.',
      '原生 details 与 summary 语义复用同一内嵌材质，不使用空洞的细描边外壳。',
    ),
    closed: localized('Implementation notes', '实现说明'),
    open: localized('Open-state contract', '展开状态契约'),
    closedBody: localized(
      'Consumers own the content; the shared component owns summary geometry, focus feedback, and state treatment.',
      '消费端负责内容，共享组件负责摘要几何、焦点反馈与状态表现。',
    ),
    openBody: localized(
      'Opening retains the Light material and rotates the indicator using shared spatial motion.',
      '展开后保持轻薄档材质，并使用共享空间动效旋转状态指示器。',
    ),
  },
} as const;
</script>

<template>
  <DataDisplayVisualFixture v-if="visualFixtureEnabled" :locale="props.locale" />
  <div v-else class="grid gap-grid">
    <LabSpecimenSection
      id="data-display-table"
      :title="localize(copy.table.label, props.locale)"
      :description="localize(copy.table.description, props.locale)"
    >
      <MaterialBackdrop edge="inset">
        <UiSurface surface="none" class="playground-data-table-surface rounded-card p-4">
          <UiTable
            :caption="localize(copy.table.caption, props.locale)"
            :aria-label="localize(copy.table.caption, props.locale)"
            data-data-display-table
          >
            <thead>
              <tr>
                <th v-for="column in copy.table.columns" :key="localize(column, props.locale)">
                  {{ localize(column, props.locale) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in copy.table.rows" :key="row[0]">
                <td>{{ row[0] }}</td>
                <td>{{ row[1] }}</td>
                <td>{{ localize(row[2], props.locale) }}</td>
              </tr>
            </tbody>
          </UiTable>
        </UiSurface>
      </MaterialBackdrop>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="data-display-disclosure"
      :title="localize(copy.disclosure.label, props.locale)"
      :description="localize(copy.disclosure.description, props.locale)"
    >
      <MaterialBackdrop edge="inset">
        <div class="grid items-start gap-3 md:grid-cols-2">
          <UiDisclosure
            :summary="localize(copy.disclosure.closed, props.locale)"
            data-data-display-disclosure="closed"
            data-contract-state="default"
          >
            <p class="text-body-sm text-secondary">
              {{ localize(copy.disclosure.closedBody, props.locale) }}
            </p>
          </UiDisclosure>
          <UiDisclosure
            :summary="localize(copy.disclosure.open, props.locale)"
            open
            data-data-display-disclosure="open"
            data-contract-state="open"
          >
            <p class="text-body-sm text-secondary">
              {{ localize(copy.disclosure.openBody, props.locale) }}
            </p>
          </UiDisclosure>
        </div>
      </MaterialBackdrop>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="data-display-stat-card"
      :title="localize(localized('Metric cards', '指标卡'), props.locale)"
      :description="localize(localized('Display typography on shared Glass surfaces; resize to compare two to four metrics.', '展示字体与共享 Glass 材质；调整宽度查看 2–4 个指标的布局。'), props.locale)"
    >
      <MaterialBackdrop edge="inset">
        <div class="ui-stat-grid">
          <UiStatCard
            label="Latency / 延迟"
            :value="0"
            unit="ms"
            footnote="Native value, including zero"
          />
          <UiStatCard label="Coverage / 覆盖率" :value="98.6" unit="%" trend="+2.4% this month" />
          <UiStatCard label="Packages / 包" :value="8" footnote="Shared design system" />
          <UiStatCard label="Consumers / 消费项目" :value="4" trend="Vue presentation primitives" />
        </div>
      </MaterialBackdrop>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="data-display-timeline"
      :title="localize(localized('Timeline', '时间线'), props.locale)"
      :description="localize(localized('Continuous vertical milestones with native list and date semantics.', '连续垂直里程碑，保留原生列表和日期语义。'), props.locale)"
    >
      <MaterialBackdrop edge="inset">
        <UiTimeline
          :items="milestones"
          :aria-label="localize(localized('Milestones', '里程碑'), props.locale)"
        />
      </MaterialBackdrop>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="data-display-step-flow"
      :title="localize(localized('Step flow', '步骤流'), props.locale)"
      :description="localize(localized('Numbered steps with consumer-owned state and container-responsive layout.', '编号步骤由消费端管理状态，并随容器宽度自适应。'), props.locale)"
    >
      <MaterialBackdrop edge="inset">
        <UiStepFlow
          :items="steps"
          :aria-label="localize(localized('Delivery steps', '交付步骤'), props.locale)"
        />
      </MaterialBackdrop>
    </LabSpecimenSection>
  </div>
</template>
