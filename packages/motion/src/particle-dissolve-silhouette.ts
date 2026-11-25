import { CAPTURE_EXCLUDE_SELECTOR } from './particle-dissolve-types.js';

interface DustBox {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  alpha: number;
  color: string;
}

interface DustGlyph {
  text: string;
  x: number;
  y: number;
  height: number;
  fontSize: number;
  font: string;
  alpha: number;
  color: string;
}

interface DustSilhouette {
  boxes: DustBox[];
  glyphs: DustGlyph[];
}

const DUST_BOX_LIMIT = 260;
const DUST_TEXT_GLYPH_LIMIT = 3_000;

function hasDirectText(element: Element): boolean {
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0) {
      return true;
    }
  }
  return false;
}

function isPaintedSurface(style: CSSStyleDeclaration): boolean {
  return (
    (style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent') ||
    style.backgroundImage !== 'none'
  );
}

export function visibleSourceBand(sourceRect: DOMRect): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const left = Math.max(sourceRect.left, 0);
  const top = Math.max(sourceRect.top, 0);
  const right = Math.min(sourceRect.right, window.innerWidth);
  const bottom = Math.min(sourceRect.bottom, window.innerHeight);
  return {
    left,
    top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

/**
 * Approximate the region's visible silhouette from the DOM. Painted surfaces
 * contribute mass boxes and direct text is rasterized glyph by glyph at its
 * measured DOM position, so the fallback mask can use the same WebGL sampling
 * grid as the HTML-in-Canvas capture path.
 */
function collectDustSilhouette(
  source: HTMLElement,
  band: { left: number; top: number; width: number; height: number },
  fallbackInk: string,
): DustSilhouette {
  const boxes: DustBox[] = [];
  const glyphs: DustGlyph[] = [];

  const pushBox = (rect: DOMRect, alpha: number, color: string, radius: number): void => {
    if (boxes.length >= DUST_BOX_LIMIT) return;
    const x = Math.max(rect.left, band.left);
    const y = Math.max(rect.top, band.top);
    const right = Math.min(rect.right, band.left + band.width);
    const bottom = Math.min(rect.bottom, band.top + band.height);
    const width = right - x;
    const height = bottom - y;
    if (width < 2 || height < 2) return;
    boxes.push({
      x,
      y,
      width,
      height,
      radius: Math.min(radius, Math.min(width, height) / 2),
      alpha,
      color,
    });
  };

  const readOpacity = (element: HTMLElement, style: CSSStyleDeclaration): number => {
    let opacity = Number.parseFloat(style.opacity);
    if (!Number.isFinite(opacity)) opacity = 1;
    let parent = element.parentElement;
    while (parent !== null) {
      const parentOpacity = Number.parseFloat(getComputedStyle(parent).opacity);
      if (Number.isFinite(parentOpacity)) opacity *= parentOpacity;
      if (parent === source) break;
      parent = parent.parentElement;
    }
    return opacity;
  };

  const collectTextGlyphs = (
    element: HTMLElement,
    style: CSSStyleDeclaration,
    alpha: number,
  ): void => {
    if (glyphs.length >= DUST_TEXT_GLYPH_LIMIT) return;
    const fontSize = Number.parseFloat(style.fontSize) || 16;
    const font = `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const color = style.color || fallbackInk;
    const transform = style.textTransform;

    for (const node of element.childNodes) {
      if (glyphs.length >= DUST_TEXT_GLYPH_LIMIT) break;
      if (node.nodeType !== Node.TEXT_NODE) continue;
      const content = node.textContent ?? '';
      if (content.trim().length === 0) continue;
      const range = document.createRange();
      for (let offset = 0; offset < content.length && glyphs.length < DUST_TEXT_GLYPH_LIMIT; ) {
        const codePoint = content.codePointAt(offset);
        if (codePoint === undefined) break;
        const rawGlyph = String.fromCodePoint(codePoint);
        const nextOffset = offset + rawGlyph.length;
        offset = nextOffset;
        if (/^\s+$/u.test(rawGlyph)) continue;

        range.setStart(node, nextOffset - rawGlyph.length);
        range.setEnd(node, nextOffset);
        const rect = range.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 2) continue;
        if (rect.right <= band.left || rect.left >= band.left + band.width) continue;
        if (rect.bottom <= band.top || rect.top >= band.top + band.height) continue;

        const text =
          transform === 'uppercase'
            ? rawGlyph.toUpperCase()
            : transform === 'lowercase'
              ? rawGlyph.toLowerCase()
              : rawGlyph;
        glyphs.push({
          text,
          x: rect.left,
          y: rect.top,
          height: rect.height,
          fontSize,
          font,
          alpha,
          color,
        });
      }
      range.detach();
    }
  };

  const visit = (element: HTMLElement): void => {
    const rect = element.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    if (rect.bottom <= band.top || rect.top >= band.top + band.height) return;
    const style = getComputedStyle(element);
    const opacity = readOpacity(element, style);
    if (style.visibility === 'hidden' || style.display === 'none' || opacity === 0) {
      return;
    }

    if (isPaintedSurface(style) && boxes.length < DUST_BOX_LIMIT) {
      const radius = Number.parseFloat(style.borderTopLeftRadius) || 0;
      const hasColor =
        style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent';
      pushBox(
        rect,
        opacity * (hasColor ? 1 : 0.2),
        hasColor ? style.backgroundColor : fallbackInk,
        radius,
      );
    }

    if (hasDirectText(element) && glyphs.length < DUST_TEXT_GLYPH_LIMIT) {
      collectTextGlyphs(element, style, opacity);
    }
  };

  const walk = (element: Element, depth: number): void => {
    if ((boxes.length >= DUST_BOX_LIMIT && glyphs.length >= DUST_TEXT_GLYPH_LIMIT) || depth > 14) {
      return;
    }
    for (const child of element.children) {
      if (boxes.length >= DUST_BOX_LIMIT && glyphs.length >= DUST_TEXT_GLYPH_LIMIT) return;
      if (!(child instanceof HTMLElement)) continue;
      if (child.matches(CAPTURE_EXCLUDE_SELECTOR)) continue;
      visit(child);
      walk(child, depth + 1);
    }
  };

  visit(source);
  walk(source, 0);
  return { boxes, glyphs };
}

/**
 * Paint a synthetic silhouette mask for browsers without HTML-in-Canvas.
 * WebGL emits the particles on its normal preset grid; this texture only marks
 * where visible content exists, avoiding the extra random thinning that made
 * the fallback much sparser than captured HTML.
 */
export function paintDustTexture(
  context: CanvasRenderingContext2D,
  source: HTMLElement,
  sourceRect: DOMRect,
  dpr: number,
): void {
  context.reset?.();
  const band = visibleSourceBand(sourceRect);
  if (band.width <= 0 || band.height <= 0) return;

  const ink = getComputedStyle(source).color;
  const accent =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--neoverse-color-accent-primary')
      .trim() || ink;
  const { boxes, glyphs } = collectDustSilhouette(source, band, accent);

  context.save();
  context.scale(dpr, dpr);
  context.beginPath();
  context.rect(band.left, band.top, band.width, band.height);
  context.clip();

  if (boxes.length === 0 && glyphs.length === 0) {
    context.globalAlpha = 0.35;
    context.fillStyle = accent;
    context.fillRect(band.left, band.top, band.width, band.height);
    context.restore();
    return;
  }

  /* Surface mass first, then actual glyph shapes, like the captured page. */
  for (const box of boxes) {
    context.beginPath();
    if (box.radius > 0 && typeof context.roundRect === 'function') {
      context.roundRect(box.x, box.y, box.width, box.height, box.radius);
    } else {
      context.rect(box.x, box.y, box.width, box.height);
    }
    context.globalAlpha = box.alpha;
    context.fillStyle = box.color;
    context.fill();
  }

  context.textBaseline = 'alphabetic';
  context.textAlign = 'left';
  for (const glyph of glyphs) {
    context.globalAlpha = glyph.alpha;
    context.fillStyle = glyph.color;
    context.font = glyph.font;
    const baseline = glyph.y + (glyph.height - glyph.fontSize) / 2 + glyph.fontSize * 0.8;
    context.fillText(glyph.text, glyph.x, baseline);
  }
  context.restore();
}
