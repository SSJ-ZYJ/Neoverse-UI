const maxDefaultDevicePixelRatio = 2;

export type CanvasViewport = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export const normalizeMaxDevicePixelRatio = (candidate: number | undefined): number => {
  if (candidate === undefined || !Number.isFinite(candidate)) {
    return maxDefaultDevicePixelRatio;
  }

  return Math.max(candidate, 1);
};

export const resolveDevicePixelRatio = (view: Window, maximum: number): number => {
  const candidate = view.devicePixelRatio;
  const ratio = Number.isFinite(candidate) && candidate > 0 ? candidate : 1;
  return Math.min(Math.max(ratio, 1), maximum);
};

export const getCanvasViewport = (
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

export const intersectsViewport = (rect: CanvasViewport, viewport: CanvasViewport): boolean =>
  rect.width > 0 &&
  rect.height > 0 &&
  rect.right > viewport.left &&
  rect.bottom > viewport.top &&
  rect.left < viewport.right &&
  rect.top < viewport.bottom;
