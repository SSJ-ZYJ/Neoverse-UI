<script setup lang="ts">
import { UiButton, UiNotice, UiTooltipSurface } from '@neoverse-ui/vue';
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { localize, localized, moduleCopy } from '../playground-content';
import QaPreviewMatrix from '../QaPreviewMatrix.vue';
import BadgeModule from './BadgeModule.vue';
import SkeletonModule from './SkeletonModule.vue';
import StatusIndicatorModule from './StatusIndicatorModule.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const noticeVariants = ['neutral', 'info', 'success', 'warning', 'danger'] as const;
const copy = {
  notice: {
    label: localized('Notice', '提示'),
    description: localized(
      'Semantic feedback keeps content and optional actions in one stable layout.',
      '语义反馈将内容与可选操作保持在统一、稳定的布局中。',
    ),
    action: localized('Review', '查看'),
    messages: {
      neutral: localized('A neutral notice for supporting context.', '用于补充上下文的中性提示。'),
      info: localized(
        'A new design-system validation report is available.',
        '新的设计系统校验报告已生成。',
      ),
      success: localized(
        'All component contracts passed the focused checks.',
        '所有组件契约均通过了聚焦检查。',
      ),
      warning: localized(
        'This component state needs review before shipping.',
        '该组件状态需要在发布前完成复核。',
      ),
      danger: localized(
        'The consumer contract is incompatible with the current component state.',
        '消费端契约与当前组件状态不兼容。',
      ),
    },
  },
  tooltip: {
    label: localized('TooltipSurface', '工具提示表面'),
    description: localized(
      'TooltipSurface owns the visual plate only; positioning, trigger state, and disclosure semantics stay with the consumer.',
      'TooltipSurface 只负责视觉表面；定位、触发状态与显示语义仍由消费端负责。',
    ),
    neutral: localized('Neutral tooltip surface', '中性工具提示表面'),
    accent: localized('Accent tooltip surface', '强调工具提示表面'),
  },
} as const;
</script>

<template>
  <div class="grid gap-grid">
    <LabSpecimenSection
      id="status-feedback-badge"
      :title="localize(moduleCopy.badge.label, props.locale)"
      :description="localize(moduleCopy.badge.description, props.locale)"
    >
      <BadgeModule :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="status-feedback-indicator"
      :title="localize(moduleCopy.statusIndicator.label, props.locale)"
      :description="localize(moduleCopy.statusIndicator.description, props.locale)"
    >
      <StatusIndicatorModule :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="status-feedback-skeleton"
      :title="localize(moduleCopy.skeleton.label, props.locale)"
      :description="localize(moduleCopy.skeleton.description, props.locale)"
    >
      <SkeletonModule :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="status-feedback-notice"
      :title="localize(copy.notice.label, props.locale)"
      :description="localize(copy.notice.description, props.locale)"
    >
      <div class="grid gap-2">
        <UiNotice
          v-for="variant in noticeVariants"
          :key="variant"
          :variant="variant"
          :as="variant === 'success' ? 'section' : 'div'"
          :role="variant === 'success' ? 'status' : undefined"
        >
          {{ localize(copy.notice.messages[variant], props.locale) }}
          <template v-if="variant === 'info'" #action>
            <UiButton size="sm" variant="ghost" surface="none">
              {{ localize(copy.notice.action, props.locale) }}
            </UiButton>
          </template>
        </UiNotice>
      </div>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="status-feedback-tooltip"
      :title="localize(copy.tooltip.label, props.locale)"
      :description="localize(copy.tooltip.description, props.locale)"
    >
      <QaPreviewMatrix :locale="props.locale">
        <UiTooltipSurface variant="neutral" role="tooltip">
          {{ localize(copy.tooltip.neutral, props.locale) }}
        </UiTooltipSurface>
        <UiTooltipSurface variant="accent" role="tooltip">
          {{ localize(copy.tooltip.accent, props.locale) }}
        </UiTooltipSurface>
      </QaPreviewMatrix>
    </LabSpecimenSection>
  </div>
</template>
