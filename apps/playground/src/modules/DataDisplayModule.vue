<script setup lang="ts">
import { UiDisclosure, UiSurface, UiTable } from '@neoverse-ui/vue';
import LabSpecimenSection from '../LabSpecimenSection.vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, localized } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
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
      'Opening increases material density and rotates the indicator using the shared spatial motion role.',
      '展开后提升材质密度，并使用共享空间动效角色旋转状态指示器。',
    ),
  },
} as const;
</script>

<template>
  <div class="grid gap-grid">
    <LabSpecimenSection
      id="data-display-table"
      :title="localize(copy.table.label, props.locale)"
      :description="localize(copy.table.description, props.locale)"
    >
      <MaterialBackdrop edge="inset">
        <UiSurface surface="glass-elevated" class="playground-data-table-surface rounded-card p-4">
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
            class="material-glass-elevated playground-data-disclosure"
            data-surface="glass-elevated"
            data-neoverse-surface-overflow="visible"
            :summary="localize(copy.disclosure.closed, props.locale)"
            data-data-display-disclosure="closed"
          >
            <p class="text-body-sm text-secondary">
              {{ localize(copy.disclosure.closedBody, props.locale) }}
            </p>
          </UiDisclosure>
          <UiDisclosure
            class="material-glass-elevated playground-data-disclosure"
            data-surface="glass-elevated"
            data-neoverse-surface-overflow="visible"
            :summary="localize(copy.disclosure.open, props.locale)"
            open
            data-data-display-disclosure="open"
          >
            <p class="text-body-sm text-secondary">
              {{ localize(copy.disclosure.openBody, props.locale) }}
            </p>
          </UiDisclosure>
        </div>
      </MaterialBackdrop>
    </LabSpecimenSection>
  </div>
</template>
