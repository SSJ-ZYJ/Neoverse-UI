import { glassFragmentShader, glassVertexShader } from './shader';

export const glassRendererAttribute = 'data-neoverse-glass-renderer';

const glassClassNames = [
  'material-glass-subtle',
  'material-glass-elevated',
  'material-glass-immersive',
] as const;
const glassAliasNames = ['glass-card', 'glass-surface'] as const;
const glassSelector = [...glassClassNames, ...glassAliasNames]
  .map((className) => `.${className}`)
  .join(', ');
const reducedTransparencyQuery = '(prefers-reduced-transparency: reduce)';
const maxDefaultDevicePixelRatio = 2;
const quadPositions = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

type GlassVariant = 'subtle' | 'elevated' | 'immersive';
type Color = [number, number, number];
type Radii = [number, number, number, number];

type GlassStyle = {
  rect: DOMRect;
  radii: Radii;
  edgeWidth: number;
  softness: number;
  opacity: number;
  carrier: Color;
};

type GlassGl = WebGLRenderingContext | WebGL2RenderingContext;
type GlassWindow = Window & {
  ResizeObserver?: typeof ResizeObserver;
  MutationObserver?: typeof MutationObserver;
};

type ProgramLocations = {
  position: number;
  viewport: WebGLUniformLocation | null;
  rect: WebGLUniformLocation | null;
  rectSize: WebGLUniformLocation | null;
  pixelRatio: WebGLUniformLocation | null;
  radii: WebGLUniformLocation | null;
  edgeWidth: WebGLUniformLocation | null;
  softness: WebGLUniformLocation | null;
  opacity: WebGLUniformLocation | null;
  carrier: WebGLUniformLocation | null;
  edgeLight: WebGLUniformLocation | null;
  primary: WebGLUniformLocation | null;
  secondary: WebGLUniformLocation | null;
  tertiary: WebGLUniformLocation | null;
};

export interface GlassRendererOptions {
  document?: Document;
  maxDevicePixelRatio?: number;
}

export interface GlassRenderer {
  mount(): void;
  refresh(): void;
  destroy(): void;
}

const activeRenderers = new WeakMap<Document, GlassRendererImpl>();

const getDocument = (candidate?: Document): Document | undefined => {
  if (candidate !== undefined) {
    return candidate;
  }

  return typeof document === 'undefined' ? undefined : document;
};

const getWindow = (ownerDocument?: Document): GlassWindow | undefined =>
  (ownerDocument?.defaultView as GlassWindow | null | undefined) ?? undefined;

