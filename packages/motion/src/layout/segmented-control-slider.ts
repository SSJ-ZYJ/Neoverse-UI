import { appearanceMotionAttribute } from '../transitions/appearance-transition.js';

const stretchKeyframes: Keyframe[] = [
  { transform: 'scaleX(1)', easing: 'ease-out' },
  { transform: 'scaleX(1.12)', offset: 0.24, easing: 'ease-out' },
  { transform: 'scaleX(1)' },
];

type DragOption = { button: HTMLButtonElement; center: number; width: number };
type Drag = {
  options: DragOption[];
  first: DragOption;
  last: DragOption;
  startCenter: number;
  scale: number;
  center: number;
};

const dragThreshold = 5;

function dragCenter(drag: Drag, delta: number): number {
  const center = drag.startCenter + delta / drag.scale;
  return Math.max(drag.first.center, Math.min(drag.last.center, center));
}

function dragWidth(drag: Drag): number {
  let previous = drag.first;
  for (const next of drag.options) {
    if (drag.center > next.center) {
      previous = next;
      continue;
    }
    if (next.center === previous.center) return next.width;
    const progress = (drag.center - previous.center) / (next.center - previous.center);
    return previous.width + (next.width - previous.width) * progress;
  }
  return previous.width;
}

function nearestEnabled(drag: Drag, center: number): HTMLButtonElement | undefined {
  let result: HTMLButtonElement | undefined;
  let closest = Infinity;
  for (const option of drag.options) {
    const distance = Math.abs(option.center - center);
    if (option.button.disabled || distance >= closest) continue;
    result = option.button;
    closest = distance;
  }
  return result;
}

