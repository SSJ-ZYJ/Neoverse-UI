export const motionWakeEventName = 'neoverse-motion-start';

// Decorative indicators confined inside their own surface never move an edge
// or occlude another surface.
export const motionStaticSelector = [
  '.ui-control-surface__indicator',
  '.ui-navigation-item__indicator',
  '.ui-tabs__indicator',
  '.ui-pagination__indicator',
  '.ui-segmented-control__slider',
].join(', ');

const staticTransitionProperty =
  /^(?:color|box-shadow|text-shadow|fill|stroke|stroke-dashoffset|stroke-dasharray|caret-color|accent-color|text-decoration-color|background-position(?:-[xy])?|.+?-color)$/i;

const visualOnlyProperties = new Set([
  'transform',
  'translate',
  'rotate',
  'scale',
  'opacity',
  'filter',
  'clipPath',
  'clip-path',
  'visibility',
  'offset',
  'computedOffset',
  'easing',
  'composite',
  'backgroundPosition',
  'backgroundPositionX',
  'backgroundPositionY',
  'background-position',
  'background-position-x',
  'background-position-y',
  'color',
  'backgroundColor',
  'background-color',
  'borderColor',
  'border-color',
  'borderTopColor',
  'border-top-color',
  'borderRightColor',
  'border-right-color',
  'borderBottomColor',
  'border-bottom-color',
  'borderLeftColor',
  'border-left-color',
  'outlineColor',
  'outline-color',
  'caretColor',
  'caret-color',
  'accentColor',
  'accent-color',
  'textDecorationColor',
  'text-decoration-color',
  'boxShadow',
  'box-shadow',
  'textShadow',
  'text-shadow',
  'fill',
  'stroke',
  'strokeDashoffset',
  'stroke-dashoffset',
  'strokeDasharray',
  'stroke-dasharray',
]);

const staticKeyframeProperties = new Set([
  'offset',
  'computedOffset',
  'easing',
  'composite',
  'backgroundPosition',
  'backgroundPositionX',
  'backgroundPositionY',
  'background-position',
  'background-position-x',
  'background-position-y',
  'color',
  'backgroundColor',
  'background-color',
  'borderColor',
  'border-color',
  'borderTopColor',
  'border-top-color',
  'borderRightColor',
  'border-right-color',
  'borderBottomColor',
  'border-bottom-color',
  'borderLeftColor',
  'border-left-color',
  'outlineColor',
  'outline-color',
  'caretColor',
  'caret-color',
  'accentColor',
  'accent-color',
  'textDecorationColor',
  'text-decoration-color',
  'boxShadow',
  'box-shadow',
  'textShadow',
  'text-shadow',
  'fill',
  'stroke',
  'strokeDashoffset',
  'stroke-dashoffset',
  'strokeDasharray',
  'stroke-dasharray',
]);

export interface MotionTrackingContext {
  glassSelector: string;
  occluderSelector: string;
  getStyle: (element: Element) => CSSStyleDeclaration | undefined;
  isStrictTopLayerDescendant: (element: Element) => boolean;
}

export const animationIsActive = (animation: Animation): boolean =>
  animation.playState === 'running' || animation.pending;

const isStaticPropertyName = (property: string): boolean =>
  property === '--neoverse-button-tone-color' ||
  (property.length > 0 && !property.startsWith('--') && staticTransitionProperty.test(property));

/** Color-only and paint-only transitions cannot move a surface, change its clip,
 *  or alter occlusion. Track custom properties unless they only paint feedback. */
export function isStaticTransition(event: Event): boolean {
  const property = (event as TransitionEvent).propertyName;
  return typeof property === 'string' && isStaticPropertyName(property);
}

export function isInHiddenTree(
  element: Element,
  getStyle?: (target: Element) => CSSStyleDeclaration | undefined,
): boolean {
  if (element.getClientRects().length > 0) return false;
  const view = element.ownerDocument.defaultView;
  for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
    const style = getStyle ? getStyle(ancestor) : view?.getComputedStyle(ancestor);
    if (style?.display === 'none') return true;
  }
  return false;
}