const parseFirstNumber = (value: string, fallback: number): number => {
  const match = /-?[\d.]+/.exec(value);
  if (match === null) {
    return fallback;
  }

  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parsePixels = (value: string, fallback: number): number => {
  const match = /-?[\d.]+\s*px/.exec(value);
  if (match === null) {
    return parseFirstNumber(value, fallback);
  }

  return parseFirstNumber(match[0], fallback);
};

const parseColor = (value: string): Color | undefined => {
  const normalized = value.trim().toLowerCase();
  const hexMatch = /^#([\da-f]{3,8})$/i.exec(normalized);

  if (hexMatch !== null) {
    const hex = hexMatch[1];
    if (hex === undefined) {
      return undefined;
    }

    const expanded = hex.length <= 4 ? [...hex].map((digit) => `${digit}${digit}`).join('') : hex;
    const channels = expanded.slice(0, 6).match(/[\da-f]{2}/gi);
    if (channels === null || channels.length !== 3) {
      return undefined;
    }

    return channels.map((channel) => Number.parseInt(channel, 16) / 255) as Color;
  }

  const rgbMatch = normalized.match(
    /^rgba?\(\s*([\d.]+)(%?)\s*[,\s]+([\d.]+)(%?)\s*[,\s]+([\d.]+)(%?)/,
  );
  if (rgbMatch !== null) {
    const red = Number.parseFloat(rgbMatch[1] ?? '0');
    const green = Number.parseFloat(rgbMatch[3] ?? '0');
    const blue = Number.parseFloat(rgbMatch[5] ?? '0');
    const redScale = rgbMatch[2] === '%' ? 100 : 255;
    const greenScale = rgbMatch[4] === '%' ? 100 : 255;
    const blueScale = rgbMatch[6] === '%' ? 100 : 255;
    return [red / redScale, green / greenScale, blue / blueScale].map((channel) =>
      Math.min(Math.max(channel, 0), 1),
    ) as Color;
  }

  const colorFunctionMatch = normalized.match(
    /^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/,
  );
  if (colorFunctionMatch !== null) {
    return [
      Number.parseFloat(colorFunctionMatch[1] ?? '0'),
      Number.parseFloat(colorFunctionMatch[2] ?? '0'),
      Number.parseFloat(colorFunctionMatch[3] ?? '0'),
    ].map((channel) => Math.min(Math.max(channel, 0), 1)) as Color;
  }

  return undefined;
};

const getVariant = (element: Element): GlassVariant | undefined => {
  const materialClassName = glassClassNames.find((className) =>
    element.classList.contains(className),
  );
  if (materialClassName !== undefined) {
    return materialClassName.replace('material-glass-', '') as GlassVariant;
  }

  if (element.classList.contains('glass-card')) {
    return 'elevated';
  }

  if (element.classList.contains('glass-surface')) {
    return 'subtle';
  }

  return undefined;
};

const hasGlassAncestor = (element: Element): boolean => {
  let ancestor = element.parentElement;
  while (ancestor !== null) {
    if (getVariant(ancestor) !== undefined) {
      return true;
    }
    ancestor = ancestor.parentElement;
  }

  return false;
};

const colorProperties = [
  '--neoverse-material-edge-refraction-carrier',
  '--glass-card-highlight',
  '--glass-highlight',
  '--neoverse-color-edge-light',
  '--edge-light',
  '--neoverse-color-accent-primary',
  '--accent-primary',
  '--neoverse-color-accent-secondary',
  '--accent-secondary',
  '--neoverse-color-accent-tertiary',
  '--accent-tertiary',
] as const;

const firstPropertyValue = (
  style: CSSStyleDeclaration,
  properties: readonly string[],
): string | undefined => {
  for (const property of properties) {
    const value = style.getPropertyValue(property).trim();
    if (value !== '') {
      return value;
    }
  }

  return undefined;
};

const getRadii = (style: CSSStyleDeclaration): Radii => [
  parsePixels(style.borderTopRightRadius, 16),
  parsePixels(style.borderBottomRightRadius, 16),
  parsePixels(style.borderBottomLeftRadius, 16),
  parsePixels(style.borderTopLeftRadius, 16),
];

const createShader = (gl: GlassGl, type: number, source: string): WebGLShader | undefined => {
  const shader = gl.createShader(type);
  if (shader === null) {
    return undefined;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return undefined;
  }

  return shader;
};

const createProgram = (gl: GlassGl): WebGLProgram | undefined => {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, glassVertexShader);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, glassFragmentShader);
  if (vertexShader === undefined || fragmentShader === undefined) {
    if (vertexShader !== undefined) {
      gl.deleteShader(vertexShader);
    }
    if (fragmentShader !== undefined) {
      gl.deleteShader(fragmentShader);
    }
    return undefined;
  }

  const program = gl.createProgram();
  if (program === null) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return undefined;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return undefined;
  }

  return program;
};

const resolveColor = (
  sourceStyle: CSSStyleDeclaration,
  values: readonly string[],
  view: Window,
  probe: HTMLElement,
  fallback: Color,
): Color => {
  const previousColor = probe.style.getPropertyValue('color');
  const previousPriority = probe.style.getPropertyPriority('color');
  for (const property of colorProperties) {
    const sourceValue = sourceStyle.getPropertyValue(property);
    if (sourceValue.trim() === '') {
      probe.style.removeProperty(property);
    } else {
      probe.style.setProperty(property, sourceValue);
    }
  }
  let resolved: Color | undefined;
  for (const value of values) {
    probe.style.setProperty('color', value);
    resolved = parseColor(view.getComputedStyle(probe).color);
    if (resolved !== undefined) {
      break;
    }
  }

  if (previousColor === '') {
    probe.style.removeProperty('color');
  } else {
    probe.style.setProperty('color', previousColor, previousPriority);
  }

  return resolved ?? fallback;
};

