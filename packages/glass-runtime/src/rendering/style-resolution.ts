import { type ClipRect, clipSurfaceRect, type OverflowClipCache } from '../overflow-clip.js';
import { type Color, parseColor } from '../style-colors.js';
import {
  type Basis2D,
  getRadii,
  type Mat2,
  parseFirstNumber,
  parsePixels,
  type Radii,
  resolveSurfaceGeometry,
  resolveSurfaceVisualState,
  type StyleGetter,
  type SurfaceVisualState,
} from '../surface-geometry.js';
import type { CanvasViewport } from './viewport.js';

const glassClassNames = [
  'material-glass-subtle',
  'material-glass-elevated',
  'material-glass-immersive',
] as const;
export const materialModeAttribute = 'data-neoverse-material';
const materialModeSelector = `[${materialModeAttribute}='glass'], [${materialModeAttribute}='solid']`;
export const glassPresetSelector = glassClassNames.map((name) => `.${name}`).join(', ');
const implicitAutoGlassSelector =
  '.ui-choice__control, .neoverse-prose table, .ui-disclosure, .neoverse-prose details';
const insetGlassSelector = `.ui-input, .ui-textarea, .ui-select, table.ui-table, ${implicitAutoGlassSelector}`;
const elevatedFormGlassSelector = '.ui-select__popover';
export const glassSelector = [
  glassPresetSelector,
  insetGlassSelector,
  elevatedFormGlassSelector,
].join(', ');

type GlassVariant = 'subtle' | 'elevated' | 'immersive';

export type GlassStyle = {
  rect: DOMRect;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  basis: Basis2D;
  rotated: boolean;
  clipRect: ClipRect;
  radii: Radii;
  pointer: [number, number, number];
  edgeWidth: number;
  softness: number;
  opacity: number;
  chroma: number;
  carrier: Color;
};

const isSolidAutoSurface = (element: Element): boolean =>
  (element.classList.contains('material-auto') ||
    (!element.matches(glassPresetSelector) && element.matches(implicitAutoGlassSelector))) &&
  element.closest(materialModeSelector)?.getAttribute(materialModeAttribute) === 'solid';

const getExplicitVariant = (element: Element): GlassVariant | undefined => {
  const materialClassName = glassClassNames.find((className) =>
    element.classList.contains(className),
  );
  if (materialClassName !== undefined) {
    return materialClassName.replace('material-glass-', '') as GlassVariant;
  }
  return undefined;
};

const getVariant = (element: Element): GlassVariant | undefined => {
  const explicit = getExplicitVariant(element);
  if (explicit !== undefined) return explicit;
  if (element.matches(insetGlassSelector)) return 'subtle';
  if (element.matches(elevatedFormGlassSelector)) return 'elevated';
  return undefined;
};

export const canRenderGlassEdge = (element: Element): boolean =>
  !isSolidAutoSurface(element) &&
  getVariant(element) !== undefined &&
  !inheritsParentGlassEdge(element);

const inheritsParentGlassEdge = (element: Element): boolean => {
  // An independent Aurora Glass surface owns its own refractive silhouette, even
  // when the layout around it is also Aurora Glass. In particular, Playground's
  // Aurora Glass specimen cards and standalone segmented controls must keep the
  // WebGL outer edge unless they explicitly opt into inherited nesting.
  if (element.getAttribute('data-neoverse-glass-nesting') !== 'inherit') {
    return false;
  }

  let ancestor = element.parentElement;
  while (ancestor !== null) {
    if (getExplicitVariant(ancestor) !== undefined && !isSolidAutoSurface(ancestor)) {
      return true;
    }
    ancestor = ancestor.parentElement;
  }

  return false;
};

export const colorProperties = [
  '--neoverse-material-edge-refraction-carrier',
  '--neoverse-color-edge-light',
  '--neoverse-color-accent-primary',
  '--accent-primary',
  '--neoverse-color-accent-secondary',
  '--accent-secondary',
  '--neoverse-color-accent-tertiary',
  '--accent-tertiary',
] as const;

export const firstPropertyValue = (
  style: CSSStyleDeclaration,
  properties: readonly string[],
): string | undefined => {
  for (const property of properties) {
    const value = style.getPropertyValue(property).trim();
    if (value !== '') {
      return value;
    }
  }

  return undefined;
};

const mixColorHash = (hash: number, text: string): number => {
  let value = hash;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value;
};

const colorResolutionCache = new Map<number, Color>();

const hashColorInputs = (style: CSSStyleDeclaration, values: readonly string[]): number => {
  let hash = mixColorHash(2166136261, style.colorScheme);
  for (const property of colorProperties) {
    hash = mixColorHash(hash, style.getPropertyValue(property));
  }
  hash = mixColorHash(hash, '#');
  for (const value of values) hash = mixColorHash(hash, value);
  return hash;
};

