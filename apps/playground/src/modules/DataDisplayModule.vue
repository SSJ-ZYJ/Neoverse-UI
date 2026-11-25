<script setup lang="ts">
import {
  UiAvatar,
  UiDisclosure,
  UiPagination,
  UiStatCard,
  UiStepFlow,
  UiSurface,
  UiTable,
  UiTabs,
  UiTimeline,
} from '@neoverse-ui/vue';
import { ref } from 'vue';
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { lazyComponent } from '../lazy-component';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, localized } from '../playground-content';
import EmptyStatePreview from '../previews/EmptyStatePreview.vue';
import type { LabModuleProps } from './types';

const DataDisplayVisualFixture = lazyComponent(() => import('./DataDisplayVisualFixture.vue'));

const props = defineProps<LabModuleProps>();
const selectedTab = ref('overview');
const currentPage = ref(4);
const avatarName = 'Shenshijun';
const avatarFallback = 'SSJ';
const tabOptions = [
  { value: 'overview', label: 'Overview / 概览' },
  { value: 'disabled', label: 'Disabled / 未启用', disabled: true },
  { value: 'activity', label: 'Activity / 动态' },
] as const;
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
      id="data-display-tabs"
      :title="localize(localized('Tabs', '标签页'), props.locale)"
      :description="
        localize(
          localized(
            'Keyboard tabs with a labelled panel and an existing Glass surface.',
            '键盘可操作的标签页，共享玻璃材质并关联内容面板。',
          ),
          props.locale,
        )
      "
    >
      <UiTabs
        v-model="selectedTab"
        :options="tabOptions"
        v-bind="{ ariaLabel: localize(localized('Member sections', '成员页面分区'), props.locale) }"
        v-slot="{ value }"
        data-tabs-sample
      >
        <p class="text-body-sm text-secondary" data-tabs-panel-state>{{ value }}</p>
      </UiTabs>
    </LabSpecimenSection>
    <LabSpecimenSection
      id="data-display-avatar"
      :title="localize(localized('Avatar', '头像'), props.locale)"
      :description="
        localize(
          localized(
            'Image or initials with accessible identity, size and circle or rounded-square shapes.',
            '支持图片、首字母回退、多种尺寸与圆形或圆角方形样式。',
          ),
          props.locale,
        )
      "
    >
      <div class="flex flex-wrap items-center gap-3">
        <UiAvatar :name="avatarName" :fallback="avatarFallback" size="sm" data-avatar-rounded />
        <UiAvatar :name="avatarName" :fallback="avatarFallback" size="md" />
        <UiAvatar :name="avatarName" :fallback="avatarFallback" size="lg" />
        <UiAvatar :name="avatarName" :fallback="avatarFallback" size="sm" shape="circle" />
        <UiAvatar
          :name="avatarName"
          :fallback="avatarFallback"
          size="md"
          shape="circle"
          data-avatar-sample
        />
        <UiAvatar :name="avatarName" :fallback="avatarFallback" size="lg" shape="circle" />
        <UiAvatar name="Anonymous" placeholder="icon" size="md" shape="circle" data-avatar-icon />
        <UiAvatar name="Anonymous" placeholder="icon" size="lg" data-avatar-icon />
      </div>
    </LabSpecimenSection>
    <LabSpecimenSection
      id="data-display-pagination"
      :title="localize(localized('Pagination', '分页'), props.locale)"
      :description="
        localize(
          localized(
            'Go from page 5 to 6 to see the compact range reflow.',
            '从第 5 页翻到第 6 页，观察折叠页码平滑重排。',
          ),
          props.locale,
        )
      "
    >
      <UiPagination
        v-model:page="currentPage"
        :total-pages="18"
        v-bind="{
          ariaLabel: localize(localized('Member list pages', '成员列表页码'), props.locale),
        }"
        :previous-label="localize(localized('Previous page', '上一页'), props.locale)"
        :next-label="localize(localized('Next page', '下一页'), props.locale)"
        :page-label="localize(localized('Page', '第'), props.locale)"
        data-pagination-sample
      />
    </LabSpecimenSection>
    <LabSpecimenSection
      id="data-display-table"
      :title="localize(copy.table.label, props.locale)"
      :description="localize(copy.table.description, props.locale)"
    >
      <!-- The caption names the table from the section surface. Inside the
           material backdrop it sat on the optical test field, so the label read
           as a strip of the table plate instead of a label above it. -->
      <div class="grid min-w-0 gap-2">
        <p class="text-caption font-semibold text-secondary">
          {{ localize(copy.table.caption, props.locale) }}
        </p>
        <MaterialBackdrop edge="inset">
          <UiSurface surface="none" class="playground-data-table-surface rounded-card p-4">
            <UiTable
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
      </div>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="data-display-empty-state"
      :title="localize(localized('Empty state', '空状态'), props.locale)"
      :description="
        localize(
          localized(
            'Compare onboarding, filtered results, passive activity, and restricted access.',
            '对照首次使用、筛选无结果、暂无活动与权限受限四种场景。',
          ),
          props.locale,
        )
      "
    >
      <EmptyStatePreview :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="data-display-disclosure"
      :title="localize(copy.disclosure.label, props.locale)"
      :description="localize(copy.disclosure.description, props.locale)"
    >
      <MaterialBackdrop edge="inset">
        <div class="playground-preview-columns">
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
      :description="
        localize(
          localized(
            'Display typography on shared Aurora Glass surfaces; resize to compare two to four metrics.',
            '展示字体与共享极光玻璃；调整宽度查看 2–4 个指标的布局。',
          ),
          props.locale,
        )
      "
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
      :description="
        localize(
          localized(
            'Aurora Glass milestones with a continuous rail and dates leading each entry.',
            '极光玻璃节点沿连续轨道排列，日期先于标题呈现。',
          ),
          props.locale,
        )
      "
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
      :description="
        localize(
          localized(
            'Aurora Glass steps distinguish completed, current and upcoming stages, adapting to the available width.',
            '极光玻璃步骤区分已完成、当前与待完成阶段，并随可用宽度调整排列。',
          ),
          props.locale,
        )
      "
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
