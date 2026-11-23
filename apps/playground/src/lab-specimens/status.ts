import {
  type BadgeProps,
  type BadgeVariant,
  type NoticeProps,
  type NoticeVariant,
  type SkeletonProps,
  type SkeletonVariant,
  type StatusIndicatorProps,
  type StatusIndicatorStatus,
  type ToastProps,
  type TooltipSurfaceProps,
  UiBadge,
  UiButton,
  UiNotice,
  UiSkeleton,
  UiStatusIndicator,
  UiToast,
  UiTooltipSurface,
} from '@neoverse-ui/vue';
import { h } from 'vue';
import { defineSpecimen } from '../lab-specimen-config';
import { type LocalizedText, localize, localized, moduleCopy } from '../playground-content';
import { sizeLabel, statusVariantOptions, variantLabel } from './shared';

const badgeCopy = moduleCopy.badge;
const badgeLabels: Record<BadgeVariant, LocalizedText> = {
  neutral: badgeCopy.controls.neutral,
  info: badgeCopy.controls.info,
  success: badgeCopy.controls.success,
  warning: badgeCopy.controls.warning,
  danger: badgeCopy.controls.danger,
};
const badgeSizeOptions = [
  { value: 'sm', label: badgeCopy.controls.small },
  { value: 'md', label: badgeCopy.controls.medium },
  { value: 'lg', label: badgeCopy.controls.large },
] as const;

/** The editable Badge specimen */
export const badge = defineSpecimen<BadgeProps>()({
  initialProps: { variant: 'neutral', size: 'sm' },
  initialState: () => ({}),
  controls: {
    props: {
      variant: { kind: 'select', label: variantLabel, options: statusVariantOptions },
      size: { kind: 'select', label: sizeLabel, options: badgeSizeOptions },
    },
  },
  render: ({ props, locale }) =>
    h(UiBadge, { ...props }, () => localize(badgeLabels[props.variant ?? 'neutral'], locale)),
});

const indicatorCopy = moduleCopy.statusIndicator;
const indicatorLabels: Record<StatusIndicatorStatus, LocalizedText> = {
  neutral: indicatorCopy.controls.neutral,
  info: indicatorCopy.controls.info,
  success: indicatorCopy.controls.success,
  warning: indicatorCopy.controls.warning,
  danger: indicatorCopy.controls.danger,
};
const indicatorSizeOptions = [
  { value: 'sm', label: indicatorCopy.controls.small },
  { value: 'md', label: indicatorCopy.controls.medium },
] as const;

/** The editable StatusIndicator specimen */
export const indicator = defineSpecimen<StatusIndicatorProps>()({
  initialProps: { status: 'neutral', size: 'sm', pulse: false, loading: false },
  initialState: () => ({}),
  controls: {
    props: {
      status: {
        kind: 'select',
        label: localized('Status', '状态'),
        options: statusVariantOptions,
      },
      size: { kind: 'select', label: sizeLabel, options: indicatorSizeOptions },
      pulse: { kind: 'boolean', label: localized('Pulse', '脉冲') },
      loading: { kind: 'boolean', label: localized('Loading', '加载中') },
    },
  },
  render: ({ props, locale }) =>
    h(UiStatusIndicator, { ...props }, () =>
      localize(indicatorLabels[props.status ?? 'neutral'], locale),
    ),
});

const skeletonCopy = moduleCopy.skeleton;
const skeletonVariantOptions = [
  { value: 'text', label: skeletonCopy.controls.text },
  { value: 'title', label: skeletonCopy.controls.title },
  { value: 'avatar', label: skeletonCopy.controls.avatar },
  { value: 'circle', label: skeletonCopy.controls.circle },
  { value: 'rect', label: skeletonCopy.controls.rect },
] as const;
const skeletonEffectOptions = [
  { value: 'shimmer', label: localized('Shimmer', '微光') },
  { value: 'pulse', label: skeletonCopy.controls.pulse },
  { value: 'none', label: skeletonCopy.controls.static },
] as const;

