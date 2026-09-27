<script setup lang="ts">
import { UiButton, UiNotice, UiTooltipSurface } from '@neoverse-ui/vue';
import { localize, localized, moduleCopy } from '../playground-content';
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
        'This compatibility path remains available but should not be used for new work.',
        '该兼容路径仍可使用，但新实现不应继续依赖它。',
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
    <section
      id="status-feedback-badge"
      class="scroll-mt-24 grid gap-3"
      aria-labelledby="status-feedback-badge-title"
    >
      <header class="grid gap-1">
        <h3 id="status-feedback-badge-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.badge.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.badge.description, props.locale) }}
        </p>
      </header>
      <BadgeModule :locale="props.locale" />
    </section>

    <section
      id="status-feedback-indicator"
      class="scroll-mt-24 grid gap-3"
      aria-labelledby="status-feedback-indicator-title"
    >
      <header class="grid gap-1">
        <h3
          id="status-feedback-indicator-title"
          class="text-subtitle font-heading tracking-heading"
        >
          {{ localize(moduleCopy.statusIndicator.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.statusIndicator.description, props.locale) }}
        </p>
      </header>
      <StatusIndicatorModule :locale="props.locale" />
    </section>

    <section
      id="status-feedback-skeleton"
      class="scroll-mt-24 grid gap-3"
      aria-labelledby="status-feedback-skeleton-title"
    >
      <header class="grid gap-1">
        <h3 id="status-feedback-skeleton-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.skeleton.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.skeleton.description, props.locale) }}
        </p>
      </header>
      <SkeletonModule :locale="props.locale" />
    </section>

    <section
      id="status-feedback-notice"
      class="scroll-mt-24 grid gap-3"
      aria-labelledby="status-feedback-notice-title"
    >
      <header class="grid gap-1">
        <h3 id="status-feedback-notice-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(copy.notice.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(copy.notice.description, props.locale) }}
        </p>
      </header>
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
    </section>

    <section
      id="status-feedback-tooltip"
      class="scroll-mt-24 grid gap-3"
      aria-labelledby="status-feedback-tooltip-title"
    >
      <header class="grid gap-1">
        <h3 id="status-feedback-tooltip-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(copy.tooltip.label, props.locale) }}
        </h3>
        <p class="max-w-container-lg text-caption text-secondary">
          {{ localize(copy.tooltip.description, props.locale) }}
        </p>
      </header>
      <div class="flex flex-wrap items-center gap-3 rounded-card bg-surface-subtle p-4">
        <UiTooltipSurface variant="neutral" role="tooltip">
          {{ localize(copy.tooltip.neutral, props.locale) }}
        </UiTooltipSurface>
        <UiTooltipSurface variant="accent" role="tooltip">
          {{ localize(copy.tooltip.accent, props.locale) }}
        </UiTooltipSurface>
      </div>
    </section>
  </div>
</template>
