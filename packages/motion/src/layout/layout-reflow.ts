import { motionRoles } from '../foundation/motion-tokens.js';

interface Position {
  readonly x: number;
  readonly y: number;
}

/** Animate retained controls when a nested group changes its children */
export function attachLayoutReflow(
  root: HTMLElement,
  group: HTMLElement,
  itemSelector: string,
): () => void {
  const view = root.ownerDocument.defaultView;
  if (!view?.ResizeObserver || typeof root.animate !== 'function') return () => undefined;

  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  const moving = new Map<Element, { animation: Animation; x: number; y: number }>();
  let resizing: Animation | undefined;

  function measure() {
    const positions = new Map<Element, Position>();
    const groupBox = group.getBoundingClientRect();
    const anchor = root.parentElement?.getBoundingClientRect();
    // Cache local CSS pixels so preview zoom does not look like a layout change.
    const box = root.getBoundingClientRect();
    const height = root.offsetHeight;
    const scaleX = box.width / root.offsetWidth || 1;
    const scaleY = box.height / height || 1;
    for (const element of root.children) record(element, anchor);
    for (const element of group.children) {
      if (element.matches(itemSelector)) record(element, groupBox);
    }
    return { positions, height };

    function record(element: Element, parent: Position | undefined) {
      const { x, y } = element === group ? groupBox : element.getBoundingClientRect();
      positions.set(element, {
        x: (x - (parent?.x ?? 0)) / scaleX,
        y: (y - (parent?.y ?? 0)) / scaleY,
      });
    }
  }

  let previous = measure();

  function cancel() {
    for (const { animation } of moving.values()) animation.cancel();
    moving.clear();
    resizing?.cancel();
    resizing = undefined;
  }

  function reset() {
    cancel();
    previous = measure();
  }

  const resize = new view.ResizeObserver(() => {
    if (moving.size === 0 && !resizing) previous = measure();
  });
  resize.observe(root);
  resize.observe(group);

  const changes = new view.MutationObserver(() => {
    // Retarget from the visible frame without reading positions in the new layout.
    for (const [element, { animation, x, y }] of moving) {
      const origin = previous.positions.get(element);
      const remaining = 1 - (animation.effect?.getComputedTiming().progress ?? 0);
      if (origin) {
        previous.positions.set(element, {
          x: origin.x + x * remaining,
          y: origin.y + y * remaining,
        });
      }
    }
    const originHeight = resizing ? root.offsetHeight : previous.height;
    const origins = previous.positions;
    reset();
    if (reduced.matches) return;

    const style = view.getComputedStyle(root);
    const time = style.getPropertyValue(motionRoles.spatial.duration).trim();
    const duration = Number.parseFloat(time) * (time.endsWith('ms') ? 1 : 1000);
    if (!Number.isFinite(duration) || duration <= 1) return;
    const timing: KeyframeAnimationOptions = {
      duration,
      easing: style.getPropertyValue(motionRoles.spatial.easing).trim(),
      fill: 'both',
    };
    const heightDelta = originHeight - previous.height;
    const height = Number.parseFloat(style.height);
    if (Math.abs(heightDelta) > 0.5 && Number.isFinite(height)) {
      const animation = root.animate(
        [{ height: `${Math.max(0, height + heightDelta)}px` }, { height: `${height}px` }],
        timing,
      );
      resizing = animation;
      animation.onfinish = () => {
        if (resizing !== animation) return;
        animation.cancel();
        resizing = undefined;
      };
    }
    for (const [element, destination] of previous.positions) {
      const origin = origins.get(element);
      if (!origin) continue;
      const x = origin.x - destination.x;
      const y = origin.y - destination.y;
      if (Math.abs(x) <= 0.5 && Math.abs(y) <= 0.5) continue;
      const animation = element.animate(
        [{ transform: `translate(${x}px, ${y}px)` }, { transform: 'none' }],
        { ...timing, composite: 'add' },
      );
      moving.set(element, { animation, x, y });
      animation.onfinish = () => {
        if (moving.get(element)?.animation !== animation) return;
        animation.cancel();
        moving.delete(element);
      };
    }
    if (moving.size || resizing) {
      root.dispatchEvent(new view.Event('neoverse-motion-start', { bubbles: true }));
    }
  });
  changes.observe(group, { childList: true });
  view.addEventListener('resize', reset);
  reduced.addEventListener('change', reset);

  return () => {
    changes.disconnect();
    resize.disconnect();
    view.removeEventListener('resize', reset);
    reduced.removeEventListener('change', reset);
    cancel();
  };
}
