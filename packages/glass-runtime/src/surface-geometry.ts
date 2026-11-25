export type Radii = [number, number, number, number];
export type Basis2D = [number, number, number, number];
export type Mat2 = [number, number, number, number];

export type SurfaceGeometry = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  basis: Basis2D;
  scaleX: number;
  scaleY: number;
  rotated: boolean;
};

export type SurfaceVisualState = {
  opacity: number;
  blur: number;
};

export type StyleGetter = (element: Element) => CSSStyleDeclaration;

const identityMat2: Mat2 = [1, 0, 0, 1];
const mat2Mul = (first: Mat2, second: Mat2): Mat2 => [
  first[0] * second[0] + first[2] * second[1],
  first[1] * second[0] + first[3] * second[1],
  first[0] * second[2] + first[2] * second[3],
  first[1] * second[2] + first[3] * second[3],
];

export const parseFirstNumber = (value: string, fallback: number): number => {
  const match = /-?[\d.]+/.exec(value);
  if (match === null) return fallback;
  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const parsePixels = (value: string, fallback: number): number => {
  const match = /-?[\d.]+\s*px/.exec(value);
  return parseFirstNumber(match === null ? value : match[0], fallback);
};

const parseAngleRadians = (token: string): number | undefined => {
  const trimmed = token.trim().toLowerCase();
  const value = Number.parseFloat(trimmed);
  if (!Number.isFinite(value)) return undefined;
  if (trimmed.endsWith('deg')) return (value * Math.PI) / 180;
  if (trimmed.endsWith('rad')) return value;
  if (trimmed.endsWith('grad')) return (value * Math.PI) / 200;
  if (trimmed.endsWith('turn')) return value * Math.PI * 2;
  return value === 0 ? 0 : undefined;
};

const parseScaleToken = (token: string): number | undefined => {
  const trimmed = token.trim();
  const value = Number.parseFloat(trimmed);
  if (!Number.isFinite(value)) return undefined;
  return trimmed.endsWith('%') ? value / 100 : value;
};

const parseRotateProperty = (value: string): Mat2 => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'none') return identityMat2;
  const parts = trimmed.split(/\s+/);
  let angle: number | undefined;
  if (parts.length === 1) {
    angle = parseAngleRadians(parts[0] ?? '');
  } else if (parts.length === 2) {
    const axis = parts[0]?.toLowerCase();
    if (axis !== 'z') return identityMat2;
    angle = parseAngleRadians(parts[1] ?? '');
  } else if (parts.length === 4) {
    const x = Number.parseFloat(parts[0] ?? '0');
    const y = Number.parseFloat(parts[1] ?? '0');
    const z = Number.parseFloat(parts[2] ?? '0');
    const parsed = parseAngleRadians(parts[3] ?? '');
    if (parsed !== undefined && x === 0 && y === 0 && z !== 0) {
      angle = z < 0 ? -parsed : parsed;
    }
  }
  if (!angle) return identityMat2;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c, s, -s, c];
};

const parseScaleProperty = (value: string): Mat2 => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'none') return identityMat2;
  const parts = trimmed.split(/\s+/);
  const sx = parseScaleToken(parts[0] ?? '');
  if (sx === undefined) return identityMat2;
  const sy = parts[1] !== undefined ? (parseScaleToken(parts[1]) ?? sx) : sx;
  return [sx, 0, 0, sy];
};

const parseTransformProperty = (value: string): Mat2 => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'none') return identityMat2;
  const matrixMatch = /^matrix\(([^)]+)\)$/.exec(trimmed);
  if (matrixMatch?.[1]) {
    const nums = matrixMatch[1].split(',').map((part) => Number.parseFloat(part.trim()));
    if (nums.length >= 4 && nums.slice(0, 4).every(Number.isFinite)) {
      return [nums[0] ?? 1, nums[1] ?? 0, nums[2] ?? 0, nums[3] ?? 1];
    }
  }
  const matrix3dMatch = /^matrix3d\(([^)]+)\)$/.exec(trimmed);
  if (matrix3dMatch?.[1]) {
    const nums = matrix3dMatch[1].split(',').map((part) => Number.parseFloat(part.trim()));
    if (nums.length >= 6 && nums.every(Number.isFinite)) {
      return [nums[0] ?? 1, nums[1] ?? 0, nums[4] ?? 0, nums[5] ?? 1];
    }
  }
  let result: Mat2 = identityMat2;
  const fnPattern = /([a-z0-9-]+)\(([^)]*)\)/gi;
  for (const match of trimmed.matchAll(fnPattern)) {
    const fn = match[1]?.toLowerCase() ?? '';
    const args = (match[2] ?? '').split(',').map((part) => part.trim());
    let next: Mat2 = identityMat2;
    if (fn === 'rotate' || fn === 'rotatez') {
      const angle = parseAngleRadians(args[0] ?? '');
      if (angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        next = [c, s, -s, c];
      }
    } else if (fn === 'scale') {
      const sx = parseScaleToken(args[0] ?? '') ?? 1;
      const sy = args[1] !== undefined ? (parseScaleToken(args[1]) ?? sx) : sx;
      next = [sx, 0, 0, sy];
    } else if (fn === 'scalex') {
      next = [parseScaleToken(args[0] ?? '') ?? 1, 0, 0, 1];
    } else if (fn === 'scaley') {
      next = [1, 0, 0, parseScaleToken(args[0] ?? '') ?? 1];
    } else if (fn === 'skewx') {
      const angle = parseAngleRadians(args[0] ?? '');
      if (angle) next = [1, 0, Math.tan(angle), 1];
    } else if (fn === 'skewy') {
      const angle = parseAngleRadians(args[0] ?? '');
      if (angle) next = [1, Math.tan(angle), 0, 1];
    } else if (fn === 'skew') {
      const ax = parseAngleRadians(args[0] ?? '') ?? 0;
      const ay = args[1] !== undefined ? (parseAngleRadians(args[1]) ?? 0) : 0;
      if (ax || ay) next = [1, Math.tan(ay), Math.tan(ax), 1];
    } else if (fn === 'matrix') {
      const nums = args.map((part) => Number.parseFloat(part));
      if (nums.length >= 4 && nums.slice(0, 4).every(Number.isFinite)) {
        next = [nums[0] ?? 1, nums[1] ?? 0, nums[2] ?? 0, nums[3] ?? 1];
      }
    }
    result = mat2Mul(result, next);
  }
  return result;
};

