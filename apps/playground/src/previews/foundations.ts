import { h, type VNode } from 'vue';
import LabSpecimenHeader from '../LabSpecimenHeader.vue';
import {
  borderWidthTokens,
  type NamedToken,
  primitiveRadiusTokens,
  primitiveShadowTokens,
  semanticShadowTokens,
} from '../lab-data';
import { lazyComponent, withPreload } from '../lazy-component';
import { type Locale, localize, moduleCopy } from '../playground-content';
import TokenRow from '../TokenRow.vue';

const ColorPalettesExample = lazyComponent(() => import('./ColorPalettesExample.vue'));
const ProseExample = lazyComponent(() => import('./ProseExample.vue'));
const ScrollbarViewportExample = lazyComponent(() => import('./ScrollbarViewportExample.vue'));
const SpacingExample = lazyComponent(() => import('./SpacingExample.vue'));
const TypographyScaleExample = lazyComponent(() => import('./TypographyScaleExample.vue'));

const previewWidth = 'w-full min-w-0 max-w-reading-wide';

function tokenGrid(
  locale: Locale,
  tokens: readonly NamedToken[],
  preview: 'radius' | 'border' | 'shadow',
): VNode {
  return h(
    'div',
    { class: ['playground-token-grid', previewWidth] },
    tokens.map(({ label, variable }) =>
      h(TokenRow, { key: variable, label, locale, variable, preview }),
    ),
  );
}

export const colors = withPreload(
  (locale: Locale): VNode => h(ColorPalettesExample, { locale, class: previewWidth }),
  ColorPalettesExample,
);

export const typography = withPreload(
  (locale: Locale): VNode => h(TypographyScaleExample, { locale, class: previewWidth }),
  TypographyScaleExample,
);

export const prose = withPreload(
  (locale: Locale): VNode => h(ProseExample, { locale, class: previewWidth }),
  ProseExample,
);

export const layoutShape = withPreload((locale: Locale): VNode => {
  const groups = [
    { label: moduleCopy.spacing.label, render: () => h(SpacingExample, { locale, kind: 'scale' }) },
    { label: moduleCopy.radius.label, render: radius },
    { label: moduleCopy.border.label, render: border },
  ];
  return h(
    'div',
    { class: ['grid gap-grid', previewWidth] },
    groups.map(({ label, render }) =>
      h('section', { key: label.en, class: 'grid min-w-0 gap-3' }, [
        h(LabSpecimenHeader, { title: localize(label, locale) }),
        render(locale),
      ]),
    ),
  );
}, SpacingExample);

export const spacing = withPreload(
  (locale: Locale): VNode =>
    h(
      'div',
      { class: ['grid gap-grid', previewWidth] },
      (['aliases', 'primitive'] as const).map((group) => {
        const { label, description } = moduleCopy.spacing[group];
        return h('section', { key: group, class: 'grid min-w-0 gap-3' }, [
          h(LabSpecimenHeader, {
            title: localize(label, locale),
            description: localize(description, locale),
          }),
          h(SpacingExample, { locale, kind: group === 'primitive' ? 'scale' : 'usage' }),
        ]);
      }),
    ),
  SpacingExample,
);

export function radius(locale: Locale): VNode {
  return tokenGrid(locale, primitiveRadiusTokens, 'radius');
}

export function border(locale: Locale): VNode {
  return tokenGrid(locale, borderWidthTokens, 'border');
}

export function shadowPrimitive(locale: Locale): VNode {
  return tokenGrid(locale, primitiveShadowTokens, 'shadow');
}

export function shadowAlias(locale: Locale): VNode {
  return tokenGrid(locale, semanticShadowTokens, 'shadow');
}

export const scrollbar = withPreload(
  (locale: Locale): VNode => h(ScrollbarViewportExample, { locale, class: previewWidth }),
  ScrollbarViewportExample,
);
