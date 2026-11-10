import { createProgram, type GlassGl } from './gl-program';
import { NativeGlassRenderer, supportsNativeRefraction } from './native';
import { type Color, parseColor } from './style-colors';
import { getTableGridEdges, getTableOuterRect } from './table-edges';

export const glassRendererAttribute = 'data-neoverse-glass-renderer';

const glassClassNames = [
  'material-glass-subtle',
  'material-glass-elevated',
  'material-glass-immersive',
] as const;
const insetGlassSelector =
  '.ui-input, .ui-textarea, .ui-select, .ui-choice__control, table.ui-table, .neoverse-prose table, .ui-disclosure, .neoverse-prose details';
const tableGlassSelector = 'table.ui-table, .neoverse-prose table';
const elevatedFormGlassSelector = '.ui-select__popover';
const glassSelector = [
  ...glassClassNames.map((className) => `.${className}`),
  insetGlassSelector,
  elevatedFormGlassSelector,
].join(', ');
const cssEdgePassSelector = '[data-neoverse-glass-edge-pass="css"]';
const reducedTransparencyQuery = '(prefers-reduced-transparency: reduce)';
const systemDarkQuery = '(prefers-color-scheme: dark)';
const maxDefaultDevicePixelRatio = 2;
// Cap edge repaints at roughly 60 fps. Unthrottled RAF on 240-360 Hz displays
// otherwise allocates a full render's worth of temporary objects every 3 ms and
// triggers repeated V8/CppGC collections.
const minFrameIntervalMs = 16;
const glassMutationAttributes = [
  'class',
  'style',
  'hidden',
  'data-theme',
  glassRendererAttribute,
  'data-neoverse-glass-edge-pass',
  'data-neoverse-glass-edge-pass-active',
  'data-neoverse-glass-occluder',
  'data-neoverse-glass-nesting',
  'data-neoverse-tooltip-surface',
  'colspan',
  'rowspan',
  'span',
] as const;
// Attribute changes outside a Glass surface, its occluders and its ancestors
// cannot move or restyle an edge. Typewriters and scrollbar thumbs emit
// thousands of style mutations per second from exactly that region.
const sceneRelevantAttributes = new Set([
  'data-theme',
  glassRendererAttribute,
  'data-neoverse-glass-edge-pass',
  'data-neoverse-glass-edge-pass-active',
  'data-neoverse-glass-occluder',
  'data-neoverse-glass-nesting',
  'data-neoverse-tooltip-surface',
  'colspan',
  'rowspan',
  'span',
  'hidden',
]);
const occluderSelector = '[data-neoverse-glass-occluder]';
const maxOccluders = 6;
const staticEdgeFrameProperties = new Set([
  'offset',
  'computedOffset',
  'easing',
  'composite',
  'backgroundPosition',
  'backgroundPositionX',
  'backgroundPositionY',
]);
const clippedContentFrameProperties = new Set([
  ...staticEdgeFrameProperties,
  'transform',
  'translate',
  'rotate',
  'scale',
  'opacity',
]);
const animationIsActive = (animation: Animation): boolean =>
  animation.playState === 'running' || animation.pending;

function isInHiddenTree(element: Element): boolean {
  if (element.getClientRects().length > 0) return false;
  const view = element.ownerDocument.defaultView;
  for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
    if (view?.getComputedStyle(ancestor).display === 'none') return true;
  }
  return false;
}

function needsEdgeFrame(animation: Animation): boolean {
  if (!animationIsActive(animation)) return false;
  const effect = animation.effect;
  // Keep unknown effects conservative; only known background-position motion
  // can be left to live CSS compositing without redrawing the edge geometry.
  if (!effect || !('getKeyframes' in effect)) return true;
  const keyframeEffect = effect as KeyframeEffect;
  const properties = keyframeEffect.getKeyframes().flatMap((frame) => Object.keys(frame));
  if (properties.every((property) => staticEdgeFrameProperties.has(property))) return false;
  const target = keyframeEffect.target;
  const boundary = target?.closest(glassSelector);
  if (
    target &&
    boundary &&
    target !== boundary &&
    !target.querySelector(glassSelector) &&
    properties.every((property) => clippedContentFrameProperties.has(property))
  ) {
    const style = target.ownerDocument.defaultView?.getComputedStyle(boundary);
    // Isolated, clipped content cannot change its surface geometry or occlude
    // another surface outside the boundary. CSS composites glyph motion live.
    if (
      style?.isolation === 'isolate' &&
      (style.overflowX === 'hidden' || style.overflowX === 'clip') &&
      (style.overflowY === 'hidden' || style.overflowY === 'clip')
    )
      return false;
  }
  return true;
}
const occlusionSampleInset = 2;
const quadPositions = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
const motionEvents = [
  'pointerdown',
  'pointerup',
  'pointercancel',
  'keydown',
  'keyup',
  'focusin',
  'focusout',
  'transitionrun',
  'transitionend',
  'transitioncancel',
  'animationstart',
  'animationend',
  'animationcancel',
] as const;

/** Color-only transitions cannot move a surface, change its clip, or alter
 *  occlusion. A theme switch starts one such transition per color property on
 *  every glass surface; handling each of those events would schedule hundreds
 *  of edge repaints whose geometry is identical. Events without a property name
 *  (animations and synthetic realms) stay on the conservative path. */
const staticTransitionProperty = /^(?:color|box-shadow|text-shadow|.+?-color)$/i;

function isStaticTransition(event: Event): boolean {
  const property = (event as TransitionEvent).propertyName;
  return (
    typeof property === 'string' &&
    property.length > 0 &&
    // Registered custom properties may carry geometry; leave them on the tracked path.
    !property.startsWith('--') &&
    staticTransitionProperty.test(property)
  );
}

type GlassVariant = 'subtle' | 'elevated' | 'immersive';
type Radii = [number, number, number, number];

type GlassStyle = {
  rect: DOMRect;
  clipRect: ClipRect;
  radii: Radii;
  pointer: [number, number, number];
  edgeWidth: number;
  softness: number;
  opacity: number;
  chroma: number;
  carrier: Color;
};

type ClipRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

type CanvasViewport = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

type GlassWindow = Window & {
  CSS?: Pick<typeof CSS, 'supports'>;
  ResizeObserver?: typeof ResizeObserver;
  MutationObserver?: typeof MutationObserver;
  Document?: typeof Document;
};

type Occluder = {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
  area: number;
  topmost: boolean;
};

type OcclusionCandidate = {
  element: HTMLElement;
  rect: DOMRect;
  visible?: boolean;
};

type OcclusionContext = {
  hitTest?: (x: number, y: number) => Element[];
  sortedByTop?: boolean;
};

type ProgramLocations = {
  position: number;
  viewport: WebGLUniformLocation | null;
  rect: WebGLUniformLocation | null;
  rectSize: WebGLUniformLocation | null;
  pixelRatio: WebGLUniformLocation | null;
  radii: WebGLUniformLocation | null;
  pointer: WebGLUniformLocation | null;
  edgeWidth: WebGLUniformLocation | null;
  softness: WebGLUniformLocation | null;
  opacity: WebGLUniformLocation | null;
  lightSurface: WebGLUniformLocation | null;
  cornerFocus: WebGLUniformLocation | null;
  chroma: WebGLUniformLocation | null;
  gain: WebGLUniformLocation | null;
  tertiary: WebGLUniformLocation | null;
  secondary: WebGLUniformLocation | null;
  primary: WebGLUniformLocation | null;
  edgeLight: WebGLUniformLocation | null;
  carrier: WebGLUniformLocation | null;
  occluders: WebGLUniformLocation | null;
  occluderRadii: WebGLUniformLocation | null;
  occluderCount: WebGLUniformLocation | null;
};

export interface GlassRendererOptions {
  /**
   * `native` opts into SVG displacement where supported; every other value
   * renders with WebGL. `'webgl'` therefore selects the same path as `'auto'`
   * — it is kept as an explicit, self-documenting alias rather than a
   * separate engine, so do not read it as a forced-or-fallback switch.
   */
  backend?: 'auto' | 'webgl' | 'native';
  document?: Document;
  maxDevicePixelRatio?: number;
}

export interface GlassRenderer {
  mount(): void;
  /** Force a repaint by default; pass false to let the frame cache deduplicate. */
  refresh(force?: boolean): void;
  destroy(): void;
}

interface SceneColors {
  gain: number;
  edgeLight: Color;
  primary: Color;
  secondary: Color;
  tertiary: Color;
  lightSurface: number;
  isLight: boolean;
}

