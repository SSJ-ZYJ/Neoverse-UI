import type {
  PageTransitionDirection,
  PageTransitionVariant,
  PresenceFallback,
  PresenceVariant,
} from '@neoverse-ui/motion';
import type { ButtonSize } from '@neoverse-ui/vue';
import { h } from 'vue';
import { lazyComponent, withPreload } from '../../app/lazy-component';
import { localized } from '../../content/playground-content';
import { defineSpecimen } from './lab-specimen-config';
import { sizeLabel, sizeOptions } from './shared';

const MotionDisclosureExample = lazyComponent(
  () => import('../../catalogue/motion/MotionDisclosureExample.vue'),
);
const MotionPageExample = lazyComponent(
  () => import('../../catalogue/motion/MotionPageExample.vue'),
);
const MotionPlaygroundExample = lazyComponent(
  () => import('../../catalogue/motion/MotionPlaygroundExample.vue'),
);
const MotionPresenceExample = lazyComponent(
  () => import('../../catalogue/motion/MotionPresenceExample.vue'),
);
const MotionPrimitivesExample = lazyComponent(
  () => import('../../catalogue/motion/MotionPrimitivesExample.vue'),
);
const MotionStaggerExample = lazyComponent(
  () => import('../../catalogue/motion/MotionStaggerExample.vue'),
);

export interface MotionTokensSpecimenProps {
  category: 'all' | 'durations' | 'easings' | 'distances';
}

/** Interactive Motion tokens specimen */
export const motionTokens = withPreload(
  defineSpecimen<MotionTokensSpecimenProps>()({
    initialProps: { category: 'all' },
    initialState: () => ({}),
    controls: {
      props: {
        category: {
          kind: 'select',
          label: localized('Category', '令牌分类'),
          options: [
            { value: 'all', label: localized('All token groups', '全部分类') },
            { value: 'durations', label: localized('Durations', '时长') },
            { value: 'easings', label: localized('Easings', '缓动') },
            { value: 'distances', label: localized('Distances', '行程') },
          ],
        },
      },
    },
    render: ({ props, locale }) =>
      h(MotionPrimitivesExample, { category: props.category ?? 'all', locale }),
  }),
  MotionPrimitivesExample,
);

export interface MotionPresenceSpecimenProps {
  category: 'all' | 'helper' | 'component' | 'stagger';
  fallback: 'full' | PresenceFallback;
  preset: PresenceVariant;
  visible: boolean;
}

/** Interactive Presence and stagger list specimen */
export const motionPresence = withPreload(
  defineSpecimen<MotionPresenceSpecimenProps>()({
    initialProps: {
      category: 'all',
      fallback: 'full',
      preset: 'veil',
      visible: true,
    },
    initialState: () => ({}),
    controls: {
      props: {
        category: {
          kind: 'select',
          label: localized('Category', '演示分类'),
          options: [
            { value: 'all', label: localized('All categories', '全部分类') },
            { value: 'helper', label: localized('Transition helper (presets)', '过渡辅助函数') },
            { value: 'component', label: localized('<UiPresence> component', 'Presence 组件') },
            { value: 'stagger', label: localized('Staggered list reorder', '交错列表重排') },
          ],
        },
        preset: {
          kind: 'select',
          label: localized('Preset', '入场预设'),
          options: [
            { value: 'fade', label: localized('fade', 'fade') },
            { value: 'rise', label: localized('rise', 'rise') },
            { value: 'sink', label: localized('sink', 'sink') },
            { value: 'pop', label: localized('pop', 'pop') },
            { value: 'veil', label: localized('veil', 'veil') },
            { value: 'bloom', label: localized('bloom', 'bloom') },
            { value: 'haze', label: localized('haze', 'haze') },
            { value: 'sway', label: localized('sway', 'sway') },
            { value: 'spring', label: localized('spring', 'spring') },
            { value: 'slide-start', label: localized('slide-start', 'slide-start') },
            { value: 'slide-end', label: localized('slide-end', 'slide-end') },
          ],
        },
        fallback: {
          kind: 'select',
          label: localized('Fallback profile', '回退档位'),
          options: [
            { value: 'full', label: localized('Full motion', '完整动效') },
            { value: 'no-filter', label: localized('No filter', '无滤镜') },
            { value: 'fade-only', label: localized('Fade only', '仅淡入') },
          ],
        },
        visible: {
          kind: 'boolean',
          label: localized('Visible', '显示元素'),
        },
      },
    },
    render: ({ props, locale }) => {
      const category = props.category ?? 'all';
      const fallback = props.fallback ?? 'full';
      const preset = props.preset ?? 'veil';
      const visible = props.visible ?? true;

      if (category === 'stagger') {
        return h(MotionStaggerExample, { locale });
      }
      if (category === 'all') {
        return h('div', { class: 'grid w-full min-w-0 gap-4' }, [
          h(MotionPresenceExample, {
            locale,
            category: 'all',
            fallback,
            preset,
            visible,
            inlineControls: false,
          }),
          h(MotionStaggerExample, { locale }),
        ]);
      }
      return h(MotionPresenceExample, {
        locale,
        category,
        fallback,
        preset,
        visible,
        inlineControls: false,
      });
    },
  }),
  [MotionPresenceExample, MotionStaggerExample],
);

export interface MotionTransitionsSpecimenProps {
  category: 'all' | 'theme' | 'width' | 'size';
  size: ButtonSize;
}

