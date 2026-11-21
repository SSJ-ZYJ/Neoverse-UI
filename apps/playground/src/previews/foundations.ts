import { UiSurface } from '@neoverse-ui/vue';
import { h, type VNode } from 'vue';
import {
  borderWidthTokens,
  glassVariantLabels,
  type NamedToken,
  primitiveRadiusTokens,
  primitiveShadowTokens,
  primitiveSpacingTokens,
  semanticShadowTokens,
} from '../lab-data';
import BorderModule from '../modules/BorderModule.vue';
import RadiusModule from '../modules/RadiusModule.vue';
import SpacingModule from '../modules/SpacingModule.vue';
import { type Locale, localize, tokenCopy } from '../playground-content';
import TokenRow from '../TokenRow.vue';
import ColorPalettesExample from './ColorPalettesExample.vue';
import MotionPageExample from './MotionPageExample.vue';
import MotionPresenceExample from './MotionPresenceExample.vue';
import MotionPrimitivesExample from './MotionPrimitivesExample.vue';
import MotionStaggerExample from './MotionStaggerExample.vue';
import MotionWidthExample from './MotionWidthExample.vue';
import ProseExample from './ProseExample.vue';
import ScrollbarViewportExample from './ScrollbarViewportExample.vue';
import TerminalTranscriptExample from './TerminalTranscriptExample.vue';
import TypographyScaleExample from './TypographyScaleExample.vue';

const previewWidth = 'w-full min-w-0 max-w-reading-wide';

function tokenGrid(
  locale: Locale,
  tokens: readonly NamedToken[],
  preview: 'space' | 'radius' | 'border' | 'shadow',
): VNode {
  return h(
    'div',
    { class: ['playground-token-grid', previewWidth] },
    tokens.map(({ label, variable }) =>
      h(TokenRow, { key: variable, label, locale, variable, preview }),
    ),
  );
}

export function colors(locale: Locale): VNode {
  return h(ColorPalettesExample, { locale, class: previewWidth });
}

export function typography(locale: Locale): VNode {
  return h(TypographyScaleExample, { locale, class: previewWidth });
}

export function prose(locale: Locale): VNode {
  return h(ProseExample, { locale, class: previewWidth });
}

export function layoutShape(locale: Locale): VNode {
  return h('div', { class: ['grid gap-grid', previewWidth] }, [
    h(SpacingModule, { locale }),
    h(RadiusModule, { locale }),
    h(BorderModule, { locale }),
  ]);
}

export function spacing(locale: Locale): VNode {
  return tokenGrid(locale, primitiveSpacingTokens, 'space');
}

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

export function motion(locale: Locale): VNode {
  return h(MotionPrimitivesExample, { locale, class: previewWidth });
}

export function motionPresence(locale: Locale): VNode {
  return h('div', { class: ['grid gap-grid', previewWidth] }, [
    h(MotionPresenceExample, { locale }),
    h(MotionStaggerExample, { locale }),
  ]);
}

export function motionWidth(locale: Locale): VNode {
  return h(MotionWidthExample, { locale, class: previewWidth });
}

export function motionPage(locale: Locale): VNode {
  return h(MotionPageExample, { locale });
}

export function surface(locale: Locale): VNode {
  return h(
    UiSurface,
    { surface: 'glass-subtle', class: 'rounded-card p-5', 'data-surface-preset': 'glass-subtle' },
    () => localize(tokenCopy.glassVariants.subtle, locale),
  );
}

export function glass(locale: Locale): VNode {
  return h(
    UiSurface,
    { surface: 'glass-subtle', class: 'rounded-card p-5', 'data-glass-variant': 'subtle' },
    () => localize(glassVariantLabels.subtle, locale),
  );
}

export function terminal(locale: Locale): VNode {
  return h(TerminalTranscriptExample, { locale, class: previewWidth });
}

export function scrollbar(locale: Locale): VNode {
  return h(ScrollbarViewportExample, { locale, class: previewWidth });
}
