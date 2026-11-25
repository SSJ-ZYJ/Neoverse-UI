import type { ClipRect } from './overflow-clip.js';
import type { Basis2D, Radii } from './surface-geometry.js';

export type ChromaSurface = {
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
  opacity: number;
};

export type ChromaViewport = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ChromaOccluder = {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
};

export const paintBackdropChroma = (
  context: CanvasRenderingContext2D,
  style: ChromaSurface,
  viewport: ChromaViewport,
  occluders: readonly ChromaOccluder[],
  gain: number,
  boostLowerRight: boolean,
): void => {
  const opacity = Math.min(style.opacity * 0.7 * gain, 0.55);
  if (opacity <= 0) return;
  const lineWidth = Math.max(style.edgeWidth, 0.75);
  // Canvas centers the stroke on this path. Magnification must not push its
  // outer half past the rounded contour that the surface paints.
  const inset = Math.max(0.65, lineWidth / 2);
  const width = Math.max(style.width - inset * 2, 0);
  const height = Math.max(style.height - inset * 2, 0);
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
  let x: number;
  let y: number;
  if (style.rotated) {
    context.translate(style.centerX - viewport.left, style.centerY - viewport.top);
    context.transform(style.basis[0], style.basis[1], style.basis[2], style.basis[3], 0, 0);
    context.translate(-style.width / 2, -style.height / 2);
    x = inset;
    y = inset;
  } else {
    x = style.centerX - style.width / 2 - viewport.left + inset;
    y = style.centerY - style.height / 2 - viewport.top + inset;
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
  context.lineWidth = lineWidth;
  const reach = Math.max(Math.min(width * 0.5, height * 1.25), 16);
  const shortSide = Math.min(style.width, style.height);
  const size = boostLowerRight ? Math.min(Math.max((shortSide - 64) / 80, 0), 1) : 0;
  const cornerBoost = size * size * (3 - 2 * size) * 1.5;
  const boostEnd = Math.min(shortSide * 0.36, 96) / reach;
  for (let corner = 0; corner < 2; corner += 1) {
    const lowerRight = corner === 1;
    const cx = lowerRight ? x + width : x;
    const cy = lowerRight ? y + height + style.pointer[2] : y;
    const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, reach);
    gradient.addColorStop(0, 'rgb(255 0 0)');
    if (lowerRight && cornerBoost > 0) {
      // Return to the original gradient beyond the arc's lighting footprint.
      const boostedOpacity = Math.min(opacity * (1 + cornerBoost), 0.68);
      context.globalAlpha = boostedOpacity;
      gradient.addColorStop(
        boostEnd,
        `rgb(255 0 0 / ${(opacity / boostedOpacity) * (1 - boostEnd)})`,
      );
    } else {
      context.globalAlpha = opacity;
    }
    gradient.addColorStop(1, 'rgb(255 0 0 / 0%)');
    context.strokeStyle = gradient;
    context.stroke(path);
  }
  context.restore();
};
