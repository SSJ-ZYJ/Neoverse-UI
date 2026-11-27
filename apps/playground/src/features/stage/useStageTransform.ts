import { computed, ref, watch } from 'vue';

const interactive = [
  'a',
  'button',
  'input',
  'label',
  'select',
  'textarea',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="link"]',
  '[role="listbox"]',
  '[role="option"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="switch"]',
  '[role="tab"]',
].join(', ');

const nudgeSteps: Record<string, readonly [number, number] | undefined> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

export const minStageZoom = 25;
export const maxStageZoom = 400;
const defaultZoom = 100;
export const stageZoomTrackSteps = 1000;
export const stageZoomStepRatio = 1.1;
const zoomRatio = Math.log(maxStageZoom / minStageZoom);

function zoomFromTrack(position: number): number {
  const ratio = Math.min(1, Math.max(0, position / stageZoomTrackSteps));
  return minStageZoom * Math.exp(zoomRatio * ratio);
}

function trackFromZoom(value: number): number {
  return Math.round(
    (Math.log(Math.min(maxStageZoom, Math.max(minStageZoom, value)) / minStageZoom) / zoomRatio) *
      stageZoomTrackSteps,
  );
}

/** Own stage pan and logarithmic zoom without reflowing specimen layout. */
export function createStageTransform(specimenId: () => string | undefined) {
  const offset = ref({ x: 0, y: 0 });
  const dragging = ref(false);
  const zoom = ref(defaultZoom);
  let dragOrigin: { pointerX: number; pointerY: number; x: number; y: number } | null = null;

  const zoomTrack = computed(() => trackFromZoom(zoom.value));
  // Magnification is visual only: translate and scale are not backdrop roots,
  // so nested Aurora Glass keeps sampling the stage without reflowing layout.
  const contentStyle = computed(() => ({
    '--stage-offset-x': `${offset.value.x}px`,
    '--stage-offset-y': `${offset.value.y}px`,
    '--stage-scale': zoom.value / defaultZoom,
  }));

  function startDrag(event: PointerEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    dragOrigin = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: offset.value.x,
      y: offset.value.y,
    };
    dragging.value = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function startStageDrag(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    const target = event.target;
    if (target instanceof Element && target.closest(interactive) !== null) return;
    startDrag(event);
  }

  function dragMove(event: PointerEvent): void {
    if (dragOrigin === null) return;
    offset.value = {
      x: dragOrigin.x + event.clientX - dragOrigin.pointerX,
      y: dragOrigin.y + event.clientY - dragOrigin.pointerY,
    };
  }

  function endDrag(event: PointerEvent): void {
    if (dragOrigin === null) return;
    dragOrigin = null;
    dragging.value = false;
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
  }

  function resetPosition(): void {
    offset.value = { x: 0, y: 0 };
  }

  function nudge(event: KeyboardEvent): void {
    if (event.key === 'Home') {
      event.preventDefault();
      resetPosition();
      return;
    }
    const direction = nudgeSteps[event.key];
    if (direction === undefined) return;
    event.preventDefault();
    const step = event.shiftKey ? 24 : 8;
    offset.value = {
      x: offset.value.x + direction[0] * step,
      y: offset.value.y + direction[1] * step,
    };
  }

  function adjustZoom(ratio: number): void {
    zoom.value = Math.min(maxStageZoom, Math.max(minStageZoom, zoom.value * ratio));
  }

  function updateZoom(event: Event): void {
    const value = Number.parseFloat((event.target as HTMLInputElement).value);
    if (!Number.isFinite(value)) return;
    zoom.value = zoomFromTrack(value);
  }

  function zoomWithWheel(event: WheelEvent): void {
    if (!event.ctrlKey || event.deltaY === 0) return;
    event.preventDefault();
    const previous = zoom.value;
    const next = Math.min(
      maxStageZoom,
      Math.max(minStageZoom, previous * Math.exp(-event.deltaY * 0.0012)),
    );
    if (Math.abs(next - previous) < 0.1) return;
    const area = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const delta = next / defaultZoom - previous / defaultZoom;
    offset.value = {
      x: offset.value.x + (event.clientX - area.left - area.width / 2) * delta,
      y: offset.value.y + (event.clientY - area.top - area.height / 2) * delta,
    };
    zoom.value = next;
  }

  function resetZoom(): void {
    zoom.value = defaultZoom;
    resetPosition();
  }

  watch(specimenId, resetZoom);

  return {
    dragging,
    zoom,
    zoomTrack,
    contentStyle,
    startDrag,
    startStageDrag,
    dragMove,
    endDrag,
    nudge,
    resetPosition,
    adjustZoom,
    updateZoom,
    zoomWithWheel,
    resetZoom,
  };
}
