import type { GlassRenderer } from './index';

const svgNamespace = 'http://www.w3.org/2000/svg';
const selector = '.material-glass-subtle, .material-glass-elevated, .material-glass-immersive';
const internalSelector = '[data-neoverse-glass-native-defs], [data-neoverse-particle-capture]';
let rendererSequence = 0;
type SharedMap = { id: string; node: SVGFilterElement; refs: number };
type Owner = {
  original: string;
  priority: string;
  applied: string;
  writtenStyle: string | null;
  map: SharedMap;
  key: string;
};
const number = (value: string, fallback = 0): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function supportsNativeRefraction(document: Document): boolean {
  const view = document.defaultView;
  // SVG backdrop displacement is verified in Chromium. Parsing a URL alone
  // does not establish interoperable displacement support in other engines.
  if (
    !view ||
    !/Chrome\//.test(view.navigator.userAgent) ||
    !view.CSS?.supports('backdrop-filter', 'url("#glass")')
  )
    return false;
  try {
    return document.createElement('canvas').getContext('2d') !== null;
  } catch {
    return false;
  }
}

/** The browser supplies the live composited backdrop, including DOM, canvas
 * and video. Only a local displacement vector map is cached, never its colour.
 */
export class NativeGlassRenderer implements GlassRenderer {
  private owners = new Map<HTMLElement, Owner>();
  private maps = new Map<string, SharedMap>();
  private defs: SVGSVGElement | undefined;
  private observer: MutationObserver | undefined;
  private resize: ResizeObserver | undefined;
  private media: MediaQueryList | undefined;
  private frame: number | undefined;
  private mounted = false;
  private previous: string | null = null;
  private readonly prefix = `nv-backdrop-${++rendererSequence}-`;
  private sequence = 0;
  constructor(
    private document: Document,
    private eligible: (element: HTMLElement) => boolean,
    private claim: (renderer: GlassRenderer) => boolean,
    private release: (renderer: GlassRenderer) => void,
  ) {}