function skeletonSize(variant: SkeletonVariant | undefined): Record<string, string> {
  switch (variant) {
    case 'avatar':
      return { width: '3rem' };
    case 'circle':
      return { width: '4rem' };
    case 'rect':
      return { width: '12rem', height: '6rem', radius: 'var(--neoverse-radius-xl)' };
    default:
      return { width: '16rem' };
  }
}

/** The editable Skeleton specimen */
export const skeleton = defineSpecimen<SkeletonProps>()({
  initialProps: { variant: 'rect', effect: 'shimmer' },
  initialState: () => ({}),
  controls: {
    props: {
      variant: { kind: 'select', label: variantLabel, options: skeletonVariantOptions },
      effect: {
        kind: 'select',
        label: localized('Effect', '效果'),
        options: skeletonEffectOptions,
      },
    },
  },
  render: ({ props }) =>
    h('div', { class: 'grid w-full justify-items-center' }, [
      h(UiSkeleton, { ...props, ...skeletonSize(props.variant) }),
    ]),
});

const statusMessages: Record<NoticeVariant, LocalizedText> = {
  neutral: localized('A neutral notice for supporting context.', '用于补充上下文的中性提示。'),
  info: localized(
    'An informational notice keeps the next step visible.',
    '信息提示保持下一步可见。',
  ),
  success: localized('Changes were saved successfully.', '修改已成功保存。'),
  warning: localized('Review this warning before continuing.', '继续前请查看此警告。'),
  danger: localized('This action cannot be undone.', '此操作无法撤销。'),
};

/** The editable Notice specimen */
export const notice = defineSpecimen<Pick<NoticeProps, 'variant'>>()({
  initialProps: { variant: 'neutral' },
  initialState: () => ({}),
  controls: {
    props: {
      variant: { kind: 'select', label: variantLabel, options: statusVariantOptions },
    },
  },
  render: ({ props, locale }) =>
    h(UiNotice, { ...props }, () => localize(statusMessages[props.variant ?? 'neutral'], locale)),
});

const toastCopy = {
  trigger: localized('Show feedback', '显示反馈'),
  dismiss: localized('Dismiss notification', '关闭通知'),
  visible: localized('Visible', '可见'),
};

/** The editable Toast specimen */
export const toast = defineSpecimen<Pick<ToastProps, 'variant'>, { open: boolean }>()({
  initialProps: { variant: 'success' },
  initialState: () => ({ open: false }),
  controls: {
    props: {
      variant: { kind: 'select', label: variantLabel, options: statusVariantOptions },
    },
    state: { open: { kind: 'boolean', label: toastCopy.visible } },
  },
  render: ({ props, state, setState, locale }) =>
    h('div', { class: 'grid justify-items-center' }, [
      h(
        UiButton,
        {
          'data-toast-open': '',
          onClick: () => setState('open', true),
        },
        () => localize(toastCopy.trigger, locale),
      ),
      h(UiToast, {
        open: state.open,
        variant: props.variant ?? 'success',
        duration: 0,
        message: localize(statusMessages[props.variant ?? 'neutral'], locale),
        dismissLabel: localize(toastCopy.dismiss, locale),
        'onUpdate:open': (value: boolean) => setState('open', value),
      }),
    ]),
});

const tooltipCopy = {
  neutral: localized('Neutral tooltip surface', '中性工具提示表面'),
  accent: localized('Accent tooltip surface', '强调工具提示表面'),
};

/** The editable TooltipSurface specimen */
export const tooltip = defineSpecimen<TooltipSurfaceProps>()({
  initialProps: { variant: 'neutral' },
  initialState: () => ({}),
  controls: {
    props: {
      variant: {
        kind: 'select',
        label: variantLabel,
        options: [
          { value: 'neutral', label: localized('Neutral', '中性') },
          { value: 'accent', label: localized('Accent', '强调') },
        ],
      },
    },
  },
  render: ({ props, locale }) =>
    h(UiTooltipSurface, { ...props, role: 'tooltip' }, () =>
      localize(tooltipCopy[props.variant ?? 'neutral'], locale),
    ),
});
