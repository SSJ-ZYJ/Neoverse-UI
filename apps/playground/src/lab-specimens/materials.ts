import { type CardProps, type SurfaceProps, UiBadge, UiCard, UiSurface } from '@neoverse-ui/vue';
import { h } from 'vue';
import { defineSpecimen } from '../lab-specimen-config';
import {
  type LocalizedText,
  localize,
  localized,
  moduleCopy,
  tokenCopy,
} from '../playground-content';
import { glassOptions, surfaceLabel, surfaceOptions } from './shared';

const cardCopy = moduleCopy.card;
const cardBody = localized(
  'Compare surface presets on the same backdrop without changing the content.',
  '在同一背景上对比表面预设，卡片内容保持不变。',
);
/** The editable Card specimen */
export const card = defineSpecimen<CardProps>()({
  initialProps: { as: 'article' },
  initialState: () => ({}),
  controls: {
    props: {
      surface: {
        kind: 'select',
        label: surfaceLabel,
        options: [
          { value: 'solid', label: localized('Solid', '不透明') },
          { value: 'elevated', label: localized('Elevated', '抬升') },
          ...glassOptions,
        ],
      },
    },
  },
  render: ({ props, locale }) =>
    h(
      UiCard,
      { ...props, 'aria-labelledby': 'live-card-title', class: 'w-full max-w-container-sm' },
      () =>
        h('div', { class: 'grid gap-3' }, [
          h('div', { class: 'flex flex-wrap items-center justify-between gap-2' }, [
            h(
              'h3',
              { id: 'live-card-title', class: 'text-label font-label text-primary' },
              localize(cardCopy.reference, locale),
            ),
            h(UiBadge, { variant: 'success' }, () => localize(cardCopy.ready, locale)),
          ]),
          h('p', { class: 'text-body text-secondary' }, localize(cardBody, locale)),
        ]),
    ),
});

const surfaceCopy = {
  title: localized('Surface preset', '表面预设'),
  body: localized(
    'One token-backed plate; the preset decides whether it is opaque, raised or Aurora Glass.',
    '同一块由令牌驱动的表面；预设决定它是不透明、抬升还是极光玻璃。',
  ),
};

/** The editable Surface specimen */
export const surface = defineSpecimen<SurfaceProps>()({
  initialProps: { surface: 'glass-subtle' },
  initialState: () => ({}),
  controls: {
    props: {
      surface: { kind: 'select', label: surfaceLabel, options: surfaceOptions },
    },
  },
  note: localized(
    'Aurora Glass presets reuse the shared tier tokens; opaque presets skip the backdrop filter.',
    '极光玻璃预设复用共享档位令牌；不透明预设不启用背景滤镜。',
  ),
  render: ({ props, locale }) =>
    h(
      UiSurface,
      { ...props, class: 'grid w-full max-w-container-sm gap-2 rounded-card p-5' },
      () => [
        h(
          'p',
          { class: 'text-label font-label text-primary' },
          localize(surfaceCopy.title, locale),
        ),
        h('p', { class: 'text-body-sm text-secondary' }, localize(surfaceCopy.body, locale)),
      ],
    ),
});

const glassTierLabels = {
  'glass-subtle': tokenCopy.glassVariants.subtle,
  'glass-elevated': tokenCopy.glassVariants.elevated,
  'glass-immersive': tokenCopy.glassVariants.immersive,
} as const satisfies Record<string, LocalizedText>;
type GlassTier = keyof typeof glassTierLabels;
const glassTierOptions = (Object.keys(glassTierLabels) as GlassTier[]).map((value) => ({
  value,
  label: glassTierLabels[value],
}));
const glassTierDescriptions: Record<GlassTier, LocalizedText> = {
  'glass-subtle': localized(
    'The quietest tier: light blur for chrome that sits beside content.',
    '最克制的档位：轻量模糊，适合与内容并置的界面外框。',
  ),
  'glass-elevated': localized(
    'The standard plate: balanced tint, edge and blur for cards and toolbars.',
    '标准档位：为卡片与工具栏平衡色调、边缘与模糊。',
  ),
  'glass-immersive': localized(
    'The deepest tier: stronger blur and tint for transient overlays.',
    '最深的档位：更强的模糊与色调，用于临时浮层。',
  ),
};

/** The editable Aurora Glass specimen */
export const glass = defineSpecimen<Pick<SurfaceProps, 'surface'>>()({
  initialProps: { surface: 'glass-subtle' },
  initialState: () => ({}),
  controls: {
    props: {
      surface: { kind: 'select', label: surfaceLabel, options: glassTierOptions },
    },
  },
  note: localized(
    'The stage background decides what the glass refracts: compare tiers on the gradient or optical backdrop.',
    '舞台背景决定玻璃折射的内容：可在渐变或光学背景下对比档位。',
  ),
  render: ({ props, locale }) => {
    const tier = (props.surface ?? 'glass-subtle') as GlassTier;
    return h(
      UiSurface,
      {
        ...props,
        class: 'grid w-full max-w-container-sm gap-2 rounded-card p-6',
        'data-glass-variant': tier.replace('glass-', ''),
      },
      () => [
        h(
          'p',
          { class: 'text-title-sm font-title text-primary' },
          localize(glassTierLabels[tier], locale),
        ),
        h(
          'p',
          { class: 'text-body-sm text-secondary' },
          localize(glassTierDescriptions[tier], locale),
        ),
      ],
    );
  },
});