const resolveCumulativeMatrix = (
  element: Element,
  getStyle: StyleGetter,
  cache: Map<Element, Mat2>,
): Mat2 => {
  const cached = cache.get(element);
  if (cached !== undefined) return cached;

  const parent = element.parentElement;
  let total = parent !== null ? resolveCumulativeMatrix(parent, getStyle, cache) : identityMat2;
  const style = getStyle(element);
  const zoomRaw = (style as CSSStyleDeclaration & { zoom?: string }).zoom;
  if (zoomRaw) {
    const zoom = parseScaleToken(zoomRaw);
    if (zoom !== undefined && zoom > 0 && Math.abs(zoom - 1) > 1e-4) {
      total = mat2Mul(total, [zoom, 0, 0, zoom]);
    }
  }
  if (style.rotate && style.rotate !== 'none') {
    total = mat2Mul(total, parseRotateProperty(style.rotate));
  }
  if (style.scale && style.scale !== 'none') {
    total = mat2Mul(total, parseScaleProperty(style.scale));
  }
  if (style.transform && style.transform !== 'none') {
    total = mat2Mul(total, parseTransformProperty(style.transform));
  }
  cache.set(element, total);
  return total;
};

export function resolveSurfaceGeometry(
  element: HTMLElement,
  rect: DOMRect,
  getStyle: StyleGetter,
  matrixCache: Map<Element, Mat2>,
): SurfaceGeometry {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const rawScaleX = element.offsetWidth > 0 ? rect.width / element.offsetWidth : 1;
  const scaleX = Number.isFinite(rawScaleX) && rawScaleX > 0 ? rawScaleX : 1;
  const rawScaleY = element.offsetHeight > 0 ? rect.height / element.offsetHeight : scaleX;
  const scaleY = Number.isFinite(rawScaleY) && rawScaleY > 0 ? rawScaleY : scaleX;

  const total = resolveCumulativeMatrix(element, getStyle, matrixCache);
  const rotated = Math.abs(total[1]) > 1e-4 || Math.abs(total[2]) > 1e-4;
  const localWidth = element.offsetWidth;
  const localHeight = element.offsetHeight;
  if (!rotated || localWidth <= 0 || localHeight <= 0) {
    return {
      centerX,
      centerY,
      width: rect.width,
      height: rect.height,
      basis: [1, 0, 0, 1],
      scaleX,
      scaleY,
      rotated: false,
    };
  }

  let ux = total[0] * (localWidth / 2);
  let uy = total[1] * (localWidth / 2);
  let vx = total[2] * (localHeight / 2);
  let vy = total[3] * (localHeight / 2);
  const aabbW = 2 * (Math.abs(ux) + Math.abs(vx));
  const aabbH = 2 * (Math.abs(uy) + Math.abs(vy));
  const denom = aabbW * aabbW + aabbH * aabbH;
  const fit = denom > 0 ? (rect.width * aabbW + rect.height * aabbH) / denom : 1;
  if (Number.isFinite(fit) && fit > 0) {
    ux *= fit;
    uy *= fit;
    vx *= fit;
    vy *= fit;
  }
  const drawWidth = 2 * Math.hypot(ux, uy);
  const drawHeight = 2 * Math.hypot(vx, vy);
  if (
    !Number.isFinite(drawWidth) ||
    !Number.isFinite(drawHeight) ||
    drawWidth <= 0 ||
    drawHeight <= 0
  ) {
    return {
      centerX,
      centerY,
      width: rect.width,
      height: rect.height,
      basis: [1, 0, 0, 1],
      scaleX,
      scaleY,
      rotated: false,
    };
  }
  const halfW = drawWidth / 2;
  const halfH = drawHeight / 2;
  return {
    centerX,
    centerY,
    width: drawWidth,
    height: drawHeight,
    basis: [ux / halfW, uy / halfW, vx / halfH, vy / halfH],
    scaleX: drawWidth / localWidth,
    scaleY: drawHeight / localHeight,
    rotated: true,
  };
}

