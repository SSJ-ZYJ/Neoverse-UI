import type { ClipRect } from '../overflow-clip.js';
import type { GlassStyle } from './style-resolution.js';
import type { CanvasViewport } from './viewport.js';

export const getScissorRect = (
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

export const getEdgeScissors = (
  style: GlassStyle,
  scissor: ReturnType<typeof getScissorRect>,
  viewport: CanvasViewport,
  pixelRatio: number,
  drawingWidth: number,
  drawingHeight: number,
): ReturnType<typeof getScissorRect>[] => {
  if (style.rotated) return [scissor];
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
  const width = style.width - padding * 2;
  const height = style.height - padding * 2;
  if (width <= 0 || height <= 0) return [scissor];
  const rectLeft = style.centerX - style.width / 2;
  const rectTop = style.centerY - style.height / 2;
  const inner = getScissorRect(
    {
      left: rectLeft + padding,
      top: rectTop + padding,
      right: rectLeft + style.width - padding,
      bottom: rectTop + style.height - padding,
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