const getDefaultEdgeValues = (variant: GlassVariant): {
  width: number;
  softness: number;
  opacity: number;
} => {
  if (variant === 'immersive') {
    return { width: 1.5, softness: 5, opacity: 0.54 };
  }

  if (variant === 'elevated') {
    return { width: 1.25, softness: 4, opacity: 0.5 };
  }

  return { width: 1, softness: 3, opacity: 0.46 };
};

const readStyle = (
  element: HTMLElement,
  view: Window,
  colorProbe: HTMLElement,
): GlassStyle | undefined => {
  const style = view.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  if (
    rect.width <= 0 ||
    rect.height <= 0 ||
    rect.right <= 0 ||
    rect.bottom <= 0 ||
    rect.left >= view.innerWidth ||
    rect.top >= view.innerHeight ||
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0'
  ) {
    return undefined;
  }

  const variant = getVariant(element) ?? 'subtle';
  const defaults = getDefaultEdgeValues(variant);
  const edgeWidth = Math.max(
    parsePixels(
      firstPropertyValue(style, [
        '--neoverse-material-edge-refraction-width',
        '--glass-edge-width',
      ]) ?? '',
      defaults.width,
    ),
    0.5,
  );
  const softness = Math.max(
    parsePixels(
      firstPropertyValue(style, [
        '--neoverse-material-edge-refraction-softness',
        '--glass-edge-softness',
      ]) ?? '',
      defaults.softness,
    ),
    1,
  );
  const opacity = Math.min(
    Math.max(
      parseFirstNumber(
        firstPropertyValue(style, [
          '--neoverse-material-edge-refraction-opacity',
          '--glass-edge-opacity',
        ]) ?? '',
        defaults.opacity,
      ),
      0,
    ),
    1,
  );
  const carrier = firstPropertyValue(style, [
    '--neoverse-material-edge-refraction-carrier',
    '--glass-card-highlight',
    '--glass-highlight',
    '--edge-light',
  ]);
  const carrierColor = resolveColor(
    style,
    carrier === undefined
      ? ['var(--neoverse-color-edge-light)', 'var(--edge-light)']
      : [carrier, 'var(--neoverse-color-edge-light)', 'var(--edge-light)'],
    view,
    colorProbe,
    [1, 1, 1],
  );

  return {
    rect,
    radii: getRadii(style),
    edgeWidth,
    softness,
    opacity,
    carrier: carrierColor,
  };
};

class GlassRendererImpl implements GlassRenderer {
  private readonly ownerDocument: Document | undefined;
  private readonly maxDevicePixelRatio: number;
  private mounted = false;
  private active = false;
  private canvas: HTMLCanvasElement | undefined;
  private colorProbe: HTMLElement | undefined;
  private gl: GlassGl | undefined;
  private program: WebGLProgram | undefined;
  private locations: ProgramLocations | undefined;
  private buffer: WebGLBuffer | undefined;
  private resizeObserver: ResizeObserver | undefined;
  private mutationObserver: MutationObserver | undefined;
  private transparencyQuery: MediaQueryList | undefined;
  private animationFrame: number | undefined;
  private previousRendererAttribute: string | null = null;
  private readonly handleResize = (): void => this.scheduleRefresh();
  private readonly handleScroll = (): void => this.scheduleRefresh();
  private readonly handleMutations = (records: MutationRecord[]): void => {
    if (records.every((record) => record.target === this.colorProbe)) {
      return;
    }

    this.scheduleRefresh();
  };
  private readonly handleTransparencyChange = (event: MediaQueryListEvent): void => {
    if (event.matches) {
      this.deactivate();
    } else if (this.mounted && !this.active) {
      this.activate();
    }
  };
  private readonly handleContextLoss = (): void => this.deactivate();

  public constructor(options: GlassRendererOptions) {
    this.ownerDocument = getDocument(options.document);
    this.maxDevicePixelRatio = Math.max(
      options.maxDevicePixelRatio ?? maxDefaultDevicePixelRatio,
      1,
    );
  }