/** Interactive Theme, width and control sizing transition specimen */
export const motionPlayground = withPreload(
  defineSpecimen<MotionTransitionsSpecimenProps>()({
    initialProps: { category: 'all', size: 'sm' },
    initialState: () => ({}),
    controls: {
      props: {
        category: {
          kind: 'select',
          label: localized('Category', '演示分类'),
          options: [
            { value: 'all', label: localized('All categories', '全部分类') },
            { value: 'theme', label: localized('Theme transitions', '主题切换光学揭示') },
            { value: 'width', label: localized('Layout width group', '语言宽度协同缩放') },
            { value: 'size', label: localized('Control sizing', '控件尺寸过渡') },
          ],
        },
        size: {
          kind: 'select',
          label: sizeLabel,
          options: sizeOptions,
        },
      },
    },
    render: ({ props, locale }) =>
      h(MotionPlaygroundExample, {
        category: props.category ?? 'all',
        size: props.size ?? 'sm',
        locale,
        inlineControls: false,
      }),
  }),
  MotionPlaygroundExample,
);

export interface MotionDisclosureSpecimenProps {
  expanded: boolean;
  animate: boolean;
}

/** Interactive Disclosure height animation specimen */
export const motionDisclosure = withPreload(
  defineSpecimen<MotionDisclosureSpecimenProps>()({
    initialProps: { expanded: true, animate: true },
    initialState: () => ({}),
    controls: {
      props: {
        expanded: { kind: 'boolean', label: localized('Expanded', '展开列表') },
        animate: { kind: 'boolean', label: localized('Animate height', '启用高度动画') },
      },
    },
    render: ({ props, locale }) =>
      h(MotionDisclosureExample, {
        expanded: props.expanded ?? true,
        animate: props.animate ?? true,
        locale,
      }),
  }),
  MotionDisclosureExample,
);

export interface MotionPageSpecimenProps {
  category: 'all' | 'standard' | 'dissolve';
  variant: Exclude<PageTransitionVariant, 'dissolve'>;
  direction: PageTransitionDirection;
  transitionScope: 'region' | 'document';
  background: 'shared' | 'surface';
  pipeline: 'auto' | 'capture' | 'synthetic' | 'crossfade';
}

/** Interactive Page transition and particle dissolve specimen */
export const motionPage = withPreload(
  defineSpecimen<MotionPageSpecimenProps>()({
    initialProps: {
      category: 'all',
      variant: 'glide',
      direction: 'forward',
      transitionScope: 'region',
      background: 'shared',
      pipeline: 'auto',
    },
    initialState: () => ({}),
    controls: {
      props: {
        category: {
          kind: 'select',
          label: localized('Category', '切换类别'),
          options: [
            { value: 'all', label: localized('All categories', '全部分类') },
            { value: 'standard', label: localized('Standard choreography', '标准页面切换动效') },
            { value: 'dissolve', label: localized('Particle dissolve', '粒子消散（实验性）') },
          ],
        },
        variant: {
          kind: 'select',
          label: localized('Transition preset', '切换预设'),
          options: [
            { value: 'fade', label: localized('Fade', '淡隐淡现') },
            { value: 'glide', label: localized('Glide', '轻滑浮入') },
            { value: 'slide', label: localized('Slide', '方向滑动') },
            { value: 'push', label: localized('Push', '视差推入') },
            { value: 'depth', label: localized('Depth', '景深缩放') },
            { value: 'veil', label: localized('Veil', '柔雾聚焦') },
            { value: 'curtain', label: localized('Curtain', '光幕揭开') },
            { value: 'iris', label: localized('Iris', '光圈展开') },
            { value: 'morph', label: localized('Morph', '平滑切换') },
          ],
        },
        direction: {
          kind: 'select',
          label: localized('Direction', '方向'),
          options: [
            { value: 'forward', label: localized('Forward', '前进') },
            { value: 'backward', label: localized('Backward', '后退') },
            { value: 'up', label: localized('Up', '向上') },
            { value: 'down', label: localized('Down', '向下') },
          ],
        },
        transitionScope: {
          kind: 'select',
          label: localized('Scope', '范围'),
          options: [
            { value: 'region', label: localized('Region', '局部容器') },
            { value: 'document', label: localized('Document', '整页文档') },
          ],
        },
        background: {
          kind: 'select',
          label: localized('Page backdrop', '背景关系'),
          options: [
            { value: 'shared', label: localized('Same canvas', '同背景') },
            { value: 'surface', label: localized('Distinct scenes', '异背景') },
          ],
        },
        pipeline: {
          kind: 'select',
          label: localized('Dissolve pipeline', '消散管线'),
          options: [
            { value: 'auto', label: localized('Auto', '自动') },
            { value: 'capture', label: localized('HTML capture', 'HTML 捕获') },
            { value: 'synthetic', label: localized('Synthetic dust', '合成尘埃') },
            { value: 'crossfade', label: localized('Crossfade', '淡入淡出') },
          ],
        },
      },
    },
    render: ({ props, locale }) =>
      h(MotionPageExample, {
        category: props.category ?? 'all',
        variant: props.variant ?? 'glide',
        direction: props.direction ?? 'forward',
        transitionScope: props.transitionScope ?? 'region',
        background: props.background ?? 'shared',
        pipeline: props.pipeline ?? 'auto',
        locale,
        inlineControls: false,
      }),
  }),
  MotionPageExample,
);
