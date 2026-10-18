type Gl = WebGLRenderingContext | WebGL2RenderingContext;
type Rgba = [number, number, number, number];

export type GlassBackground = {
  rect: DOMRect;
  color: Rgba;
  texture?: WebGLTexture | undefined;
};

type Entry = {
  signature: string;
  texture: WebGLTexture | undefined;
  pending: boolean;
  cancelled: boolean;
};

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const hasImage = (style: CSSStyleDeclaration): boolean =>
  style.backgroundImage !== '' && style.backgroundImage !== 'none';

/** Cache CSS background paint, never a screenshot of foreground content.
 * Scrolling only changes sampling coordinates; it never rebuilds an image.
 */
export class GlassBackgrounds {
  private entries = new Map<HTMLElement, Entry>();
  private styles = new Map<HTMLElement, CSSStyleDeclaration>();
  private disposed = false;
  private fallback: WebGLTexture | null;

  constructor(
    private gl: Gl,
    private document: Document,
    private refresh: () => void,
    private parseColor: (value: string) => Rgba | undefined,
  ) {
    this.fallback = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.fallback);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 255, 255]),
    );
  }

  bind(background: GlassBackground | undefined): void {
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, background?.texture ?? this.fallback);
  }

  beginFrame(): void {
    this.styles.clear();
    for (const [element, entry] of this.entries) {
      if (!element.isConnected) {
        entry.cancelled = true;
        if (entry.texture) this.gl.deleteTexture(entry.texture);
        this.entries.delete(element);
      }
    }
  }

  private style(element: HTMLElement, view: Window): CSSStyleDeclaration {
    let style = this.styles.get(element);
    if (!style) {
      style = view.getComputedStyle(element);
      this.styles.set(element, style);
    }
    return style;
  }

  sample(element: HTMLElement, view: Window): GlassBackground | undefined {
    const layers: Array<{ element: HTMLElement; style: CSSStyleDeclaration; color: Rgba }> = [];
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const style = this.style(parent, view);
      const color = this.parseColor(style.backgroundColor) ?? [0, 0, 0, 0];
      if (hasImage(style) || color[3] > 0) layers.push({ element: parent, style, color });
      if (color[3] >= 0.99) break;
    }
    const nearest = layers[0];
    if (!nearest) return undefined;
    const rect = nearest.element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return undefined;
    if (layers.every((layer) => !hasImage(layer.style))) {
      const result: Rgba = [0, 0, 0, 0];
      for (const layer of [...layers].reverse()) {
        const alpha = layer.color[3];
        for (let c = 0; c < 3; c++)
          result[c] = (layer.color[c] ?? 0) * alpha + (result[c] ?? 0) * (1 - alpha);
        result[3] = alpha + result[3] * (1 - alpha);
      }
      if (result[3] > 0 && result[3] < 1) {
        for (let c = 0; c < 3; c++) result[c] = (result[c] ?? 0) / result[3];
      }
      return { rect, color: result };
    }
    const width = nearest.element.offsetWidth || Math.round(rect.width);
    const height = nearest.element.offsetHeight || Math.round(rect.height);
    const scale = rect.width / width;
    const paint = layers.map((layer) => {
      const box = !hasImage(layer.style) ? rect : layer.element.getBoundingClientRect();
      const css = [
        `position:absolute;left:${(box.left - rect.left) / scale}px;top:${(box.top - rect.top) / scale}px`,
        `width:${box.width / scale}px;height:${box.height / scale}px`,
        `background-color:${layer.style.backgroundColor}`,
        `background-image:${layer.style.backgroundImage}`,
        `background-size:${layer.style.backgroundSize}`,
        `background-position:${layer.style.backgroundPosition}`,
        `background-repeat:${layer.style.backgroundRepeat}`,
        `background-blend-mode:${layer.style.backgroundBlendMode}`,
        `border-radius:${layer.style.borderRadius}`,
      ].join(';');
      return css;
    });
    const signature = `${width}x${height}/${paint.join('|')}`;
    let entry = this.entries.get(nearest.element);
    if (!entry || entry.signature !== signature) {
      if (entry) entry.cancelled = true;
      const previous = entry?.texture;
      entry = { signature, texture: previous, pending: true, cancelled: false };
      this.entries.set(nearest.element, entry);
      void this.paint(entry, paint, width, height);
      // Bound retained GPU resources even on very long component catalogues.
      while (this.entries.size > 64) {
        const oldest = this.entries.entries().next().value;
        if (!oldest) break;
        oldest[1].cancelled = true;
        if (oldest[1].texture) this.gl.deleteTexture(oldest[1].texture);
        this.entries.delete(oldest[0]);
      }
    }
    this.entries.delete(nearest.element);
    this.entries.set(nearest.element, entry);
    return entry.texture ? { rect, color: [1, 1, 1, 1], texture: entry.texture } : undefined;
  }

  private async embedImages(layers: string[]): Promise<string[] | undefined> {
    const urls = new Map<string, string>();
    for (const css of layers)
      for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/gi)) {
        const resource = match[1];
        if (!resource || resource.startsWith('data:') || urls.has(resource)) continue;
        try {
          const url = new URL(resource, this.document.baseURI);
          // Existing same-origin backgrounds can be embedded without requesting
          // third-party resources or tainting the texture's canvas.
          if (url.origin !== this.document.location.origin) return undefined;
          const response = await fetch(url, { credentials: 'same-origin', cache: 'force-cache' });
          if (!response.ok) return undefined;
          const blob = await response.blob();
          if (blob.size > 8 * 1024 * 1024 || !blob.type.startsWith('image/')) return undefined;
          const uri = await new Promise<string | undefined>((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve(typeof reader.result === 'string' ? reader.result : undefined);
            reader.onerror = () => resolve(undefined);
            reader.readAsDataURL(blob);
          });
          if (!uri) return undefined;
          urls.set(resource, uri);
        } catch {
          return undefined;
        }
      }
    return layers.map((css) =>
      css.replace(
        /url\(["']?([^"')]+)["']?\)/gi,
        (_match, resource: string) => `url("${urls.get(resource) ?? resource}")`,
      ),
    );
  }

  private async paint(
    entry: Entry,
    layers: string[],
    width: number,
    height: number,
  ): Promise<void> {
    const embedded = /url\(/i.test(layers.join('')) ? await this.embedImages(layers) : layers;
    if (this.disposed || entry.cancelled) return;
    if (!embedded) {
      this.fail(entry);
      return;
    }
    const ratio = Math.min(1, 1536 / Math.max(width, height));
    const pixelsWidth = Math.max(1, Math.round(width * ratio));
    const pixelsHeight = Math.max(1, Math.round(height * ratio));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelsWidth}" height="${pixelsHeight}" viewBox="0 0 ${width} ${height}"><foreignObject width="${width}" height="${height}"><div xmlns="http://www.w3.org/1999/xhtml" style="position:relative;width:${width}px;height:${height}px;overflow:hidden">${[
      ...embedded,
    ]
      .reverse()
      .map((css) => `<div style="${escapeXml(css)}"></div>`)
      .join('')}</div></foreignObject></svg>`;
    const image = this.document.createElement('img');
    image.onload = () => {
      if (this.disposed || entry.cancelled) return;
      const canvas = this.document.createElement('canvas');
      canvas.width = pixelsWidth;
      canvas.height = pixelsHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        this.fail(entry);
        return;
      }
      try {
        context.drawImage(image, 0, 0);
      } catch {
        this.fail(entry);
        return;
      }
      const gl = this.gl;
      const texture = gl.createTexture();
      if (!texture) {
        this.fail(entry);
        return;
      }
      try {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        if (entry.texture) gl.deleteTexture(entry.texture);
        entry.texture = texture;
      } catch {
        gl.deleteTexture(texture);
        this.fail(entry);
        return;
      }
      entry.pending = false;
      this.refresh();
    };
    image.onerror = () => {
      if (!this.disposed && !entry.cancelled) this.fail(entry);
    };
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  private fail(entry: Entry): void {
    if (entry.texture) this.gl.deleteTexture(entry.texture);
    entry.texture = undefined;
    entry.pending = false;
    this.refresh();
  }

  destroy(): void {
    this.disposed = true;
    for (const entry of this.entries.values()) {
      entry.cancelled = true;
      if (entry.texture) this.gl.deleteTexture(entry.texture);
    }
    this.entries.clear();
    this.styles.clear();
    if (this.fallback) this.gl.deleteTexture(this.fallback);
    this.fallback = null;
  }
}