  public mount(): void {
    if (this.mounted || this.ownerDocument === undefined || this.ownerDocument.body === null) {
      return;
    }

    const existing = activeRenderers.get(this.ownerDocument);
    if (existing !== undefined && existing !== this) {
      return;
    }

    this.mounted = true;
    activeRenderers.set(this.ownerDocument, this);
    const view = getWindow(this.ownerDocument);
    this.transparencyQuery = view?.matchMedia?.(reducedTransparencyQuery);
    this.transparencyQuery?.addEventListener('change', this.handleTransparencyChange);
    this.ownerDocument.addEventListener('scroll', this.handleScroll, true);
    view?.addEventListener('scroll', this.handleScroll, { passive: true });
    view?.addEventListener('resize', this.handleResize);
    this.activate();
  }

  public refresh(): void {
    if (this.active) {
      this.render();
    }
  }

  public destroy(): void {
    if (!this.mounted) {
      return;
    }

    this.mounted = false;
    this.transparencyQuery?.removeEventListener('change', this.handleTransparencyChange);
    this.transparencyQuery = undefined;
    this.ownerDocument?.removeEventListener('scroll', this.handleScroll, true);
    getWindow(this.ownerDocument)?.removeEventListener('scroll', this.handleScroll);
    getWindow(this.ownerDocument)?.removeEventListener('resize', this.handleResize);
    this.deactivate();
    if (this.ownerDocument !== undefined && activeRenderers.get(this.ownerDocument) === this) {
      activeRenderers.delete(this.ownerDocument);
    }
  }