export function getRadii(
  style: CSSStyleDeclaration,
  scaleX: number,
  scaleY: number,
  width: number,
  height: number,
): Radii {
  const scale = Math.min(scaleX, scaleY);
  const parseCorner = (value: string): number => {
    const token = value.trim().split(/\s+/)[0] ?? '';
    if (token.endsWith('%')) {
      const percent = Number.parseFloat(token);
      return Number.isFinite(percent) && percent > 0
        ? (percent / 100) * Math.min(width, height)
        : 0;
    }
    return Math.max(parsePixels(token, 0) * scale, 0);
  };
  const tr = parseCorner(style.borderTopRightRadius);
  const br = parseCorner(style.borderBottomRightRadius);
  const bl = parseCorner(style.borderBottomLeftRadius);
  const tl = parseCorner(style.borderTopLeftRadius);
  const top = tl + tr;
  const bottom = bl + br;
  const left = tl + bl;
  const right = tr + br;
  const factor = Math.min(
    1,
    top > 0 ? width / top : 1,
    bottom > 0 ? width / bottom : 1,
    left > 0 ? height / left : 1,
    right > 0 ? height / right : 1,
  );
  return [tr * factor, br * factor, bl * factor, tl * factor];
}

const parseFilterBlur = (filter: string): number => {
  if (!filter || filter === 'none') return 0;
  let total = 0;
  for (const match of filter.matchAll(/blur\(([^)]+)\)/gi)) {
    const px = parsePixels(match[1] ?? '', 0);
    if (px > 0) total += px;
  }
  return total;
};

export function resolveSurfaceVisualState(
  element: HTMLElement,
  getStyle: StyleGetter,
  cache: Map<Element, SurfaceVisualState | null>,
  ownStyle?: CSSStyleDeclaration,
): SurfaceVisualState | undefined {
  const cached = cache.get(element);
  if (cached !== undefined) return cached === null ? undefined : cached;

  const style = ownStyle ?? getStyle(element);
  if (style.display === 'none') {
    cache.set(element, null);
    return undefined;
  }
  const ownOpacity = Math.min(Math.max(parseFirstNumber(style.opacity, 1), 0), 1);
  const ownBlur = parseFilterBlur(style.filter);
  const parent = element.parentElement;
  let opacity = ownOpacity;
  let blur = ownBlur;
  if (parent !== null) {
    const inherited = resolveSurfaceVisualState(parent as HTMLElement, getStyle, cache);
    if (inherited === undefined) {
      cache.set(element, null);
      return undefined;
    }
    opacity *= inherited.opacity;
    blur += inherited.blur;
  }
  const result = { opacity, blur };
  cache.set(element, result);
  return result;
}

export interface TopLayerHelpers {
  isInTopLayer: (element: Element, getStyle: StyleGetter, cache: Map<Element, boolean>) => boolean;
  isStrictTopLayerDescendant: (
    element: Element,
    getStyle: StyleGetter,
    cache: Map<Element, boolean>,
  ) => boolean;
}

export function createTopLayerHelpers(ownerDocument: Document): TopLayerHelpers {
  const probe = (selector: string): boolean => {
    try {
      ownerDocument.documentElement?.matches?.(selector);
      return true;
    } catch {
      return false;
    }
  };
  const selectors = [':popover-open', ':modal'].filter(probe);
  const topLayerSelector = selectors.length > 0 ? selectors.join(', ') : null;

  const isTopLayerSelf = (element: Element, getStyle: StyleGetter): boolean => {
    if (topLayerSelector !== null && element.matches?.(topLayerSelector)) {
      return true;
    }
    const overlay = (getStyle(element) as CSSStyleDeclaration & { overlay?: string }).overlay;
    return overlay === 'auto';
  };

  const isInTopLayer = (
    element: Element,
    getStyle: StyleGetter,
    cache: Map<Element, boolean>,
  ): boolean => {
    const cached = cache.get(element);
    if (cached !== undefined) return cached;
    const own = isTopLayerSelf(element, getStyle);
    const value =
      own ||
      (element.parentElement !== null && isInTopLayer(element.parentElement, getStyle, cache));
    cache.set(element, value);
    return value;
  };

  const isStrictTopLayerDescendant = (
    element: Element,
    getStyle: StyleGetter,
    cache: Map<Element, boolean>,
  ): boolean =>
    element.parentElement !== null && isInTopLayer(element.parentElement, getStyle, cache);

  return { isInTopLayer, isStrictTopLayerDescendant };
}