export const resolveColor = (
  sourceStyle: CSSStyleDeclaration,
  values: readonly string[],
  view: Window,
  probe: HTMLElement,
  fallback: Color,
): Color => {
  // Surfaces share the same token-derived carrier. Resolving it once per input
  // signature keeps probe style writes out of the DevTools DOM mutation stream.
  const key = hashColorInputs(sourceStyle, values);
  const cached = colorResolutionCache.get(key);
  if (cached !== undefined) return cached;
  const previousColor = probe.style.getPropertyValue('color');
  const previousPriority = probe.style.getPropertyPriority('color');
  for (const property of colorProperties) {
    const sourceValue = sourceStyle.getPropertyValue(property);
    if (sourceValue.trim() === '') {
      probe.style.removeProperty(property);
    } else {
      probe.style.setProperty(property, sourceValue);
    }
  }
  let resolved: Color | undefined;
  for (const value of values) {
    probe.style.setProperty('color', value);
    resolved = parseColor(view.getComputedStyle(probe).color);
    if (resolved !== undefined) {
      break;
    }
  }

  if (previousColor === '') {
    probe.style.removeProperty('color');
  } else {
    probe.style.setProperty('color', previousColor, previousPriority);
  }

  const result = resolved ?? fallback;
  if (colorResolutionCache.size > 512) colorResolutionCache.clear();
  colorResolutionCache.set(key, result);
  return result;
};

const getDefaultEdgeValues = (
  variant: GlassVariant,
): {
  width: number;
  softness: number;
  opacity: number;
} => {
  if (variant === 'immersive') {
    return { width: 1.5, softness: 5, opacity: 0.54 };
  }

  if (variant === 'elevated') {
    return { width: 1.25, softness: 4, opacity: 0.5 };
  }

  return { width: 1, softness: 3, opacity: 0.46 };
};

export const readStyle = (
  element: HTMLElement,
  view: Window,
  colorProbe: HTMLElement,
  viewport: CanvasViewport,
  rect: DOMRect,
  getStyle: StyleGetter,
  visualCache: Map<Element, SurfaceVisualState | null>,
  matrixCache: Map<Element, Mat2>,
  overflowClips: OverflowClipCache,
): GlassStyle | undefined => {
  const style = getStyle(element);
  if (
    rect.width <= 0 ||
    rect.height <= 0 ||
    rect.right <= 0 ||
    rect.bottom <= 0 ||
    rect.left >= viewport.right ||
    rect.top >= viewport.bottom ||
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0'
  ) {
    return undefined;
  }

  // The shared canvas is outside the surface's DOM subtree, so it must
  // explicitly reproduce opacity and blur applied to the surface and its ancestors.
  const visual = resolveSurfaceVisualState(element, getStyle, visualCache, style);
  if (visual === undefined || visual.opacity === 0) return undefined;

  const geometry = resolveSurfaceGeometry(element, rect, getStyle, matrixCache);
  const surfaceScale = Math.min(geometry.scaleX, geometry.scaleY);
  const pointer: GlassStyle['pointer'] = [0, 0, 0];
  if (element.hasAttribute('data-neoverse-tooltip-surface') && style.overflow === 'visible') {
    const arrow = view.getComputedStyle(element, '::after');
    const arrowWidth = parsePixels(arrow.width, 0) * surfaceScale;
    const arrowHeight = parsePixels(arrow.height, 0) * surfaceScale;
    if (arrow.display !== 'none' && arrowWidth > 0 && arrowHeight > 0) {
      // Read resolved pseudo-element geometry so custom pointer positions and
      // ancestor zoom keep the CSS fill and refractive contour aligned.
      const layoutWidth =
        element.offsetWidth > 0 ? element.offsetWidth : geometry.width / surfaceScale;
      pointer[0] =
        (parsePixels(arrow.left, layoutWidth / 2) + parsePixels(style.borderLeftWidth, 0)) *
          surfaceScale -
        geometry.width / 2;
      pointer[1] = arrowWidth / 2;
      pointer[2] = arrowHeight;
    }
  }
  const variant = getVariant(element) ?? 'subtle';
  const defaults = getDefaultEdgeValues(variant);
  const edgeWidth =
    Math.max(
      parsePixels(
        firstPropertyValue(style, ['--neoverse-material-edge-refraction-width']) ?? '',
        defaults.width,
      ),
      0.5,
    ) * surfaceScale;
  const softness =
    Math.max(
      parsePixels(
        firstPropertyValue(style, ['--neoverse-material-edge-refraction-softness']) ?? '',
        defaults.softness,
      ),
      1,
    ) * surfaceScale;
  const opacity = Math.min(
    Math.max(
      parseFirstNumber(
        firstPropertyValue(style, ['--neoverse-material-edge-refraction-opacity']) ?? '',
        defaults.opacity,
      ),
      0,
    ),
    1,
  );
  const blurFade = visual.blur > 0 ? 1 / (1 + visual.blur * 0.5) : 1;
  const carrier = firstPropertyValue(style, ['--neoverse-material-edge-refraction-carrier']);
  const carrierColor = resolveColor(
    style,
    carrier === undefined
      ? ['var(--neoverse-color-edge-light)', 'var(--edge-light)']
      : [carrier, 'var(--neoverse-color-edge-light)', 'var(--edge-light)'],
    view,
    colorProbe,
    [1, 1, 1],
  );

  return {
    rect,
    centerX: geometry.centerX,
    centerY: geometry.centerY,
    width: geometry.width,
    height: geometry.height,
    basis: geometry.basis,
    rotated: geometry.rotated,
    clipRect: clipSurfaceRect(element, rect, pointer[2], view, overflowClips, getStyle),
    radii: getRadii(style, geometry.scaleX, geometry.scaleY, geometry.width, geometry.height),
    pointer,
    edgeWidth,
    softness,
    opacity: opacity * visual.opacity * blurFade,
    chroma: Math.min(
      Math.max(
        parseFirstNumber(
          firstPropertyValue(style, ['--neoverse-material-edge-refraction-chroma']) ?? '',
          1,
        ),
        0,
      ),
      1,
    ),
    carrier: carrierColor,
  };
};