const activeRenderers = new WeakMap<Document, GlassRenderer>();

const getDocument = (candidate?: Document): Document | undefined => {
  if (candidate !== undefined) {
    return candidate;
  }

  return typeof document === 'undefined' ? undefined : document;
};

const getWindow = (ownerDocument?: Document): GlassWindow | undefined =>
  (ownerDocument?.defaultView as GlassWindow | null | undefined) ?? undefined;

const normalizeMaxDevicePixelRatio = (candidate: number | undefined): number => {
  if (candidate === undefined || !Number.isFinite(candidate)) {
    return maxDefaultDevicePixelRatio;
  }

  return Math.max(candidate, 1);
};

const resolveDevicePixelRatio = (view: Window, maximum: number): number => {
  const candidate = view.devicePixelRatio;
  const ratio = Number.isFinite(candidate) && candidate > 0 ? candidate : 1;
  return Math.min(Math.max(ratio, 1), maximum);
};

const parseFirstNumber = (value: string, fallback: number): number => {
  const match = /-?[\d.]+/.exec(value);
  if (match === null) {
    return fallback;
  }

  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parsePixels = (value: string, fallback: number): number => {
  const match = /-?[\d.]+\s*px/.exec(value);
  if (match === null) {
    return parseFirstNumber(value, fallback);
  }

  return parseFirstNumber(match[0], fallback);
};

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

const inheritsParentGlassEdge = (element: Element): boolean => {
  // An independent Aurora Glass surface owns its own refractive silhouette, even
  // when the layout around it is also Aurora Glass. In particular, Playground's
  // Aurora Glass specimen cards must not lose the WebGL edge when the section itself
  // becomes an Aurora Glass surface. Segmented controls own a separate control edge.
  if (element.classList.contains('ui-segmented-control')) {
    return true;
  }
  if (element.getAttribute('data-neoverse-glass-nesting') !== 'inherit') {
    return false;
  }

  let ancestor = element.parentElement;
  while (ancestor !== null) {
    if (getExplicitVariant(ancestor) !== undefined) {
      return true;
    }
    ancestor = ancestor.parentElement;
  }

  return false;
};

const colorProperties = [
  '--neoverse-material-edge-refraction-carrier',
  '--neoverse-color-edge-light',
  '--neoverse-color-accent-primary',
  '--accent-primary',
  '--neoverse-color-accent-secondary',
  '--accent-secondary',
  '--neoverse-color-accent-tertiary',
  '--accent-tertiary',
] as const;

const firstPropertyValue = (
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

const getRadii = (
  style: CSSStyleDeclaration,
  scale: number,
  width: number,
  height: number,
): Radii => {
  // The canvas uses viewport coordinates; computed CSS radii do not include
  // ancestor zoom. Match the rendered silhouette and CSS radius clamping.
  const radius = (value: string): number =>
    Math.min(Math.max(parsePixels(value, 0) * scale, 0), width / 2, height / 2);
  return [
    radius(style.borderTopRightRadius),
    radius(style.borderBottomRightRadius),
    radius(style.borderBottomLeftRadius),
    radius(style.borderTopLeftRadius),
  ];
};

const getCanvasViewport = (
  canvas: HTMLCanvasElement,
  ownerDocument: Document,
  view: Window,
): CanvasViewport => {
  const canvasRect = canvas.getBoundingClientRect();
  const documentElement = ownerDocument.documentElement;
  const width = Math.max(
    canvasRect.width || canvas.clientWidth || documentElement.clientWidth || view.innerWidth,
    1,
  );
  const height = Math.max(
    canvasRect.height || canvas.clientHeight || documentElement.clientHeight || view.innerHeight,
    1,
  );
  const left = Number.isFinite(canvasRect.left) ? canvasRect.left : 0;
  const top = Number.isFinite(canvasRect.top) ? canvasRect.top : 0;

  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
  };
};

const getScissorRect = (
  rect: ClipRect,
  viewport: CanvasViewport,
  pixelRatio: number,
  drawingWidth: number,
  drawingHeight: number,
): { x: number; y: number; width: number; height: number } => {
  const left = Math.max(Math.floor((rect.left - viewport.left) * pixelRatio), 0);
  const top = Math.max(Math.floor((rect.top - viewport.top) * pixelRatio), 0);
  const right = Math.min(Math.ceil((rect.right - viewport.left) * pixelRatio), drawingWidth);
  const bottom = Math.min(Math.ceil((rect.bottom - viewport.top) * pixelRatio), drawingHeight);

  return {
    x: left,
    y: Math.max(drawingHeight - bottom, 0),
    width: Math.max(right - left, 0),
    height: Math.max(bottom - top, 0),
  };
};

const getEdgeScissors = (
  style: GlassStyle,
  scissor: ReturnType<typeof getScissorRect>,
  viewport: CanvasViewport,
  pixelRatio: number,
  drawingWidth: number,
  drawingHeight: number,
): ReturnType<typeof getScissorRect>[] => {
  // Small controls need one draw. Large panels should not evaluate five SDFs
  // for every transparent interior pixel on each scroll frame.
  if (scissor.width * scissor.height < 128_000) return [scissor];
  const padding = Math.ceil(
    Math.max(
      ...style.radii,
      style.pointer[2],
      style.edgeWidth + Math.min(Math.max(style.softness * 0.65, 0.75), 1.5),
    ) + 2,
  );
  const width = style.rect.width - padding * 2;
  const height = style.rect.height - padding * 2;
  if (width <= 0 || height <= 0) return [scissor];
  const inner = getScissorRect(
    {
      left: style.rect.left + padding,
      top: style.rect.top + padding,
      right: style.rect.right - padding,
      bottom: style.rect.bottom - padding,
      width,
      height,
    },
    viewport,
    pixelRatio,
    drawingWidth,
    drawingHeight,
  );
  const left = Math.max(scissor.x, inner.x);
  const bottom = Math.max(scissor.y, inner.y);
  const right = Math.min(scissor.x + scissor.width, inner.x + inner.width);
  const top = Math.min(scissor.y + scissor.height, inner.y + inner.height);
  if (left >= right || bottom >= top) return [scissor];
  // Split in integer device pixels, so fractional positions and DPR cannot
  // double-blend a row or leave a seam between adjacent perimeter strips.
  return [
    { x: scissor.x, y: scissor.y, width: scissor.width, height: bottom - scissor.y },
    { x: scissor.x, y: top, width: scissor.width, height: scissor.y + scissor.height - top },
    { x: scissor.x, y: bottom, width: left - scissor.x, height: top - bottom },
    { x: right, y: bottom, width: scissor.x + scissor.width - right, height: top - bottom },
  ].filter((strip) => strip.width > 0 && strip.height > 0);
};

const paintBackdropChroma = (
  context: CanvasRenderingContext2D,
  style: GlassStyle,
  viewport: CanvasViewport,
  occluders: readonly Occluder[],
  gain: number,
): void => {
  const opacity = Math.min(style.opacity * 0.7 * gain, 0.55);
  if (opacity <= 0) return;
  const inset = 0.65;
  const x = style.rect.left - viewport.left + inset;
  const y = style.rect.top - viewport.top + inset;
  const width = Math.max(style.rect.width - inset * 2, 0);
  const height = Math.max(style.rect.height - inset * 2, 0);
  if (width === 0 || height === 0) return;
  const radii = [style.radii[3], style.radii[0], style.radii[1], style.radii[2]].map((radius) =>
    Math.min(Math.max(radius - inset, 0), width / 2, height / 2),
  );
  context.save();
  context.beginPath();
  context.rect(
    style.clipRect.left - viewport.left,
    style.clipRect.top - viewport.top,
    style.clipRect.width,
    style.clipRect.height,
  );
  context.clip();
  for (const occluder of occluders) {
    context.beginPath();
    context.rect(0, 0, viewport.width, viewport.height);
    context.roundRect(
      occluder.left - viewport.left,
      occluder.top - viewport.top,
      occluder.width,
      occluder.height,
      occluder.radius,
    );
    context.clip('evenodd');
  }
  const path = new Path2D();
  if (style.pointer[2] > 0) {
    const [topLeft = 0, topRight = 0, bottomRight = 0, bottomLeft = 0] = radii;
    const right = x + width;
    const bottom = y + height;
    const arrow = x + width / 2 + style.pointer[0];
    const halfArrow = Math.min(style.pointer[1], width / 2);
    path.moveTo(x + topLeft, y);
    path.lineTo(right - topRight, y);
    path.arcTo(right, y, right, y + topRight, topRight);
    path.lineTo(right, bottom - bottomRight);
    path.arcTo(right, bottom, right - bottomRight, bottom, bottomRight);
    path.lineTo(arrow + halfArrow, bottom);
    path.lineTo(arrow, bottom + style.pointer[2]);
    path.lineTo(arrow - halfArrow, bottom);
    path.lineTo(x + bottomLeft, bottom);
    path.arcTo(x, bottom, x, bottom - bottomLeft, bottomLeft);
    path.lineTo(x, y + topLeft);
    path.arcTo(x, y, x + topLeft, y, topLeft);
    path.closePath();
  } else {
    path.roundRect(x, y, width, height, radii);
  }
  // Only the saturation of this signal is used; its hue is never painted.
  context.lineWidth = Math.max(style.edgeWidth, 0.75);
  context.globalAlpha = opacity;
  const reach = Math.max(Math.min(width * 0.5, height * 1.25), 16);
  for (const [cx = 0, cy = 0] of [
    [x, y],
    [x + width, y + height + style.pointer[2]],
  ]) {
    const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, reach);
    gradient.addColorStop(0, 'rgb(255 0 0)');
    gradient.addColorStop(1, 'rgb(255 0 0 / 0%)');
    context.strokeStyle = gradient;
    context.stroke(path);
  }
  context.restore();
};