export function shouldTrackMotionEvent(
  event: Event,
  target: Element,
  glassSelector: string,
  occluderSelector: string,
): boolean {
  if (isStaticTransition(event) || target.closest(motionStaticSelector)) {
    return false;
  }
  if (event.type === motionWakeEventName) {
    return true;
  }
  const nearSurface = Boolean(
    target.closest(glassSelector) ||
      target.closest(occluderSelector) ||
      target.querySelector(glassSelector) ||
      target.querySelector(occluderSelector),
  );
  if (
    event.type === 'transitionrun' ||
    event.type === 'transitionstart' ||
    event.type === 'transitionend' ||
    event.type === 'transitioncancel' ||
    event.type === 'animationstart' ||
    event.type === 'animationend' ||
    event.type === 'animationcancel'
  ) {
    if (nearSurface) return true;
    if (event.type.startsWith('transition')) {
      const property = (event as TransitionEvent).propertyName;
      // Layout-affecting transitions on non-glass siblings can shift adjacent Glass.
      if (
        typeof property === 'string' &&
        property.length > 0 &&
        !visualOnlyProperties.has(property)
      ) {
        return true;
      }
    }
    return false;
  }
  return nearSurface;
}

export function needsEdgeFrame(animation: Animation, context: MotionTrackingContext): boolean {
  if (!animationIsActive(animation)) return false;
  if (
    'transitionProperty' in animation &&
    typeof animation.transitionProperty === 'string' &&
    isStaticPropertyName(animation.transitionProperty)
  ) {
    return false;
  }

  const effect = animation.effect;
  if (!effect || !('getKeyframes' in effect)) return true;

  const keyframeEffect = effect as KeyframeEffect;
  if (keyframeEffect.pseudoElement?.startsWith('::view-transition')) return false;

  const target = keyframeEffect.target;
  if (target) {
    if (!target.isConnected || isInHiddenTree(target, context.getStyle)) return false;
    if (target.closest(motionStaticSelector)) return false;
  }

  const properties: string[] = [];
  for (const frame of keyframeEffect.getKeyframes()) {
    for (const key of Object.keys(frame)) {
      if (key !== 'offset' && key !== 'computedOffset' && key !== 'easing' && key !== 'composite') {
        properties.push(key);
      }
    }
  }

  if (
    properties.length > 0 &&
    properties.every((property) => staticKeyframeProperties.has(property))
  ) {
    return false;
  }

  if (properties.length > 0 && properties.every((property) => visualOnlyProperties.has(property))) {
    if (!target) return true;
    const affectsSurface =
      target.matches(context.glassSelector) ||
      target.matches(context.occluderSelector) ||
      target.querySelector(context.glassSelector) !== null ||
      target.querySelector(context.occluderSelector) !== null;
    if (!affectsSurface) return false;
    // Surfaces inside the native top layer keep CSS edges; only the top-layer
    // container itself stays tracked while moving to update underlying occlusion.
    if (context.isStrictTopLayerDescendant(target)) return false;
    return true;
  }

  // Layout-affecting animations (including WAAPI width/height and details::details-content).
  const timing =
    typeof keyframeEffect.getComputedTiming === 'function'
      ? keyframeEffect.getComputedTiming()
      : undefined;
  if (
    timing?.iterations === Number.POSITIVE_INFINITY &&
    target &&
    !target.matches(context.glassSelector) &&
    !target.querySelector(context.glassSelector)
  ) {
    return false;
  }
  return true;
}

export function hasAnyDocumentEdgeMotion(
  ownerDocument: Document,
  context: MotionTrackingContext,
): boolean {
  const animations = ownerDocument.getAnimations?.();
  if (!animations || animations.length === 0) return false;
  for (const animation of animations) {
    if (needsEdgeFrame(animation, context)) return true;
  }
  return false;
}

export function hasActiveEdgeMotion(
  ownerDocument: Document,
  animatedElements: Set<Element>,
  context: MotionTrackingContext,
): boolean {
  let moving = false;
  for (const element of animatedElements) {
    const animations = element.getAnimations?.() ?? [];
    if (!element.isConnected || !animations.some(animationIsActive)) {
      animatedElements.delete(element);
    } else if (!moving && animations.some((animation) => needsEdgeFrame(animation, context))) {
      moving = true;
    }
  }
  if (moving) return true;
  return hasAnyDocumentEdgeMotion(ownerDocument, context);
}
