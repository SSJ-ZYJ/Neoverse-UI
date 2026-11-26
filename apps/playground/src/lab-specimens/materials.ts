import type { Material } from '@neoverse-ui/tokens';
import { type CardProps, type SurfaceProps, UiCard, UiSurface } from '@neoverse-ui/vue';
import { h } from 'vue';
import { defineSpecimen } from '../lab-specimen-config';
import { lazyComponent, withPreload } from '../lazy-component';
import { type LocalizedText, localize, localized } from '../playground-content';
import { surfaceLabel, surfaceOptions } from './shared';

const ReferenceCardContent = lazyComponent(() => import('../previews/ReferenceCardContent.vue'));
export const CoreMaterialPreview = lazyComponent(
  () => import('../previews/CoreMaterialPreview.vue'),
);

const materialChoices = [
  { value: 'both', label: localized('Compare both', '并排对照') },
  { value: 'glass', label: localized('Aurora Glass', '极光玻璃') },
  { value: 'solid', label: localized('Solid', '实体') },
] as const;
export const coreMaterialModes = ['glass', 'solid'] as const satisfies readonly Material[];
export const coreMaterialCopy = {
  label: localized('Core material comparison', '核心材质对照'),
  description: localized(
    'One workspace in both materials. Switch the Lab theme to compare the light and dark palettes.',
    '同一工作区采用两种材质。切换实验室主题可对照浅色和深色色阶。',
  ),
};

export const coreMaterials = withPreload(
  defineSpecimen<{ mode: (typeof materialChoices)[number]['value'] }>()({
    initialProps: { mode: 'both' },
    initialState: () => ({}),
    controls: {
      props: { mode: { kind: 'select', label: coreMaterialCopy.label, options: materialChoices } },
    },
    note: coreMaterialCopy.description,
    render: ({ props, locale }) =>
      h(
        'div',
        {
          class: [
            'grid w-full min-w-0 gap-3',
            props.mode === 'both' && 'playground-core-material-grid',
          ],
        },
        coreMaterialModes
          .filter((mode) => props.mode === 'both' || props.mode === mode)
          .map((mode) => h(CoreMaterialPreview, { key: mode, mode, locale })),
      ),
  }),
  CoreMaterialPreview,
);

/** The editable Card specimen */
export const card = withPreload(
  defineSpecimen<CardProps>()({
    initialProps: { as: 'article' },
    initialState: () => ({}),
    controls: {
      props: { surface: { kind: 'select', label: surfaceLabel, options: surfaceOptions } },
    },
    render: ({ props, locale }) =>
      h(
        UiCard,
        { ...props, 'aria-labelledby': 'live-card-title', class: 'w-full max-w-container-sm' },
        () =>
          h(ReferenceCardContent, { locale, presentation: 'focused', titleId: 'live-card-title' }),
      ),
  }),
  ReferenceCardContent,
);

const surfaceCopy = {
  title: localized('Surface preset', '表面预设'),
  body: localized(
    'One token-backed plate; the preset decides whether it is opaque, raised or Aurora Glass.',
    '同一块由令牌驱动的表面；预设决定它是不透明、抬升还是极光玻璃。',
  ),
};

const glassTierDescriptions = {
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
} as const satisfies Record<string, LocalizedText>;

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
    'Aurora Glass presets reuse the shared tier tokens, and the stage background decides what the glass refracts; opaque presets skip the backdrop filter.',
    '极光玻璃预设复用共享档位令牌，舞台背景决定玻璃折射的内容；不透明预设不启用背景滤镜。',
  ),
  render: ({ props, locale }) => {
    const preset = props.surface;
    const body =
      preset !== undefined && preset in glassTierDescriptions
        ? glassTierDescriptions[preset as keyof typeof glassTierDescriptions]
        : surfaceCopy.body;
    return h(
      UiSurface,
      { ...props, class: 'grid w-full max-w-container-sm gap-2 rounded-card p-5' },
      () => [
        h(
          'p',
          { class: 'text-label font-label text-primary' },
          localize(surfaceCopy.title, locale),
        ),
        h('p', { class: 'text-body-sm text-secondary' }, localize(body, locale)),
      ],
    );
  },
});