const clipsOverflowAxis = (value: string): boolean =>
  value === 'auto' || value === 'clip' || value === 'hidden' || value === 'scroll';

// The shared edge canvas paints above every overlay, so an edge must be
// masked wherever an overlay covers its surface. Hit-test a small grid of
// points against the real paint order: everything stacked above the surface
// (drawers, popovers, scrims) at any sample point occludes it. Elements with
// pointer-events: none are already excluded from the hit test, which keeps
// the renderer's own canvas and probe out of the results.
export const occlusionSamplePoints = (rect: {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}): Array<[number, number]> => {
  const clampX = (x: number): number =>
    Math.min(Math.max(x, rect.left + occlusionSampleInset), rect.right - occlusionSampleInset);
  const clampY = (y: number): number =>
    Math.min(Math.max(y, rect.top + occlusionSampleInset), rect.bottom - occlusionSampleInset);
  const midX = clampX(rect.left + rect.width / 2);
  const midY = clampY(rect.top + rect.height / 2);
  return [
    [midX, midY],
    [midX, clampY(rect.top)],
    [midX, clampY(rect.bottom)],
    [clampX(rect.left), midY],
    [clampX(rect.right), midY],
  ];
};

const occluderRadius = (element: Element, view: Window): number => {
  const style = view.getComputedStyle(element);
  return Math.max(
    parsePixels(style.borderTopLeftRadius, 0),
    parsePixels(style.borderTopRightRadius, 0),
    parsePixels(style.borderBottomRightRadius, 0),
    parsePixels(style.borderBottomLeftRadius, 0),
  );
};

const intersectionArea = (rect: DOMRect, bounds: DOMRect): number => {
  const width = Math.min(rect.right, bounds.right) - Math.max(rect.left, bounds.left);
  const height = Math.min(rect.bottom, bounds.bottom) - Math.max(rect.top, bounds.top);
  return width > 0 && height > 0 ? width * height : 0;
};

const isVisibleOccluder = (candidate: OcclusionCandidate, view: Window): boolean => {
  if (candidate.visible !== undefined) return candidate.visible;
  for (let node: HTMLElement | null = candidate.element; node !== null; node = node.parentElement) {
    const style = view.getComputedStyle(node);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse' ||
      parseFirstNumber(style.opacity, 1) <= 0
    ) {
      candidate.visible = false;
      return false;
    }
  }
  candidate.visible = true;
  return true;
};

export const collectOccluders = (
  element: HTMLElement,
  bounds: DOMRect,
  ownerDocument: Document,
  view: Window,
  candidates: readonly OcclusionCandidate[] = [],
  includeInterior = false,
  context: OcclusionContext = {},
): Occluder[] => {
  if (context.hitTest === undefined && typeof ownerDocument.elementsFromPoint !== 'function') {
    return [];
  }

  // A document-wide refresh can probe the same point for several surfaces.
  // The caller may supply a per-frame cache so WebKit pays for each hit test once.
  const hitTest =
    context.hitTest ??
    ((x: number, y: number): Element[] => ownerDocument.elementsFromPoint?.(x, y) ?? []);

  const occluders = new Map<Element, Occluder>();
  const addOccluder = (entry: Element, rect: DOMRect): void => {
    if (rect.width <= 0 || rect.height <= 0) return;
    occluders.set(entry, {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      radius: occluderRadius(entry, view),
      area: intersectionArea(rect, bounds),
      topmost: entry.getAttribute('data-neoverse-glass-occluder') === 'topmost',
    });
  };
  for (const [x, y] of occlusionSamplePoints(bounds)) {
    const stack = hitTest(x, y);
    const elementIndex = stack.indexOf(element);
    // A missed hit (rounded corner outside its own silhouette) yields no
    // information about what is above; slice(-1) would wrongly treat the
    // whole stack as occluding, so skip the point instead.
    if (elementIndex <= 0) {
      continue;
    }
    for (const entry of stack.slice(0, elementIndex)) {
      if (element.contains(entry) || occluders.has(entry)) {
        continue;
      }
      // Native choice inputs deliberately cover the visible control with
      // opacity: 0 to preserve native hit testing. They do not cover its edge.
      if (!isVisibleOccluder({ element: entry as HTMLElement, rect: bounds }, view)) continue;
      addOccluder(entry, entry.getBoundingClientRect());
    }
    if (occluders.size >= maxOccluders) {
      break;
    }
  }

  // Probe actual overlapping Glass rectangles as well as the fixed samples.
  // This catches small overlays between sample points without a dense per-edge
  // hit-test grid. Rectangles are measured once per frame by the caller.
  for (const candidate of candidates) {
    // Callers that sort candidates by top can stop at the first rectangle below
    // the surface instead of scanning the rest of the document.
    if (context.sortedByTop === true && candidate.rect.top >= bounds.bottom) break;
    const entry = candidate.element;
    const rect = candidate.rect;
    if (
      entry === element ||
      (!includeInterior && element.contains(entry)) ||
      entry.contains(element) ||
      occluders.has(entry)
    )
      continue;

    const left = Math.max(bounds.left, rect.left);
    const right = Math.min(bounds.right, rect.right);
    const top = Math.max(bounds.top, rect.top);
    const bottom = Math.min(bounds.bottom, rect.bottom);
    if (left >= right || top >= bottom) continue;
    const reachesEdge =
      left <= bounds.left + occlusionSampleInset ||
      right >= bounds.right - occlusionSampleInset ||
      top <= bounds.top + occlusionSampleInset ||
      bottom >= bounds.bottom - occlusionSampleInset;
    if (!includeInterior && !reachesEdge) continue;

    // A non-interactive topmost overlay is absent from elementsFromPoint. Its
    // owner may explicitly declare that it sits above ordinary page surfaces.
    if (entry.getAttribute('data-neoverse-glass-occluder') !== 'topmost') {
      const stack = hitTest((left + right) / 2, (top + bottom) / 2);
      const targetIndex = stack.indexOf(element);
      const candidateIndex = stack.findIndex((item) => item === entry || entry.contains(item));
      if (targetIndex < 0 || candidateIndex < 0 || candidateIndex >= targetIndex) continue;
    }
    if (isVisibleOccluder(candidate, view)) addOccluder(entry, rect);
  }

  return [...occluders.values()]
    .sort(
      (first, second) => Number(second.topmost) - Number(first.topmost) || second.area - first.area,
    )
    .slice(0, maxOccluders);
};