/** Move the segmented thumb independently of the committed radio selection */
export function attachSegmentedControlSlider(track: HTMLElement): () => void {
  const view = track.ownerDocument.defaultView;
  if (!view) return () => undefined;

  const root = track.ownerDocument.documentElement;
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  let slider: HTMLElement | null = null;
  let target: HTMLButtonElement | null = null;
  let pressed: HTMLButtonElement | null = null;
  let pointerId: number | undefined;
  let originX = 0;
  let originY = 0;
  let drag: Drag | undefined;
  let draggedPointer: number | undefined;
  let frame = 0;
  let readyFrame = 0;
  let stretch: Animation | undefined;

  const measure = () => {
    frame = 0;
    const nextSlider = track.querySelector<HTMLElement>('.ui-segmented-control__slider');
    if (nextSlider !== slider) {
      view.cancelAnimationFrame(readyFrame);
      stretch?.cancel();
      slider = nextSlider;
      target = null;
    }
    if (!slider) return;

    // A View Transition paints frozen snapshots of the page, so geometry has to
    // land before the incoming snapshot is captured. Sliding underneath the
    // snapshot only replays the stale frame after the reveal.
    const instant = root.hasAttribute(appearanceMotionAttribute);
    slider.toggleAttribute('data-instant', instant);

    const preview = !reducedMotion.matches && pressed?.parentElement === track && !pressed.disabled;
    const next = preview
      ? pressed
      : track.querySelector<HTMLButtonElement>('button[aria-checked="true"]');
    const wasDragging = slider.hasAttribute('data-dragging');
    const width = drag ? dragWidth(drag) : next?.offsetWidth;
    const height = slider.offsetHeight;
    if (!next || !width) return;

    const offset = `${drag ? drag.center - width / 2 : next.offsetLeft}px`;
    const inlineSize = `${width}px`;
    slider.toggleAttribute('data-dragging', Boolean(drag));
    if (offset !== slider.style.getPropertyValue('--segment-active-offset')) {
      slider.style.setProperty('--segment-active-offset', offset);
      if (
        !instant &&
        !drag &&
        !wasDragging &&
        target &&
        target !== next &&
        !reducedMotion.matches &&
        stretch?.playState !== 'running'
      ) {
        stretch = slider.animate?.(stretchKeyframes, { duration: 240 });
      }
    }
    if (inlineSize !== slider.style.getPropertyValue('--segment-active-width')) {
      slider.style.setProperty('--segment-active-width', inlineSize);
    }
    if (!target) slider.parentElement?.style.setProperty('--segment-active-column', '1 / -1');
    if (height > 0) {
      slider.dataset.circular = width <= Math.max(height + 1, height * 1.05) ? 'true' : 'false';
    } else {
      slider.removeAttribute('data-circular');
    }
    slider.toggleAttribute('data-pressed', !reducedMotion.matches && Boolean(preview || drag));
    if (!target) {
      readyFrame = view.requestAnimationFrame(() => {
        if (slider) slider.dataset.ready = 'true';
      });
    }
    target = next;
  };

  const schedule = () => {
    if (!frame) frame = view.requestAnimationFrame(measure);
  };
  const stopTracking = () => {
    view.removeEventListener('pointermove', onPointerMove, true);
    view.removeEventListener('pointerup', onPointerUp, true);
    view.removeEventListener('pointercancel', onPointerCancel, true);
    view.removeEventListener('blur', endPress);
    const capturedPointer = pointerId;
    pressed = null;
    drag = undefined;
    pointerId = undefined;
    if (capturedPointer !== undefined && track.hasPointerCapture(capturedPointer)) {
      track.releasePointerCapture(capturedPointer);
    }
  };
  const endPress = () => {
    stopTracking();
    schedule();
  };
  const onPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || pointerId !== undefined) return;
    const button = (event.target as Element).closest<HTMLButtonElement>('button[role="radio"]');
    if (button?.parentElement !== track || button.disabled) return;
    draggedPointer = undefined;
    pressed = button;
    pointerId = event.pointerId;
    originX = event.clientX;
    originY = event.clientY;
    view.addEventListener('pointermove', onPointerMove, true);
    view.addEventListener('pointerup', onPointerUp, true);
    view.addEventListener('pointercancel', onPointerCancel, true);
    view.addEventListener('blur', endPress);
    schedule();
  };
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== pointerId || !pressed) return;

    const delta = event.clientX - originX;
    if (!drag) {
      if (Math.abs(delta) < Math.max(dragThreshold, Math.abs(event.clientY - originY))) return;
      const options: DragOption[] = [];
      let startCenter: number | undefined;
      for (const child of track.children) {
        if (!child.matches('button[role="radio"]:enabled')) continue;
        const button = child as HTMLButtonElement;
        const width = button.offsetWidth;
        if (!width) continue;
        const center = button.offsetLeft + width / 2;
        options.push({ button, center, width });
        if (button === pressed) startCenter = center;
      }
      if (options.length < 2 || startCenter === undefined || !track.offsetWidth) return;
      options.sort((left, right) => left.center - right.center);
      const scale = track.getBoundingClientRect().width / track.offsetWidth;
      const first = options[0];
      const last = options.at(-1);
      if (!scale || !first || !last) return;
      drag = { options, first, last, startCenter, scale, center: startCenter };
      stretch?.cancel();
      track.setPointerCapture(event.pointerId);
    }
    drag.center = dragCenter(drag, delta);
    schedule();
  };
  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    if (!drag) {
      endPress();
      return;
    }
    const { top, bottom } = track.getBoundingClientRect();
    const selected =
      event.clientY >= top && event.clientY <= bottom
        ? nearestEnabled(drag, dragCenter(drag, event.clientX - originX))
        : undefined;
    draggedPointer = event.pointerId;
    endPress();
    if (selected?.parentElement === track) {
      selected.focus({ preventScroll: true });
      selected.click();
    }
  };
  const onPointerCancel = (event: PointerEvent) => {
    if (event.pointerId === pointerId) endPress();
  };
  const onLostPointerCapture = (event: PointerEvent) => {
    if (event.target === track) onPointerCancel(event);
  };
  const onPointerOut = (event: PointerEvent) => {
    if (
      !drag &&
      event.pointerId === pointerId &&
      !track.contains(event.relatedTarget as Node | null)
    ) {
      endPress();
    }
  };
  const onClick = (event: MouseEvent) => {
    // Pointer capture can still deliver a native click after the drag has activated its option.
    if (draggedPointer === undefined || !event.detail) return;
    if ((event as PointerEvent).pointerId !== draggedPointer && event.target !== track) return;
    draggedPointer = undefined;
    event.preventDefault();
    event.stopPropagation();
  };
  const onMotionChange = () => {
    if (reducedMotion.matches) stretch?.cancel();
    schedule();
  };

  const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule);
  const observeSizes = () => {
    resize?.disconnect();
    resize?.observe(track);
    for (const button of track.querySelectorAll('button')) {
      if (button.parentElement === track) resize?.observe(button);
    }
  };
  const changes = new MutationObserver((records) => {
    if (records.some((record) => record.type === 'childList' && record.target === track)) {
      observeSizes();
    }
    schedule();
  });
  changes.observe(track, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['aria-checked', 'disabled'],
  });
  // Release the instant commit as soon as the appearance snapshot is gone so
  // later selections animate normally again.
  const appearance = new MutationObserver(schedule);
  appearance.observe(root, { attributes: true, attributeFilter: [appearanceMotionAttribute] });
  track.addEventListener('pointerdown', onPointerDown);
  track.addEventListener('lostpointercapture', onLostPointerCapture);
  track.addEventListener('pointerout', onPointerOut);
  track.addEventListener('click', onClick, true);
  reducedMotion.addEventListener('change', onMotionChange);
  observeSizes();
  measure();

  return () => {
    track.removeEventListener('pointerdown', onPointerDown);
    track.removeEventListener('lostpointercapture', onLostPointerCapture);
    track.removeEventListener('pointerout', onPointerOut);
    track.removeEventListener('click', onClick, true);
    reducedMotion.removeEventListener('change', onMotionChange);
    changes.disconnect();
    appearance.disconnect();
    resize?.disconnect();
    stretch?.cancel();
    stopTracking();
    slider?.removeAttribute('data-ready');
    slider?.removeAttribute('data-pressed');
    slider?.removeAttribute('data-dragging');
    slider?.removeAttribute('data-instant');
    slider?.removeAttribute('data-circular');
    view.cancelAnimationFrame(frame);
    view.cancelAnimationFrame(readyFrame);
  };
}
