import { motionRoles } from './motion-tokens.js';

/** Choose the persistent boxes and attributes that participate in layout size motion */
export interface LayoutSizeMotionOptions {
  /** Selector relative to the root. Defaults to `[data-neoverse-size-motion]`. */
  readonly targets?: string;
  /** Attributes that can resize the targets. Defaults to `class`, `style`, and `hidden`. */
  readonly attributes?: readonly string[];
  /** Label boxes that stay on one line while resizing. Defaults to `[data-neoverse-size-motion-label]`. */
  readonly singleLineLabels?: string;
}

interface Size {
  readonly inlineSize: number;
  readonly blockSize: number;
}

const tolerance = 0.5;
const labelFrame: Keyframe = { whiteSpace: 'nowrap', overflow: 'clip', minWidth: '0px' };
const labelFrames = [labelFrame, labelFrame];

/**
 * Animate natural width and height changes in a mounted group of controls.
 * ResizeObserver only caches geometry; DOM updates start the motion.
 * Call the returned function when unmounting to stop observing and release fills.
 */
export function attachLayoutSizeMotion(
  root: HTMLElement,
  {
    targets = '[data-neoverse-size-motion]',
    attributes = ['class', 'style', 'hidden'],
    singleLineLabels = '[data-neoverse-size-motion-label]',
  }: LayoutSizeMotionOptions = {},
): () => void {
  const owner = root.ownerDocument.defaultView;
  if (!owner?.ResizeObserver || typeof owner.Element.prototype.animate !== 'function')
    return () => undefined;
  const view = owner;

  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  const sizes = new Map<Element, Size | undefined>();
  const active = new Map<Element, { size: Animation; labels: Animation[] }>();
  const observer = new view.ResizeObserver((entries) => {
    for (const { target, borderBoxSize } of entries) {
      if (sizes.has(target) && !active.has(target)) sizes.set(target, borderBoxSize[0]);
    }
  });

  function observe(element: Element): void {
    if (sizes.has(element)) return;
    sizes.set(element, undefined);
    observer.observe(element, { box: 'border-box' });
  }

  function cancel(element: Element): void {
    const animation = active.get(element);
    if (!animation) return;
    active.delete(element);
    animation.size.cancel();
    for (const label of animation.labels) label.cancel();
  }

  function cancelAll(): void {
    for (const element of active.keys()) cancel(element);
  }

  function animate(changed: Set<HTMLElement>): void {
    if (changed.size === 0 || reduced.matches) return;
    // Read the interrupted frame before releasing any fills. Measure every
    // natural endpoint before starting a new animation that can affect layout.
    const previous = new Map<HTMLElement, Size>();
    for (const element of changed) {
      const size = sizes.get(element);
      if (!size?.inlineSize || !size.blockSize) continue;
      previous.set(
        element,
        active.has(element)
          ? { inlineSize: element.offsetWidth, blockSize: element.offsetHeight }
          : size,
      );
    }
    if (previous.size === 0) return;

    for (const element of previous.keys()) cancel(element);

    const style = view.getComputedStyle(root);
    const time = style.getPropertyValue(motionRoles.spatial.duration).trim();
    const duration = Number.parseFloat(time) * (time.endsWith('ms') ? 1 : 1000);
    if (!Number.isFinite(duration) || duration <= 1) return;
    const easing = style.getPropertyValue(motionRoles.spatial.easing).trim();
    const pending = [];
    for (const [element, old] of previous) {
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      if (!width || !height) continue;
      const css = view.getComputedStyle(element);
      const from: Keyframe = {};
      const to: Keyframe = {};
      // Keep fixed component min/max sizes from clamping the animated axis.
      // Computed width/height use the element's own box sizing (native inputs
      // can be content-box); offset dimensions are the untransformed border box.
      if (Math.abs(width - old.inlineSize) > tolerance) {
        const end = Number.parseFloat(css.width);
        if (Number.isFinite(end)) {
          const start = Math.max(0, end + old.inlineSize - width);
          from.width = from.minWidth = from.maxWidth = `${start}px`;
          to.width = to.minWidth = to.maxWidth = `${end}px`;
        }
      }
      if (Math.abs(height - old.blockSize) > tolerance) {
        const end = Number.parseFloat(css.height);
        if (Number.isFinite(end)) {
          const start = Math.max(0, end + old.blockSize - height);
          from.height = from.minHeight = from.maxHeight = `${start}px`;
          to.height = to.minHeight = to.maxHeight = `${end}px`;
        }
      }
      if (from.width === undefined && from.height === undefined) continue;
      sizes.set(element, { inlineSize: width, blockSize: height });
      pending.push({ element, from, to });
    }
    if (pending.length === 0) return;
    const lockedLabels = new Set<Element>();
    const timing: KeyframeAnimationOptions = { duration, easing, fill: 'both' };
    for (const { element, from, to } of pending) {
      const labels: Animation[] = [];
      for (const label of element.querySelectorAll(singleLineLabels)) {
        if (lockedLabels.has(label)) continue;
        lockedLabels.add(label);
        // Keep the live copy on one line while the label's viewport changes.
        // Do not clip the control itself: its focus and material stay visible.
        labels.push(label.animate(labelFrames, timing));
      }
      const animation = element.animate([from, to], timing);
      active.set(element, { size: animation, labels });
      void animation.finished.then(
        () => {
          if (active.get(element)?.size === animation) cancel(element);
        },
        () => undefined,
      );
    }
  }

  root.querySelectorAll(targets).forEach(observe);
  const mutations = new view.MutationObserver((records) => {
    const changed = new Set<HTMLElement>();
    for (const { target, type, addedNodes, removedNodes } of records) {
      const element = target instanceof view.Element ? target : target.parentElement;
      if (!element || !root.contains(element)) continue;
      let candidate = element.closest(targets);
      while (candidate && root.contains(candidate)) {
        if (sizes.has(candidate)) {
          if (candidate instanceof view.HTMLElement) changed.add(candidate);
        } else {
          observe(candidate);
        }
        candidate = candidate.parentElement?.closest(targets) ?? null;
      }
      if (type === 'attributes' || addedNodes.length > 0 || removedNodes.length > 0) {
        element.querySelectorAll<HTMLElement>(targets).forEach((child) => {
          if (sizes.has(child)) changed.add(child);
          else observe(child);
        });
      }
    }
    if (records.some(({ removedNodes }) => removedNodes.length > 0)) {
      for (const element of sizes.keys()) {
        if (root.contains(element)) continue;
        cancel(element);
        sizes.delete(element);
        observer.unobserve(element);
      }
    }
    animate(changed);
  });
  mutations.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...attributes],
  });
  view.addEventListener('resize', cancelAll);
  reduced.addEventListener('change', cancelAll);

  return () => {
    mutations.disconnect();
    observer.disconnect();
    view.removeEventListener('resize', cancelAll);
    reduced.removeEventListener('change', cancelAll);
    cancelAll();
    sizes.clear();
  };
}