const getAncestorClipRect = (element: HTMLElement, rect: ClipRect, view: Window): ClipRect => {
  let left = rect.left;
  let top = rect.top;
  let right = rect.right;
  let bottom = rect.bottom;

  for (let ancestor = element.parentElement; ancestor !== null; ancestor = ancestor.parentElement) {
    const style = view.getComputedStyle(ancestor);
    const overflowX = style.overflowX || style.overflow;
    const overflowY = style.overflowY || style.overflow;
    const clipX = clipsOverflowAxis(overflowX);
    const clipY = clipsOverflowAxis(overflowY);
    if (!clipX && !clipY) continue;

    const ancestorRect = ancestor.getBoundingClientRect();
    if (clipX) {
      left = Math.max(left, ancestorRect.left);
      right = Math.min(right, ancestorRect.right);
    }
    if (clipY) {
      top = Math.max(top, ancestorRect.top);
      bottom = Math.min(bottom, ancestorRect.bottom);
    }
  }

  return {
    left,
    top,
    right,
    bottom,
    width: Math.max(right - left, 0),
    height: Math.max(bottom - top, 0),
  };
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

const resolveColor = (
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

const resolveSurfaceOpacity = (
  element: HTMLElement,
  view: Window,
  cache: Map<Element, number | null> | undefined,
  ownStyle?: CSSStyleDeclaration,
): number | undefined => {
  const cached = cache?.get(element);
  if (cached !== undefined) return cached === null ? undefined : cached;

  const style = ownStyle ?? view.getComputedStyle(element);
  if (style.display === 'none') {
    cache?.set(element, null);
    return undefined;
  }

  const own = Math.min(Math.max(parseFirstNumber(style.opacity, 1), 0), 1);
  const parent = element.parentElement;
  let value = own;
  if (parent !== null) {
    const inherited = resolveSurfaceOpacity(parent, view, cache);
    if (inherited === undefined) {
      cache?.set(element, null);
      return undefined;
    }
    value = own * inherited;
  }

  cache?.set(element, value);
  return value;
};

const intersectsViewport = (rect: CanvasViewport, viewport: CanvasViewport): boolean =>
  rect.width > 0 &&
  rect.height > 0 &&
  rect.right > viewport.left &&
  rect.bottom > viewport.top &&
  rect.left < viewport.right &&
  rect.top < viewport.bottom;

const readStyle = (
  element: HTMLElement,
  view: Window,
  colorProbe: HTMLElement,
  viewport: CanvasViewport,
  measuredRect?: DOMRect,
  opacityCache?: Map<Element, number | null>,
): GlassStyle | undefined => {
  const style = view.getComputedStyle(element);
  const rect = measuredRect ?? element.getBoundingClientRect();
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
  // explicitly reproduce opacity applied to the surface and its ancestors.
  // Resolve the chain through a per-frame cache: a document-wide refresh visits
  // every surface, so an uncached walk costs one style resolution per ancestor
  // per surface.
  const surfaceOpacity = resolveSurfaceOpacity(element, view, opacityCache, style);
  if (surfaceOpacity === undefined || surfaceOpacity === 0) return undefined;

  // offsetWidth is measured in layout pixels; the renderer samples the
  // zoomed viewport box. This includes both the control's and its ancestors'
  // zoom without depending on a single inherited CSS zoom declaration.
  const scale = element.offsetWidth > 0 ? rect.width / element.offsetWidth : 1;
  const surfaceScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const pointer: GlassStyle['pointer'] = [0, 0, 0];
  if (element.hasAttribute('data-neoverse-tooltip-surface') && style.overflow === 'visible') {
    const arrow = view.getComputedStyle(element, '::after');
    const arrowWidth = parsePixels(arrow.width, 0) * surfaceScale;
    const arrowHeight = parsePixels(arrow.height, 0) * surfaceScale;
    if (arrow.display !== 'none' && arrowWidth > 0 && arrowHeight > 0) {
      // Read resolved pseudo-element geometry so custom pointer positions and
      // ancestor zoom keep the CSS fill and refractive contour aligned.
      pointer[0] =
        (parsePixels(arrow.left, rect.width / surfaceScale / 2) +
          parsePixels(style.borderLeftWidth, 0)) *
          surfaceScale -
        rect.width / 2;
      pointer[1] = arrowWidth / 2;
      pointer[2] = arrowHeight;
    }
  }
  const paintRect = {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom + pointer[2],
    width: rect.width,
    height: rect.height + pointer[2],
  };

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
    clipRect: getAncestorClipRect(element, paintRect, view),
    radii: getRadii(style, surfaceScale, rect.width, rect.height),
    pointer,
    edgeWidth,
    softness,
    opacity: opacity * surfaceOpacity,
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

class GlassRendererImpl implements GlassRenderer {
  private readonly ownerDocument: Document | undefined;
  private readonly maxDevicePixelRatio: number;
  private mounted = false;
  private active = false;
  private canvas: HTMLCanvasElement | undefined;
  private chromaCanvas: HTMLCanvasElement | undefined;
  private chromaContext: CanvasRenderingContext2D | undefined;
  private chromaUnavailable = false;
  private colorProbe: HTMLElement | undefined;
  private gl: GlassGl | undefined;
  private program: WebGLProgram | undefined;
  private locations: ProgramLocations | undefined;
  private buffer: WebGLBuffer | undefined;
  private resizeObserver: ResizeObserver | undefined;
  private readonly observedGlassElements = new Set<HTMLElement>();
  private readonly observedTableCells = new Set<HTMLElement>();
  private mutationObserver: MutationObserver | undefined;
  private transparencyQuery: MediaQueryList | undefined;
  private systemSchemeQuery: MediaQueryList | undefined;
  private animationFrame: number | undefined;
  private paintedEdges = false;
  private contextLost = false;
  private readonly animatedElements = new Set<Element>();
  // Occlusion depends on the surface box, the boxes of the surfaces that can
  // overlap it, and stacking/visibility mutations. Re-probing every point on
  // every animation frame made a Playground refresh cost seconds in WebKit.
  private readonly occlusionCache = new WeakMap<
    HTMLElement,
    { signature: string; revision: number; outer?: Occluder[]; interior?: Occluder[] }
  >();
  private surfaceRects = new Map<Element, DOMRect>();
  private mutationRevision = 0;
  private colorSignature = 0;
  private sceneColors: SceneColors | undefined;
  private sceneSignature = 0;
  private signatureHash = 2166136261;
  private lastFrameTime = 0;
  private readonly handleMotion = (event: Event): void => {
    if (!this.active || isStaticTransition(event)) {
      return;
    }
    const target = event.target as Element | null;
    if (
      typeof target?.matches !== 'function' ||
      (!target.closest(glassSelector) && !target.querySelector(glassSelector))
    ) {
      return;
    }
    this.animatedElements.add(target);
    this.scheduleRefresh();
  };
  private previousRendererAttribute: string | null = null;
  private readonly handleResize = (): void => {
    this.invalidateScene();
    this.scheduleRefresh();
  };
  private readonly handleScroll = (): void => {
    this.invalidateFrame();
    this.scheduleRefresh();
  };
  private readonly handleToggle = (): void => {
    this.invalidateScene();
    this.scheduleRefresh();
  };
  private readonly handleSystemSchemeChange = (): void => {
    this.invalidateScene();
    this.scheduleRefresh();
  };
  private readonly handleMutations = (records: MutationRecord[]): void => {
    if (records.some((record) => record.target === this.canvas)) this.syncChromaVisibility();
    if (records.every((record) => !this.isSceneMutation(record))) return;

    this.mutationRevision += 1;
    this.scheduleRefresh();
  };

  /** Decorative attribute churn cannot change edge geometry; only scene-bearing
   * mutations raise the revision and schedule a repaint. */
  private isSceneMutation(record: MutationRecord): boolean {
    const target = record.target;
    const element = target.nodeType === 1 ? (target as Element) : undefined;
    if (
      target === this.colorProbe ||
      target === this.canvas ||
      target === this.chromaCanvas ||
      element?.closest('[data-neoverse-particle-capture]')
    ) {
      return false;
    }
    if (record.type !== 'attributes') return true;
    const name = record.attributeName ?? '';
    if (sceneRelevantAttributes.has(name)) return true;
    if (name !== 'class' && name !== 'style') return true;
    if (element === undefined || element === this.ownerDocument?.documentElement) return true;
    if (element.matches?.(glassSelector) || element.closest(glassSelector)) return true;
    if (element.matches?.(occluderSelector) || element.closest(occluderSelector)) return true;
    // An ancestor can move or resize a surface without changing its attributes.
    return Boolean(element.querySelector?.(glassSelector));
  }
  private changedOverlaps(
    bounds: { left: number; top: number; width: number; height: number },
    changed: ReadonlySet<Element>,
    self: HTMLElement,
  ): boolean {
    for (const element of changed) {
      if (element === self) return true;
      const rect = this.surfaceRects.get(element);
      if (rect === undefined) return true;
      if (
        rect.left < bounds.left + bounds.width &&
        bounds.left < rect.left + rect.width &&
        rect.top < bounds.top + bounds.height &&
        bounds.top < rect.top + rect.height
      ) {
        return true;
      }
    }
    return false;
  }
  private collectCachedOccluders(
    element: HTMLElement,
    bounds: { left: number; top: number; width: number; height: number },
    includeInterior: boolean,
    changed: ReadonlySet<Element>,
    collect: () => Occluder[],
  ): Occluder[] {
    const signature = `${bounds.left}:${bounds.top}:${bounds.width}:${bounds.height}`;
    const cached = this.occlusionCache.get(element);
    const valid =
      cached !== undefined &&
      cached.signature === signature &&
      cached.revision === this.mutationRevision;
    const memo = valid ? (includeInterior ? cached.interior : cached.outer) : undefined;
    if (memo !== undefined && !this.changedOverlaps(bounds, changed, element)) return memo;

    const occluders = collect();
    if (valid && cached !== undefined) {
      if (includeInterior) cached.interior = occluders;
      else cached.outer = occluders;
    } else {
      this.occlusionCache.set(element, {
        signature,
        revision: this.mutationRevision,
        ...(includeInterior ? { interior: occluders } : { outer: occluders }),
      });
    }
    return occluders;
  }
  private readonly handleTransparencyChange = (event: MediaQueryListEvent): void => {
    if (event.matches) {
      this.deactivate();
    } else if (this.mounted && !this.active && !this.contextLost) {
      this.activate();
    }
  };
  private readonly handleContextLoss = (event: Event): void => {
    event.preventDefault();
    if (!this.active) return;

    this.contextLost = true;
    this.cancelScheduledRefresh();
    this.animatedElements.clear();
    this.disconnectObservers();
    if (this.canvas !== undefined) {
      this.canvas.style.display = 'none';
    }
    if (this.chromaCanvas !== undefined) this.chromaCanvas.style.display = 'none';
    this.restoreRendererAttribute();
    this.active = false;
  };
  private readonly handleContextRestore = (): void => {
    if (!this.mounted || !this.contextLost) return;

    this.discardLostContext();
    if (this.transparencyQuery?.matches !== true) {
      this.activate();
    }
  };

  public constructor(options: GlassRendererOptions) {
    this.ownerDocument = getDocument(options.document);
    this.maxDevicePixelRatio = normalizeMaxDevicePixelRatio(options.maxDevicePixelRatio);
  }

  public mount(): void {
    if (this.mounted || this.ownerDocument === undefined || this.ownerDocument.body === null) {
      return;
    }

    const existing = activeRenderers.get(this.ownerDocument);
    if (existing !== undefined && existing !== this) {
      return;
    }

    this.mounted = true;
    activeRenderers.set(this.ownerDocument, this);
    const view = getWindow(this.ownerDocument);
    this.transparencyQuery = view?.matchMedia?.(reducedTransparencyQuery);
    this.transparencyQuery?.addEventListener('change', this.handleTransparencyChange);
    this.systemSchemeQuery = view?.matchMedia?.(systemDarkQuery);
    this.systemSchemeQuery?.addEventListener('change', this.handleSystemSchemeChange);
    this.ownerDocument.addEventListener('scroll', this.handleScroll, true);
    this.ownerDocument.addEventListener('toggle', this.handleToggle, true);
    for (const event of motionEvents) {
      this.ownerDocument.addEventListener(event, this.handleMotion, true);
    }
    view?.addEventListener('scroll', this.handleScroll, { passive: true });
    view?.addEventListener('resize', this.handleResize);
    this.activate();
  }

  public refresh(force = true): void {
    if (this.active) {
      // The public contract stays forceful; pass false to let the frame cache deduplicate.
      this.render(force);
    }
  }

  public destroy(): void {
    if (!this.mounted) {
      return;
    }

    this.mounted = false;
    this.transparencyQuery?.removeEventListener('change', this.handleTransparencyChange);
    this.transparencyQuery = undefined;
    this.systemSchemeQuery?.removeEventListener('change', this.handleSystemSchemeChange);
    this.systemSchemeQuery = undefined;
    this.ownerDocument?.removeEventListener('scroll', this.handleScroll, true);
    this.ownerDocument?.removeEventListener('toggle', this.handleToggle, true);
    for (const event of motionEvents) {
      this.ownerDocument?.removeEventListener(event, this.handleMotion, true);
    }
    getWindow(this.ownerDocument)?.removeEventListener('scroll', this.handleScroll);
    getWindow(this.ownerDocument)?.removeEventListener('resize', this.handleResize);
    this.deactivate();
    if (this.ownerDocument !== undefined && activeRenderers.get(this.ownerDocument) === this) {
      activeRenderers.delete(this.ownerDocument);
    }
  }

  private activate(): void {
    if (
      !this.mounted ||
      this.active ||
      this.ownerDocument === undefined ||
      this.ownerDocument.body === null
    ) {
      return;
    }

    // A new GL context has no previous frame to reuse.
    this.invalidateScene();
    this.removeStaleCanvas();
    if (this.transparencyQuery?.matches === true) {
      return;
    }

    const canvas = this.ownerDocument.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.setAttribute('data-neoverse-glass-renderer-canvas', 'true');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '2147483646';

    const gl = this.getContext(canvas);
    if (gl === undefined) {
      return;
    }

    const program = createProgram(gl);
    const buffer = gl.createBuffer();
    if (program === undefined || buffer === null) {
      if (program !== undefined) {
        gl.deleteProgram(program);
      }
      return;
    }

    const locations: ProgramLocations = {
      position: gl.getAttribLocation(program, 'a_position'),
      viewport: gl.getUniformLocation(program, 'u_viewport'),
      rect: gl.getUniformLocation(program, 'u_rect'),
      rectSize: gl.getUniformLocation(program, 'u_rect_size'),
      pixelRatio: gl.getUniformLocation(program, 'u_pixel_ratio'),
      radii: gl.getUniformLocation(program, 'u_radii'),
      pointer: gl.getUniformLocation(program, 'u_pointer'),
      edgeWidth: gl.getUniformLocation(program, 'u_edge_width'),
      softness: gl.getUniformLocation(program, 'u_softness'),
      opacity: gl.getUniformLocation(program, 'u_opacity'),
      lightSurface: gl.getUniformLocation(program, 'u_light_surface'),
      cornerFocus: gl.getUniformLocation(program, 'u_corner_focus'),
      chroma: gl.getUniformLocation(program, 'u_chroma'),
      gain: gl.getUniformLocation(program, 'u_gain'),
      tertiary: gl.getUniformLocation(program, 'u_tertiary'),
      secondary: gl.getUniformLocation(program, 'u_secondary'),
      primary: gl.getUniformLocation(program, 'u_primary'),
      edgeLight: gl.getUniformLocation(program, 'u_edge_light'),
      carrier: gl.getUniformLocation(program, 'u_carrier'),
      occluders: gl.getUniformLocation(program, 'u_occluders'),
      occluderRadii: gl.getUniformLocation(program, 'u_occluder_radii'),
      occluderCount: gl.getUniformLocation(program, 'u_occluder_count'),
    };

    this.canvas = canvas;
    this.gl = gl;
    this.program = program;
    this.locations = locations;
    this.buffer = buffer;
    this.previousRendererAttribute =
      this.ownerDocument.documentElement.getAttribute(glassRendererAttribute);
    this.ownerDocument.documentElement.setAttribute(glassRendererAttribute, 'webgl');
    this.ownerDocument.body.append(canvas);
    const colorProbe = this.ownerDocument.createElement('span');
    colorProbe.setAttribute('aria-hidden', 'true');
    colorProbe.style.position = 'fixed';
    colorProbe.style.width = '0';
    colorProbe.style.height = '0';
    colorProbe.style.overflow = 'hidden';
    colorProbe.style.visibility = 'hidden';
    colorProbe.style.pointerEvents = 'none';
    this.ownerDocument.body.append(colorProbe);
    this.colorProbe = colorProbe;

    canvas.addEventListener('webglcontextlost', this.handleContextLoss);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestore);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadPositions, gl.STATIC_DRAW);
    gl.enable(gl.BLEND);
    // The draw pass selects the theme-specific alpha factors before painting.
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.observe();
    this.active = true;
    // A fresh GL context has no previous frame to reuse.
    this.refresh(true);
  }

  private removeStaleCanvas(): void {
    if (this.ownerDocument === undefined) {
      return;
    }

    const staleCanvases = this.ownerDocument.querySelectorAll<HTMLCanvasElement>(
      '[data-neoverse-glass-renderer-canvas], [data-neoverse-glass-chroma-canvas]',
    );
    for (const staleCanvas of staleCanvases) {
      staleCanvas.remove();
    }

    if (
      staleCanvases.length > 0 &&
      this.ownerDocument.documentElement.getAttribute(glassRendererAttribute) === 'webgl'
    ) {
      this.ownerDocument.documentElement.removeAttribute(glassRendererAttribute);
    }
  }

  private cancelScheduledRefresh(): void {
    if (this.animationFrame === undefined) return;

    getWindow(this.ownerDocument)?.cancelAnimationFrame(this.animationFrame);
    this.animationFrame = undefined;
  }

  private ensureChromaCanvas(): void {
    if (this.chromaCanvas || this.chromaUnavailable || !this.canvas || !this.ownerDocument) return;
    const view = getWindow(this.ownerDocument);
    if (
      typeof Path2D !== 'function' ||
      typeof Path2D.prototype.roundRect !== 'function' ||
      !view?.CSS?.supports('mix-blend-mode', 'saturation')
    ) {
      // The geometry signal is only safe to paint when the compositor can
      // interpret it as saturation rather than displaying its source color.
      this.chromaUnavailable = true;
      return;
    }
    const canvas = this.ownerDocument.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.setAttribute('data-neoverse-glass-chroma-canvas', 'true');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.display = 'none';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '2147483646';
    canvas.style.mixBlendMode = 'saturation';
    let context: CanvasRenderingContext2D | null = null;
    try {
      context = canvas.getContext('2d');
    } catch {
      // Keep the established edge if the optional color field is unavailable.
    }
    if (!context || typeof context.roundRect !== 'function') {
      this.chromaUnavailable = true;
      return;
    }
    this.chromaCanvas = canvas;
    this.chromaContext = context;
    this.canvas.before(canvas);
  }

  private syncChromaVisibility(): void {
    const view = getWindow(this.ownerDocument);
    if (!view || !this.canvas || !this.chromaCanvas) return;
    const visibility = view.getComputedStyle(this.canvas).visibility;
    if (this.chromaCanvas.style.visibility !== visibility) {
      this.chromaCanvas.style.visibility = visibility;
    }
  }

  /** Drop cached frame inputs so the next render cannot reuse a stale palette or geometry. */
  private invalidateScene(): void {
    this.colorSignature = 0;
    this.sceneColors = undefined;
    this.sceneSignature = 0;
    this.lastFrameTime = 0;
  }

  /** A scroll is an explicit geometry change; keep the palette cache but repaint. */
  private invalidateFrame(): void {
    this.sceneSignature = 0;
  }

  /** FNV-1a accumulation keeps the frame signature allocation-free on high-refresh displays. */
  private mixSignature(value: number): void {
    this.signatureHash ^= Math.round(value * 100) | 0;
    this.signatureHash = Math.imul(this.signatureHash, 16777619);
  }

  private mixSignatureText(value: string): void {
    for (let index = 0; index < value.length; index += 1) {
      this.signatureHash ^= value.charCodeAt(index);
      this.signatureHash = Math.imul(this.signatureHash, 16777619);
    }
  }

  private disconnectObservers(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.observedGlassElements.clear();
    this.observedTableCells.clear();
    this.mutationObserver?.disconnect();
    this.mutationObserver = undefined;
  }

  private restoreRendererAttribute(): void {
    if (this.ownerDocument === undefined) return;

    if (this.previousRendererAttribute === null) {
      this.ownerDocument.documentElement.removeAttribute(glassRendererAttribute);
    } else {
      this.ownerDocument.documentElement.setAttribute(
        glassRendererAttribute,
        this.previousRendererAttribute,
      );
    }
  }

  private discardLostContext(): void {
    if (this.canvas !== undefined) {
      this.canvas.removeEventListener('webglcontextlost', this.handleContextLoss);
      this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestore);
      this.canvas.remove();
    }
    this.canvas = undefined;
    this.chromaCanvas?.remove();
    this.chromaCanvas = undefined;
    this.chromaContext = undefined;
    this.chromaUnavailable = false;
    this.colorProbe?.remove();
    this.colorProbe = undefined;
    this.gl = undefined;
    this.program = undefined;
    this.locations = undefined;
    this.buffer = undefined;
    this.previousRendererAttribute = null;
    this.contextLost = false;
  }

  private deactivate(): void {
    this.cancelScheduledRefresh();
    this.animatedElements.clear();
    this.disconnectObservers();

    if (this.canvas !== undefined) {
      this.canvas.removeEventListener('webglcontextlost', this.handleContextLoss);
      this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestore);
      this.canvas.remove();
    }

    if (!this.contextLost && this.gl !== undefined && this.program !== undefined) {
      this.gl.deleteProgram(this.program);
    }
    if (!this.contextLost && this.gl !== undefined && this.buffer !== undefined) {
      this.gl.deleteBuffer(this.buffer);
    }

    this.restoreRendererAttribute();

    this.canvas = undefined;
    this.chromaCanvas?.remove();
    this.chromaCanvas = undefined;
    this.chromaContext = undefined;
    this.chromaUnavailable = false;
    this.colorProbe?.remove();
    this.colorProbe = undefined;
    this.gl = undefined;
    this.program = undefined;
    this.locations = undefined;
    this.buffer = undefined;
    this.previousRendererAttribute = null;
    this.contextLost = false;
    this.active = false;
  }

  private getContext(canvas: HTMLCanvasElement): GlassGl | undefined {
    try {
      const webgl2 = canvas.getContext('webgl2', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
      });
      if (webgl2 !== null) {
        return webgl2;
      }

      const webgl1 = canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
      });
      return webgl1 ?? undefined;
    } catch {
      return undefined;
    }
  }

  private observe(): void {
    if (this.ownerDocument === undefined || this.canvas === undefined) return;

    const view = getWindow(this.ownerDocument);
    const ResizeObserverConstructor = view?.ResizeObserver;
    if (ResizeObserverConstructor !== undefined) {
      this.resizeObserver = new ResizeObserverConstructor(this.handleResize);
    }

    const MutationObserverConstructor = view?.MutationObserver;
    const documentElement = this.ownerDocument.documentElement;
    if (MutationObserverConstructor !== undefined && documentElement !== null) {
      const mutationObserver = new MutationObserverConstructor(this.handleMutations);
      mutationObserver.observe(documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: [...glassMutationAttributes],
      });
      this.mutationObserver = mutationObserver;
    }
  }

  private scheduleRefresh(): void {
    if (!this.active || this.animationFrame !== undefined) {
      return;
    }

    const view = getWindow(this.ownerDocument);
    if (view?.requestAnimationFrame === undefined) {
      this.refresh();
      return;
    }

    // Reserve the frame slot before calling requestAnimationFrame so test
    // realms with a synchronous RAF shim cannot leave a stale frame id.
    this.animationFrame = -1;
    let completedSynchronously = false;
    const frame = view.requestAnimationFrame((timestamp: number) => {
      completedSynchronously = true;
      this.animationFrame = undefined;
      const elapsed =
        timestamp > 0 && this.lastFrameTime > 0
          ? timestamp - this.lastFrameTime
          : Number.POSITIVE_INFINITY;
      if (elapsed < minFrameIntervalMs) {
        // The cap defers the frame; it must not discard the request. A skipped
        // frame that is never rescheduled leaves the fixed canvas painting the
        // previous offset, so the rim stays visibly misaligned with its surface
        // after the gesture ends. Keep the request pending and paint on the next
        // frame that clears the interval; synchronous RAF shims report 0 and
        // stay on the immediate path. Rendering still stops once the scene rests.
        this.scheduleRefresh();
        return;
      }
      if (timestamp > 0) this.lastFrameTime = timestamp;
      // CSS transforms/opacity emit no DOM mutation or resize event, so the
      // static scene signature cannot see them. Scan the live animations first:
      // one that can move or reveal an edge has to repaint this frame rather
      // than be deduplicated against the previous one. Resting scenes keep the
      // signature dedup, and the interval cap above still bounds the rate.
      let movingEdges = false;
      for (const element of this.animatedElements) {
        const animations = element.getAnimations?.() ?? [];
        if (!element.isConnected || !animations.some(animationIsActive)) {
          this.animatedElements.delete(element);
        } else if (!isInHiddenTree(element) && animations.some(needsEdgeFrame)) {
          movingEdges = true;
        }
      }
      this.render(movingEdges);
      // Retain live decorative targets so clip/style changes can make them
      // relevant again, without reserving frames while their edges rest.
      if (movingEdges) this.scheduleRefresh();
    });
    if (!completedSynchronously) {
      this.animationFrame = frame;
    }
  }

  /** Theme colors change with the root token signature, not on every frame.
   * Caching avoids roughly forty probe style writes and computed-style reads
   * per repaint, and keeps the probe out of the mutation stream. */
  private resolveSceneColors(
    rootStyle: CSSStyleDeclaration,
    view: Window,
    probe: HTMLElement,
  ): SceneColors {
    this.signatureHash = 2166136261;
    this.mixSignatureText(rootStyle.colorScheme);
    for (const property of colorProperties) {
      this.mixSignatureText(rootStyle.getPropertyValue(property));
    }
    this.mixSignatureText(rootStyle.getPropertyValue('--neoverse-material-edge-refraction-gain'));
    const signature = this.signatureHash || 1;
    const cached = this.sceneColors;
    if (cached !== undefined && this.colorSignature === signature) return cached;
    const gain = Math.max(
      parseFirstNumber(rootStyle.getPropertyValue('--neoverse-material-edge-refraction-gain'), 1),
      0,
    );
    const edgeLight = resolveColor(
      rootStyle,
      [
        firstPropertyValue(rootStyle, ['--neoverse-color-edge-light', '--edge-light']) ??
          'var(--neoverse-color-edge-light)',
        'var(--edge-light)',
      ],
      view,
      probe,
      [1, 1, 1],
    );
    const lightSurface =
      rootStyle.colorScheme === 'light' ? 1 : rootStyle.colorScheme === 'dark' ? 0 : -1;
    // Match the shader's smoothstep(0.55, 0.88, luminance) > 0.5 fallback
    // when a consumer has not declared a color scheme.
    const lightLuminance = edgeLight[0] * 0.2126 + edgeLight[1] * 0.7152 + edgeLight[2] * 0.0722;
    const isLight = lightSurface === 1 || (lightSurface === -1 && lightLuminance > 0.715);
    const primary = resolveColor(
      rootStyle,
      [
        firstPropertyValue(rootStyle, ['--neoverse-color-accent-primary', '--accent-primary']) ??
          'var(--neoverse-color-accent-primary)',
        'var(--accent-primary)',
      ],
      view,
      probe,
      [0.45, 0.73, 0.9],
    );
    const secondary = resolveColor(
      rootStyle,
      [
        firstPropertyValue(rootStyle, [
          '--neoverse-color-accent-secondary',
          '--accent-secondary',
        ]) ?? 'var(--neoverse-color-accent-secondary)',
        'var(--accent-secondary)',
      ],
      view,
      probe,
      [0.3, 0.85, 0.7],
    );
    const tertiary = resolveColor(
      rootStyle,
      [
        firstPropertyValue(rootStyle, ['--neoverse-color-accent-tertiary', '--accent-tertiary']) ??
          'var(--neoverse-color-accent-tertiary)',
        'var(--accent-tertiary)',
      ],
      view,
      probe,
      [0.48, 0.43, 0.9],
    );
    const colors: SceneColors = {
      gain,
      edgeLight,
      primary,
      secondary,
      tertiary,
      lightSurface,
      isLight,
    };
    this.colorSignature = signature;
    this.sceneColors = colors;
    return colors;
  }

  private render(force = false): void {
    if (
      !this.active ||
      this.ownerDocument === undefined ||
      this.canvas === undefined ||
      this.gl === undefined ||
      this.program === undefined ||
      this.locations === undefined ||
      this.buffer === undefined ||
      this.colorProbe === undefined
    ) {
      return;
    }

    const view = getWindow(this.ownerDocument);
    if (view === undefined) {
      return;
    }

    const viewport = getCanvasViewport(this.canvas, this.ownerDocument, view);
    // One document-wide query feeds both the edge pass and the occlusion list.
    const candidates = Array.from(
      this.ownerDocument.querySelectorAll<HTMLElement>(
        `${glassSelector}, [data-neoverse-glass-occluder='topmost']`,
      ),
      (element): OcclusionCandidate => ({ element, rect: element.getBoundingClientRect() }),
    );
    const elements = this.getGlassElements(candidates.map(({ element }) => element));
    if (elements.length === 0 && !this.paintedEdges) return;
    const measuredRects = new Map(candidates.map(({ element, rect }) => [element, rect]));
    const visibleCandidates = candidates
      .filter(({ rect }) => intersectsViewport(rect, viewport))
      .sort((first, second) => first.rect.top - second.rect.top);
    const opacityCache = new Map<Element, number | null>();
    const hitTestCache = new Map<string, Element[]>();
    const hitTest = (x: number, y: number): Element[] => {
      const key = `${x},${y}`;
      const cached = hitTestCache.get(key);
      if (cached !== undefined) return cached;
      const stack = this.ownerDocument?.elementsFromPoint?.(x, y) ?? [];
      hitTestCache.set(key, stack);
      return stack;
    };
    const occlusionContext: OcclusionContext = { hitTest, sortedByTop: true };
    const ownerDocument = this.ownerDocument;
    const changedSurfaces = new Set<Element>();
    const surfaceRects = new Map<Element, DOMRect>();
    for (const { element, rect } of candidates) {
      surfaceRects.set(element, rect);
      const previous = this.surfaceRects.get(element);
      if (
        previous === undefined ||
        previous.left !== rect.left ||
        previous.top !== rect.top ||
        previous.width !== rect.width ||
        previous.height !== rect.height
      ) {
        changedSurfaces.add(element);
      }
    }
    this.surfaceRects = surfaceRects;
    const width = viewport.width;
    const height = viewport.height;
    const pixelRatio = resolveDevicePixelRatio(view, this.maxDevicePixelRatio);
    // Skip a full repaint when every input to the edge pass is unchanged. Keep
    // the compositing contract intact: no partial clear, no altered blend mode,
    // just the previous frame retained on the fixed canvas.
    this.signatureHash = 2166136261;
    this.mixSignature(this.mutationRevision);
    this.mixSignature(viewport.left);
    this.mixSignature(viewport.top);
    this.mixSignature(width);
    this.mixSignature(height);
    this.mixSignature(pixelRatio);
    for (const { rect } of candidates) {
      this.mixSignature(rect.left);
      this.mixSignature(rect.top);
      this.mixSignature(rect.width);
      this.mixSignature(rect.height);
    }
    for (const element of elements) {
      this.mixSignatureText(element.className);
      this.mixSignatureText(element.getAttribute?.('style') ?? '');
    }
    const sceneSignature = this.signatureHash || 1;
    if (!force && this.paintedEdges && this.sceneSignature === sceneSignature) return;
    this.sceneSignature = sceneSignature;
    const drawingWidth = Math.max(Math.round(width * pixelRatio), 1);
    const drawingHeight = Math.max(Math.round(height * pixelRatio), 1);
    if (this.canvas.width !== drawingWidth || this.canvas.height !== drawingHeight) {
      this.canvas.width = drawingWidth;
      this.canvas.height = drawingHeight;
    }
    const gl = this.gl;
    const locations = this.locations;
    gl.viewport(0, 0, drawingWidth, drawingHeight);
    gl.disable(gl.SCISSOR_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.paintedEdges = elements.length > 0;
    if (!this.paintedEdges) {
      if (this.chromaCanvas) this.chromaCanvas.style.display = 'none';
      this.observeTableCells(new Set());
      return;
    }
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(locations.position);
    gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(locations.viewport, width, height);
    gl.uniform1f(locations.pixelRatio, pixelRatio);

    const rootStyle = view.getComputedStyle(this.ownerDocument.documentElement);
    const { gain, edgeLight, primary, secondary, tertiary, lightSurface, isLight } =
      this.resolveSceneColors(rootStyle, view, this.colorProbe);
    gl.uniform1f(locations.gain, gain);
    if (isLight) this.ensureChromaCanvas();
    if (this.chromaCanvas && this.chromaContext) {
      if (!this.chromaCanvas.isConnected && this.canvas.isConnected) {
        this.canvas.before(this.chromaCanvas);
      }
      const display = isLight ? 'block' : 'none';
      if (this.chromaCanvas.style.display !== display) this.chromaCanvas.style.display = display;
      this.syncChromaVisibility();
      if (isLight) {
        if (
          this.chromaCanvas.width !== drawingWidth ||
          this.chromaCanvas.height !== drawingHeight
        ) {
          this.chromaCanvas.width = drawingWidth;
          this.chromaCanvas.height = drawingHeight;
        }
        this.chromaContext.setTransform(1, 0, 0, 1, 0, 0);
        this.chromaContext.clearRect(0, 0, drawingWidth, drawingHeight);
        this.chromaContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      }
    }
    const blendMode = isLight ? 'normal' : 'overlay';
    if (this.canvas.style.mixBlendMode !== blendMode) this.canvas.style.mixBlendMode = blendMode;
    // The 0.2.0 light renderer used blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA),
    // including SRC_ALPHA for alpha itself. Dark retains its current coverage.
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      isLight ? gl.SRC_ALPHA : gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
    gl.uniform1f(locations.lightSurface, lightSurface);

    gl.enable(gl.SCISSOR_TEST);
    const occluderRects = new Float32Array(maxOccluders * 4);
    const occluderRadii = new Float32Array(maxOccluders);
    const visibleTableCells = new Set<HTMLElement>();
    const uploadOccluders = (occluders: readonly Occluder[]): void => {
      if (locations.occluders === null || locations.occluderCount === null) return;
      let count = 0;
      for (const occluder of occluders) {
        occluderRects.set(
          [
            occluder.left - viewport.left,
            occluder.top - viewport.top,
            occluder.width,
            occluder.height,
          ],
          count * 4,
        );
        occluderRadii[count] = occluder.radius;
        count += 1;
      }
      gl.uniform4fv(locations.occluders, occluderRects);
      if (locations.occluderRadii !== null) gl.uniform1fv(locations.occluderRadii, occluderRadii);
      gl.uniform1f(locations.occluderCount, count);
    };
    for (const element of elements) {
      const table = element.matches(tableGlassSelector) ? (element as HTMLTableElement) : undefined;
      const measuredRect = measuredRects.get(element) ?? element.getBoundingClientRect();
      const rect = table ? getTableOuterRect(table, measuredRect) : measuredRect;
      // Skip surfaces the fixed canvas cannot show before reading their style:
      // a document-wide refresh otherwise resolves computed style and the
      // ancestor opacity chain for every offscreen control.
      if (!intersectsViewport(rect, viewport)) continue;
      const style = readStyle(element, view, this.colorProbe, viewport, rect, opacityCache);
      if (style === undefined) {
        continue;
      }

      const scissor = getScissorRect(
        style.clipRect,
        viewport,
        pixelRatio,
        drawingWidth,
        drawingHeight,
      );
      if (scissor.width === 0 || scissor.height === 0) {
        continue;
      }

      gl.uniform4f(
        locations.rect,
        style.rect.left - viewport.left,
        style.rect.top - viewport.top,
        style.rect.width,
        style.rect.height + style.pointer[2],
      );
      gl.uniform2f(locations.rectSize, style.rect.width, style.rect.height);
      gl.uniform4f(locations.radii, ...style.radii);
      gl.uniform3f(locations.pointer, ...style.pointer);
      gl.uniform1f(locations.edgeWidth, style.edgeWidth);
      gl.uniform1f(locations.softness, style.softness);
      gl.uniform1f(locations.opacity, style.opacity);
      gl.uniform1f(
        locations.cornerFocus,
        isLight ? 0.4 : element.classList.contains('ui-button') ? 1 : 0,
      );
      gl.uniform1f(locations.chroma, style.chroma);
      gl.uniform3f(locations.carrier, ...style.carrier);
      gl.uniform3f(locations.edgeLight, ...edgeLight);
      gl.uniform3f(locations.primary, ...primary);
      gl.uniform3f(locations.secondary, ...secondary);
      gl.uniform3f(locations.tertiary, ...tertiary);
      const occluders = this.collectCachedOccluders(
        element,
        style.rect,
        false,
        changedSurfaces,
        () =>
          collectOccluders(
            element,
            style.rect,
            ownerDocument,
            view,
            visibleCandidates,
            false,
            occlusionContext,
          ),
      );
      uploadOccluders(occluders);
      if (isLight && this.chromaContext) {
        paintBackdropChroma(this.chromaContext, style, viewport, occluders, gain);
      }
      for (const strip of getEdgeScissors(
        style,
        scissor,
        viewport,
        pixelRatio,
        drawingWidth,
        drawingHeight,
      )) {
        gl.scissor(strip.x, strip.y, strip.width, strip.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }

      if (!table) continue;
      const grid = getTableGridEdges(
        table,
        style.rect,
        style.clipRect,
        viewport,
        style.edgeWidth,
        view,
      );
      if (grid.length === 0) continue;
      // Unlike the outer rim, a grid can be covered by an overlay entirely
      // inside the table. Share one interior occlusion pass across its cells.
      uploadOccluders(
        this.collectCachedOccluders(element, style.rect, true, changedSurfaces, () =>
          collectOccluders(
            element,
            style.rect,
            ownerDocument,
            view,
            visibleCandidates,
            true,
            occlusionContext,
          ),
        ),
      );
      gl.uniform4f(locations.radii, 0, 0, 0, 0);
      gl.uniform3f(locations.pointer, 0, 0, 0);
      for (const { cell, rect: cellRect, strips } of grid) {
        visibleTableCells.add(cell);
        gl.uniform4f(
          locations.rect,
          cellRect.left - viewport.left,
          cellRect.top - viewport.top,
          cellRect.width,
          cellRect.height,
        );
        gl.uniform2f(locations.rectSize, cellRect.width, cellRect.height);
        for (const strip of strips) {
          const area = getScissorRect(strip, viewport, pixelRatio, drawingWidth, drawingHeight);
          if (area.width === 0 || area.height === 0) continue;
          gl.scissor(area.x, area.y, area.width, area.height);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }
    }
    gl.disable(gl.SCISSOR_TEST);
    this.observeTableCells(visibleTableCells);
  }

  private observeTableCells(current: Set<HTMLElement>): void {
    if (!this.resizeObserver) return;
    for (const cell of current) {
      if (this.observedTableCells.has(cell)) continue;
      this.observedTableCells.add(cell);
      if (!this.observedGlassElements.has(cell)) this.resizeObserver.observe(cell);
    }
    for (const cell of this.observedTableCells) {
      if (current.has(cell)) continue;
      if (!this.observedGlassElements.has(cell)) this.resizeObserver.unobserve(cell);
      this.observedTableCells.delete(cell);
    }
  }

  private getGlassElements(candidates?: readonly HTMLElement[]): HTMLElement[] {
    if (this.ownerDocument === undefined) {
      return [];
    }

    const elements =
      candidates ?? Array.from(this.ownerDocument.querySelectorAll<HTMLElement>(glassSelector));
    const currentElements: HTMLElement[] = [];

    for (const element of elements) {
      if (element.closest('[data-neoverse-particle-capture]')) continue;
      if (element.matches(cssEdgePassSelector)) {
        continue;
      }
      if (inheritsParentGlassEdge(element)) {
        continue;
      }

      const variant = getVariant(element);
      if (variant === undefined) {
        continue;
      }

      currentElements.push(element);
    }

    if (this.resizeObserver !== undefined) {
      // ResizeObserver fires an initial callback for every observe() call. Re-observing
      // unchanged elements on each render would therefore schedule another render and
      // loop forever, so only subscribe to elements that are not observed yet.
      for (const element of currentElements) {
        if (!this.observedGlassElements.has(element)) {
          this.observedGlassElements.add(element);
          if (!this.observedTableCells.has(element)) this.resizeObserver.observe(element);
        }
      }

      const currentSet = new Set(currentElements);
      for (const element of this.observedGlassElements) {
        if (!currentSet.has(element)) {
          if (!this.observedTableCells.has(element)) this.resizeObserver.unobserve(element);
          this.observedGlassElements.delete(element);
        }
      }
    }

    return currentElements;
  }
}

export const createGlassRenderer = (options: GlassRendererOptions = {}): GlassRenderer => {
  const document = getDocument(options.document);
  if (options.backend === 'native' && document && supportsNativeRefraction(document)) {
    return new NativeGlassRenderer(
      document,
      (element) => !inheritsParentGlassEdge(element),
      (renderer) => {
        const existing = activeRenderers.get(document);
        if (existing && existing !== renderer) return false;
        activeRenderers.set(document, renderer);
        return true;
      },
      (renderer) => {
        if (activeRenderers.get(document) === renderer) activeRenderers.delete(document);
      },
    );
  }
  return new GlassRendererImpl(options);
};

export type { Color as GlassRendererColor };