  private activate(): void {
    if (
      !this.mounted ||
      this.active ||
      this.ownerDocument === undefined ||
      this.ownerDocument.body === null
    ) {
      return;
    }

    this.removeStaleCanvas();
    if (this.transparencyQuery?.matches === true) {
      return;
    }

    const canvas = this.ownerDocument.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.setAttribute('data-neoverse-glass-renderer-canvas', 'true');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '2147483646';

    const gl = this.getContext(canvas);
    if (gl === undefined) {
      return;
    }

    const program = createProgram(gl);
    const buffer = gl.createBuffer();
    if (program === undefined || buffer === null) {
      if (program !== undefined) {
        gl.deleteProgram(program);
      }
      return;
    }

    const locations: ProgramLocations = {
      position: gl.getAttribLocation(program, 'a_position'),
      viewport: gl.getUniformLocation(program, 'u_viewport'),
      rect: gl.getUniformLocation(program, 'u_rect'),
      rectSize: gl.getUniformLocation(program, 'u_rect_size'),
      pixelRatio: gl.getUniformLocation(program, 'u_pixel_ratio'),
      radii: gl.getUniformLocation(program, 'u_radii'),
      edgeWidth: gl.getUniformLocation(program, 'u_edge_width'),
      softness: gl.getUniformLocation(program, 'u_softness'),
      opacity: gl.getUniformLocation(program, 'u_opacity'),
      carrier: gl.getUniformLocation(program, 'u_carrier'),
      edgeLight: gl.getUniformLocation(program, 'u_edge_light'),
      primary: gl.getUniformLocation(program, 'u_primary'),
      secondary: gl.getUniformLocation(program, 'u_secondary'),
      tertiary: gl.getUniformLocation(program, 'u_tertiary'),
    };

    this.canvas = canvas;
    this.gl = gl;
    this.program = program;
    this.locations = locations;
    this.buffer = buffer;
    this.previousRendererAttribute = this.ownerDocument.documentElement.getAttribute(
      glassRendererAttribute,
    );
    this.ownerDocument.documentElement.setAttribute(glassRendererAttribute, 'webgl');
    this.ownerDocument.body.append(canvas);
    const colorProbe = this.ownerDocument.createElement('span');
    colorProbe.setAttribute('aria-hidden', 'true');
    colorProbe.style.position = 'fixed';
    colorProbe.style.width = '0';
    colorProbe.style.height = '0';
    colorProbe.style.overflow = 'hidden';
    colorProbe.style.visibility = 'hidden';
    colorProbe.style.pointerEvents = 'none';
    this.ownerDocument.body.append(colorProbe);
    this.colorProbe = colorProbe;
    canvas.addEventListener('webglcontextlost', this.handleContextLoss);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadPositions, gl.STATIC_DRAW);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.observe();
    this.active = true;
    this.refresh();
  }

  private removeStaleCanvas(): void {
    if (this.ownerDocument === undefined) {
      return;
    }

    const staleCanvases = this.ownerDocument.querySelectorAll<HTMLCanvasElement>(
      '[data-neoverse-glass-renderer-canvas]',
    );
    for (const staleCanvas of staleCanvases) {
      staleCanvas.remove();
    }

    if (
      staleCanvases.length > 0 &&
      this.ownerDocument.documentElement.getAttribute(glassRendererAttribute) === 'webgl'
    ) {
      this.ownerDocument.documentElement.removeAttribute(glassRendererAttribute);
    }
  }

  private deactivate(): void {
    if (this.animationFrame !== undefined) {
      getWindow(this.ownerDocument)?.cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }

    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.mutationObserver?.disconnect();
    this.mutationObserver = undefined;

    if (this.canvas !== undefined) {
      this.canvas.removeEventListener('webglcontextlost', this.handleContextLoss);
      this.canvas.remove();
    }
    this.colorProbe?.remove();

    if (this.gl !== undefined && this.program !== undefined) {
      this.gl.deleteProgram(this.program);
    }
    if (this.gl !== undefined && this.buffer !== undefined) {
      this.gl.deleteBuffer(this.buffer);
    }

    if (this.ownerDocument !== undefined) {
      if (this.previousRendererAttribute === null) {
        this.ownerDocument.documentElement.removeAttribute(glassRendererAttribute);
      } else {
        this.ownerDocument.documentElement.setAttribute(
          glassRendererAttribute,
          this.previousRendererAttribute,
        );
      }
    }

    this.canvas = undefined;
    this.colorProbe = undefined;
    this.gl = undefined;
    this.program = undefined;
    this.locations = undefined;
    this.buffer = undefined;
    this.previousRendererAttribute = null;
    this.active = false;
  }

  private getContext(canvas: HTMLCanvasElement): GlassGl | undefined {
    try {
      const webgl2 = canvas.getContext('webgl2', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
      });
      if (webgl2 !== null) {
        return webgl2;
      }

      const webgl1 = canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
      });
      return webgl1 ?? undefined;
    } catch {
      return undefined;
    }
  }

  private observe(): void {
    if (this.ownerDocument === undefined || this.canvas === undefined) {
      return;
    }

    const view = getWindow(this.ownerDocument);
    const ResizeObserverConstructor = view?.ResizeObserver;
    if (ResizeObserverConstructor !== undefined) {
      this.resizeObserver = new ResizeObserverConstructor(this.handleResize);
    }

    const MutationObserverConstructor = view?.MutationObserver;
    const documentElement = this.ownerDocument.documentElement;
    if (MutationObserverConstructor !== undefined && documentElement !== null) {
      const mutationObserver = new MutationObserverConstructor(this.handleMutations);
      mutationObserver.observe(documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: [
          'class',
          'style',
          'hidden',
          'data-theme',
          glassRendererAttribute,
        ],
      });
      this.mutationObserver = mutationObserver;
    }
  }

  private scheduleRefresh(): void {
    if (!this.active || this.animationFrame !== undefined) {
      return;
    }

    const view = getWindow(this.ownerDocument);
    if (view?.requestAnimationFrame === undefined) {
      this.refresh();
      return;
    }

    this.animationFrame = view.requestAnimationFrame(() => {
      this.animationFrame = undefined;
      this.refresh();
    });
  }

  private render(): void {
    if (
      !this.active ||
      this.ownerDocument === undefined ||
      this.canvas === undefined ||
      this.gl === undefined ||
      this.program === undefined ||
      this.locations === undefined ||
      this.buffer === undefined ||
      this.colorProbe === undefined
    ) {
      return;
    }

    const view = getWindow(this.ownerDocument);
    if (view === undefined) {
      return;
    }

    const width = Math.max(view.innerWidth, 1);
    const height = Math.max(view.innerHeight, 1);
    const pixelRatio = Math.min(Math.max(view.devicePixelRatio || 1, 1), this.maxDevicePixelRatio);
    const drawingWidth = Math.max(Math.round(width * pixelRatio), 1);
    const drawingHeight = Math.max(Math.round(height * pixelRatio), 1);
    if (this.canvas.width !== drawingWidth || this.canvas.height !== drawingHeight) {
      this.canvas.width = drawingWidth;
      this.canvas.height = drawingHeight;
    }

    const gl = this.gl;
    const locations = this.locations;
    gl.viewport(0, 0, drawingWidth, drawingHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(locations.position);
    gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(locations.viewport, width, height);
    gl.uniform1f(locations.pixelRatio, pixelRatio);

    const rootStyle = view.getComputedStyle(this.ownerDocument.documentElement);
    const edgeLight = resolveColor(
      rootStyle,
      [
        firstPropertyValue(rootStyle, ['--neoverse-color-edge-light', '--edge-light']) ??
          'var(--neoverse-color-edge-light)',
        'var(--edge-light)',
      ],
      view,
      this.colorProbe,
      [1, 1, 1],
    );
    const primary = resolveColor(
      rootStyle,
      [
        firstPropertyValue(rootStyle, ['--neoverse-color-accent-primary', '--accent-primary']) ??
          'var(--neoverse-color-accent-primary)',
        'var(--accent-primary)',
      ],
      view,
      this.colorProbe,
      [0.45, 0.73, 0.9],
    );
    const secondary = resolveColor(
      rootStyle,
      [
        firstPropertyValue(rootStyle, ['--neoverse-color-accent-secondary', '--accent-secondary']) ??
          'var(--neoverse-color-accent-secondary)',
        'var(--accent-secondary)',
      ],
      view,
      this.colorProbe,
      [0.3, 0.85, 0.7],
    );
    const tertiary = resolveColor(
      rootStyle,
      [
        firstPropertyValue(rootStyle, ['--neoverse-color-accent-tertiary', '--accent-tertiary']) ??
          'var(--neoverse-color-accent-tertiary)',
        'var(--accent-tertiary)',
      ],
      view,
      this.colorProbe,
      [0.48, 0.43, 0.9],
    );

    for (const element of this.getGlassElements()) {
      const style = readStyle(element, view, this.colorProbe);
      if (style === undefined) {
        continue;
      }

      gl.uniform4f(locations.rect, style.rect.left, style.rect.top, style.rect.width, style.rect.height);
      gl.uniform2f(locations.rectSize, style.rect.width, style.rect.height);
      gl.uniform4f(locations.radii, ...style.radii);
      gl.uniform1f(locations.edgeWidth, style.edgeWidth);
      gl.uniform1f(locations.softness, style.softness);
      gl.uniform1f(locations.opacity, style.opacity);
      gl.uniform3f(locations.carrier, ...style.carrier);
      gl.uniform3f(locations.edgeLight, ...edgeLight);
      gl.uniform3f(locations.primary, ...primary);
      gl.uniform3f(locations.secondary, ...secondary);
      gl.uniform3f(locations.tertiary, ...tertiary);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  private getGlassElements(): HTMLElement[] {
    if (this.ownerDocument === undefined) {
      return [];
    }

    const elements = Array.from(
      this.ownerDocument.querySelectorAll<HTMLElement>(glassSelector),
    );
    const currentElements: HTMLElement[] = [];

    for (const element of elements) {
      if (hasGlassAncestor(element)) {
        continue;
      }

      const variant = getVariant(element);
      if (variant === undefined) {
        continue;
      }

      currentElements.push(element);
    }

    if (this.resizeObserver !== undefined) {
      this.resizeObserver.disconnect();
      for (const element of currentElements) {
        this.resizeObserver.observe(element);
      }
    }

    return currentElements;
  }
}

export const createGlassRenderer = (options: GlassRendererOptions = {}): GlassRenderer =>
  new GlassRendererImpl(options);

export type { Color as GlassRendererColor };