  mount(): void {
    if (this.mounted || !this.document.body || !this.claim(this)) return;
    this.mounted = true;
    this.previous = this.document.documentElement.getAttribute('data-neoverse-glass-renderer');
    const view = this.document.defaultView;
    this.media = view?.matchMedia('(prefers-reduced-transparency: reduce)');
    this.media?.addEventListener('change', this.schedule);
    if (view?.MutationObserver) {
      this.observer = new view.MutationObserver((records) => {
        if (
          records.every((record) => {
            const target = record.target;
            if (target.nodeType === 1 && (target as Element).closest(internalSelector)) return true;
            if (
              record.type === 'childList' &&
              [...record.addedNodes, ...record.removedNodes].every(
                // Text updates are sampled live. ResizeObserver handles any
                // resulting geometry change without rebuilding filters for counters.
                (n) => n.nodeType !== 1 || (n as Element).matches(internalSelector),
              )
            )
              return true;
            const entry = this.owners.get(target as HTMLElement);
            return (
              record.attributeName === 'style' &&
              entry !== undefined &&
              (target as HTMLElement).getAttribute('style') === entry.writtenStyle
            );
          })
        )
          return;
        this.schedule();
      });
      this.observer.observe(this.document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          'class',
          'style',
          'hidden',
          'data-theme',
          'data-neoverse-glass-nesting',
          'data-surface',
        ],
      });
    }
    if (view?.ResizeObserver) this.resize = new view.ResizeObserver(this.schedule);
    view?.addEventListener('resize', this.schedule);
    // No scroll listener or per-frame map updates. CSS local coordinates move
    // with their owner in the same compositor frame as the actual backdrop.
    this.refresh();
  }
  private readonly schedule = (): void => {
    const view = this.document.defaultView;
    if (!this.mounted || !view || this.frame !== undefined) return;
    this.frame = view.requestAnimationFrame(() => {
      this.frame = undefined;
      this.refresh();
    });
  };
  refresh(): void {
    if (!this.mounted) return;
    if (this.media?.matches) {
      this.clear();
      this.restoreAttribute();
      return;
    }
    const view = this.document.defaultView;
    if (!view) return;
    this.document.documentElement.setAttribute('data-neoverse-glass-renderer', 'native');
    const seen = new Set<HTMLElement>();
    for (const element of this.document.querySelectorAll<HTMLElement>(selector)) {
      if (element.closest(internalSelector) || !this.eligible(element)) continue;
      let entry = this.owners.get(element);
      if (entry) {
        const current = element.style.getPropertyValue('backdrop-filter');
        if (
          current !== entry.applied ||
          element.style.getPropertyPriority('backdrop-filter') !== entry.priority
        ) {
          entry.original = current;
          entry.priority = element.style.getPropertyPriority('backdrop-filter');
        }
        this.restoreInline(element, entry);
      }
      const style = view.getComputedStyle(element);
      if (element.getClientRects().length === 0 || style.visibility === 'hidden') {
        if (entry) this.remove(element, entry);
        continue;
      }
      const base = style.backdropFilter;
      const blurPattern = /\bblur\(([\d.]+)px\)/;
      const blur = number(blurPattern.exec(base)?.[1] ?? '0');
      const width =
        number(style.width, element.offsetWidth) +
        (style.boxSizing === 'border-box'
          ? 0
          : number(style.paddingLeft) +
            number(style.paddingRight) +
            number(style.borderLeftWidth) +
            number(style.borderRightWidth));
      const height =
        number(style.height, element.offsetHeight) +
        (style.boxSizing === 'border-box'
          ? 0
          : number(style.paddingTop) +
            number(style.paddingBottom) +
            number(style.borderTopWidth) +
            number(style.borderBottomWidth));
      const opacity = number(
        style.getPropertyValue('--neoverse-material-edge-refraction-opacity'),
        0.5,
      );
      if (
        base === 'none' ||
        base.includes('url(') ||
        width <= 0 ||
        height <= 0 ||
        opacity <= 0 ||
        style.display === 'none'
      ) {
        if (entry) this.remove(element, entry);
        continue;
      }
      const radius = (value: string) =>
        Math.min(
          number(value) * (value.includes('%') ? Math.min(width, height) / 100 : 1),
          width / 2,
          height / 2,
        );
      const radii = [
        style.borderTopRightRadius,
        style.borderBottomRightRadius,
        style.borderBottomLeftRadius,
        style.borderTopLeftRadius,
      ].map(radius);
      const bevel = Math.min(
        Math.max(
          4,
          number(style.getPropertyValue('--neoverse-material-edge-refraction-width'), 1.25) * 3,
        ),
        width / 2,
        height / 2,
      );
      const strength =
        Math.max(0, number(style.getPropertyValue('--neoverse-material-refraction-strength'), 1)) *
        Math.min(
          opacity /
            Math.max(
              number(
                style.getPropertyValue(
                  '--neoverse-material-glass-elevated-edge-refraction-opacity',
                ),
                0.5,
              ),
              0.001,
            ),
          1,
        );
      if (strength <= 0) {
        if (entry) this.remove(element, entry);
        continue;
      }
      const key = [
        width.toFixed(2),
        height.toFixed(2),
        ...radii.map((r) => r.toFixed(2)),
        bevel.toFixed(2),
        strength.toFixed(3),
        blur.toFixed(2),
      ].join('/');
      if (entry?.key !== key) {
        if (entry) this.remove(element, entry);
        let map = this.maps.get(key);
        if (!map) {
          map = this.createMap(width, height, radii, bevel, strength, blur);
          if (!map) continue;
          this.maps.set(key, map);
        }
        map.refs++;
        entry = {
          original: element.style.getPropertyValue('backdrop-filter'),
          priority: element.style.getPropertyPriority('backdrop-filter'),
          applied: '',
          writtenStyle: null,
          map,
          key,
        };
        this.owners.set(element, entry);
        this.resize?.observe(element);
      }
      if (!entry) continue;
      // The filter blurs the body and bends the original backdrop at the rim.
      // Appending displacement after CSS blur erases the detail that shows bending.
      const filter = `url("#${entry.map.id}")`;
      entry.applied = blurPattern.test(base)
        ? base.replace(blurPattern, filter)
        : `${base} ${filter}`;
      element.style.setProperty('backdrop-filter', entry.applied, entry.priority);
      element.setAttribute('data-neoverse-glass-native-filter', entry.map.id);
      entry.writtenStyle = element.getAttribute('style');
      seen.add(element);
    }
    for (const [element, entry] of this.owners) if (!seen.has(element)) this.remove(element, entry);
  }

  private createMap(
    width: number,
    height: number,
    radii: number[],
    bevel: number,
    strength: number,
    blur: number,
  ): SharedMap | undefined {
    const scale = Math.min(1, 768 / Math.max(width, height));
    const canvas = this.document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(width * scale));
    canvas.height = Math.max(1, Math.ceil(height * scale));
    const context = canvas.getContext('2d');
    if (!context) return;
    const image = context.createImageData(canvas.width, canvas.height);
    const depth = bevel * 3.5 * strength,
      amplitude = Math.max(1, depth * 2);
    for (let i = 0; i < image.data.length; i += 4) {
      image.data[i] = 128;
      image.data[i + 1] = 128;
      image.data[i + 2] = 0;
      image.data[i + 3] = 255;
    }
    const margin = Math.max(...radii) + bevel;
    for (let y = 0; y < canvas.height; y++)
      for (let x = 0; x < canvas.width; x++) {
        const localX = ((x + 0.5) * width) / canvas.width,
          localY = ((y + 0.5) * height) / canvas.height;
        if (
          localX > margin &&
          localX < width - margin &&
          localY > margin &&
          localY < height - margin
        )
          continue;
        const px = ((x + 0.5) * width) / canvas.width - width / 2,
          py = ((y + 0.5) * height) / canvas.height - height / 2;
        const radius =
          (px > 0 ? (py > 0 ? radii[1] : radii[0]) : py > 0 ? radii[2] : radii[3]) ?? 0;
        const qx = Math.abs(px) - width / 2 + radius,
          qy = Math.abs(py) - height / 2 + radius;
        const distance =
          Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - radius;
        let nx = 0,
          ny = 0;
        if (qx > 0 && qy > 0) {
          const length = Math.hypot(qx, qy);
          nx = (Math.sign(px) * qx) / length;
          ny = (Math.sign(py) * qy) / length;
        } else if (qx > qy) nx = Math.sign(px);
        else ny = Math.sign(py);
        const edge = Math.max(0, 1 - Math.max(-distance, 0) / bevel);
        // Snell refraction through a convex bevel; the flat body has zero bend.
        const incident = edge * 1.36,
          refracted = Math.asin(Math.sin(incident) / 1.46);
        const bend = depth * Math.tan(incident - refracted);
        const i = (y * canvas.width + x) * 4;
        image.data[i] = Math.round(128 - ((nx * bend) / amplitude) * 255);
        image.data[i + 1] = Math.round(128 - ((ny * bend) / amplitude) * 255);
        // Blue stores coverage of the narrow clear bevel; the centre stays zero.
        image.data[i + 2] = Math.round(edge * edge * (3 - 2 * edge) * 255);
        image.data[i + 3] = 255;
      }
    context.putImageData(image, 0, 0);
    if (!this.defs) {
      this.defs = this.document.createElementNS(svgNamespace, 'svg');
      this.defs.setAttribute('data-neoverse-glass-native-defs', '');
      this.defs.setAttribute('aria-hidden', 'true');
      this.defs.style.cssText = 'position:fixed;width:0;height:0;pointer-events:none';
      this.document.body.append(this.defs);
    }
    const node = this.document.createElementNS(svgNamespace, 'filter');
    const id = this.prefix + ++this.sequence;
    node.id = id;
    node.setAttribute('filterUnits', 'userSpaceOnUse');
    node.setAttribute('primitiveUnits', 'userSpaceOnUse');
    node.setAttribute('color-interpolation-filters', 'sRGB');
    const marginPixels = Math.ceil(Math.max(depth, blur * 3));
    node.setAttribute('x', String(-marginPixels));
    node.setAttribute('y', String(-marginPixels));
    node.setAttribute('width', String(width + marginPixels * 2));
    node.setAttribute('height', String(height + marginPixels * 2));
    const frost = this.document.createElementNS(svgNamespace, 'feGaussianBlur');
    frost.setAttribute('in', 'SourceGraphic');
    frost.setAttribute('stdDeviation', String(blur));
    frost.setAttribute('edgeMode', 'duplicate');
    frost.setAttribute('result', 'frost');
    const map = this.document.createElementNS(svgNamespace, 'feImage');
    map.setAttribute('href', canvas.toDataURL());
    map.setAttribute('x', '0');
    map.setAttribute('y', '0');
    map.setAttribute('width', String(width));
    map.setAttribute('height', String(height));
    map.setAttribute('preserveAspectRatio', 'none');
    map.setAttribute('result', 'vectors');
    const correction = this.document.createElementNS(svgNamespace, 'feComponentTransfer');
    correction.setAttribute('in', 'vectors');
    correction.setAttribute('result', 'neutral-vectors');
    for (const channel of ['R', 'G']) {
      const f = this.document.createElementNS(svgNamespace, `feFunc${channel}`);
      f.setAttribute('type', 'linear');
      f.setAttribute('slope', '1');
      f.setAttribute('intercept', String(0.5 - 128 / 255));
      correction.append(f);
    }
    const displacement = this.document.createElementNS(svgNamespace, 'feDisplacementMap');
    displacement.setAttribute('in', 'SourceGraphic');
    displacement.setAttribute('in2', 'neutral-vectors');
    displacement.setAttribute('scale', String(amplitude));
    displacement.setAttribute('xChannelSelector', 'R');
    displacement.setAttribute('yChannelSelector', 'G');
    displacement.setAttribute('result', 'refracted');
    const mask = this.document.createElementNS(svgNamespace, 'feColorMatrix');
    mask.setAttribute('in', 'vectors');
    mask.setAttribute('type', 'matrix');
    mask.setAttribute('values', '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1 0 0');
    mask.setAttribute('result', 'bevel-mask');
    const bevelPaint = this.document.createElementNS(svgNamespace, 'feComposite');
    bevelPaint.setAttribute('in', 'refracted');
    bevelPaint.setAttribute('in2', 'bevel-mask');
    bevelPaint.setAttribute('operator', 'in');
    bevelPaint.setAttribute('result', 'bevel');
    const combined = this.document.createElementNS(svgNamespace, 'feComposite');
    combined.setAttribute('in', 'bevel');
    combined.setAttribute('in2', 'frost');
    combined.setAttribute('operator', 'over');
    node.append(frost, map, correction, displacement, mask, bevelPaint, combined);
    this.defs.append(node);
    return { id, node, refs: 0 };
  }
  private restoreInline(element: HTMLElement, entry: Owner): void {
    if (entry.original)
      element.style.setProperty('backdrop-filter', entry.original, entry.priority);
    else element.style.removeProperty('backdrop-filter');
  }
  private remove(element: HTMLElement, entry: Owner): void {
    // Never overwrite a caller edit made since our last refresh.
    if (element.style.getPropertyValue('backdrop-filter') === entry.applied)
      this.restoreInline(element, entry);
    element.removeAttribute('data-neoverse-glass-native-filter');
    this.resize?.unobserve(element);
    this.owners.delete(element);
    if (--entry.map.refs === 0) {
      entry.map.node.remove();
      this.maps.delete(entry.key);
    }
  }
  private clear(): void {
    for (const [element, entry] of this.owners) this.remove(element, entry);
    this.defs?.remove();
    this.defs = undefined;
  }
  private restoreAttribute(): void {
    if (this.previous === null)
      this.document.documentElement.removeAttribute('data-neoverse-glass-renderer');
    else this.document.documentElement.setAttribute('data-neoverse-glass-renderer', this.previous);
  }
  destroy(): void {
    if (!this.mounted) return;
    this.mounted = false;
    const view = this.document.defaultView;
    if (this.frame !== undefined) view?.cancelAnimationFrame(this.frame);
    this.frame = undefined;
    this.media?.removeEventListener('change', this.schedule);
    view?.removeEventListener('resize', this.schedule);
    this.observer?.disconnect();
    this.resize?.disconnect();
    this.clear();
    this.restoreAttribute();
    this.release(this);
  }
}
