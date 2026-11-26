import { describe, expect, it } from 'vitest';
import { createFakeGl, installCanvasContext } from './fake-webgl.test-support';
import { glassRendererAttribute } from './index';
import {
  createTestRenderer,
  registerGlassRendererSuiteHooks,
  setRect,
} from './runtime.test-support';

describe('Glass renderer core', () => {
  registerGlassRendererSuiteHooks();

  it('prefers WebGL2 and draws one shared canvas for top-level Glass', () => {
    const webgl2 = createFakeGl();
    const webgl = createFakeGl();
    installCanvasContext({ webgl2, webgl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-elevated';
    setRect(glass, { left: 20, top: 30 });
    document.body.append(glass);

    const renderer = createTestRenderer({ maxDevicePixelRatio: 1 });
    renderer.mount();

    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith(
      'webgl2',
      expect.objectContaining({ alpha: true }),
    );
    expect(HTMLCanvasElement.prototype.getContext).not.toHaveBeenCalledWith(
      'webgl',
      expect.anything(),
    );
    expect(document.querySelectorAll('[data-neoverse-glass-renderer-canvas]')).toHaveLength(1);
    expect(document.documentElement.getAttribute(glassRendererAttribute)).toBe('webgl');
    expect(webgl2.drawArrays).toHaveBeenCalledTimes(1);
    // The released edge uses luminous composition rather than ordinary source-over.
    expect(webgl2.blendFuncSeparate).toHaveBeenCalledWith(
      webgl2.SRC_ALPHA,
      webgl2.ONE_MINUS_SRC_ALPHA,
      webgl2.ONE,
      webgl2.ONE_MINUS_SRC_ALPHA,
    );
    expect(webgl2.getUniformLocation).toHaveBeenCalledWith(expect.anything(), 'u_pixel_ratio');
    expect(webgl2.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_pixel_ratio' }),
      1,
    );
    renderer.destroy();
  });

  it('does not treat particle capture clones as independent Glass surfaces', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const source = document.createElement('article');
    source.className = 'material-glass-elevated';
    setRect(source, { width: 200, height: 120 });
    const capture = document.createElement('div');
    capture.dataset.neoverseParticleCapture = '';
    const clone = source.cloneNode(true) as HTMLElement;
    setRect(clone, { width: 200, height: 120 });
    capture.append(clone);
    document.body.append(source, capture);
    createTestRenderer().mount();
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    expect(clone.style.length).toBe(0);
  });

  it('falls back to WebGL1 when WebGL2 is unavailable', () => {
    const webgl = createFakeGl();
    installCanvasContext({ webgl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    document.body.append(glass);

    const renderer = createTestRenderer();
    renderer.mount();

    expect(webgl.drawArrays).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll('[data-neoverse-glass-renderer-canvas]')).toHaveLength(1);
    renderer.destroy();
  });

  it('rasterizes only the perimeter of a large Glass panel', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const surface = document.createElement('article');
    surface.className = 'material-glass-elevated';
    surface.style.borderRadius = '32px';
    setRect(surface, { width: 960, height: 640 });
    document.body.append(surface);
    const renderer = createTestRenderer({ maxDevicePixelRatio: 1 });
    renderer.mount();
    const rasterized = gl.scissor.mock.calls.reduce(
      (sum, [, , width, height]) => sum + width * height,
      0,
    );
    expect(rasterized).toBeLessThan(960 * 640 * 0.35);
    expect(gl.drawArrays).toHaveBeenCalledTimes(4);
  });

  it('leaves CSS-selected surfaces on the library edge field', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-elevated';
    glass.dataset.neoverseGlassEdgePass = 'css';
    setRect(glass, {});
    document.body.append(glass);

    const renderer = createTestRenderer();
    renderer.mount();

    expect(gl.drawArrays).not.toHaveBeenCalled();
  });

  it.each([
    ['input', 'ui-input'],
    ['textarea', 'ui-textarea'],
    ['summary', 'ui-select'],
    ['span', 'ui-choice__control'],
    ['div', 'ui-select__popover'],
    ['details', 'ui-disclosure'],
  ])('draws the shared edge for %s without a material utility', (tag, className) => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const control = document.createElement(tag);
    control.className = className;
    setRect(control, { left: 20, top: 30, width: 180, height: 40 });
    document.body.append(control);

    createTestRenderer().mount();

    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll('[data-neoverse-glass-renderer-canvas]')).toHaveLength(1);
  });

  it('does not render a separate Glass edge on the segmented selection', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const slider = document.createElement('span');
    slider.className = 'ui-segmented-control__slider';
    slider.style.setProperty('--neoverse-control-segmented-active-edge-display', 'block');
    slider.style.setProperty('--neoverse-material-edge-refraction-opacity', '0.34');
    setRect(slider, { left: 24, top: 30, width: 120, height: 36 });
    document.body.append(slider);

    createTestRenderer().mount();
    expect(gl.drawArrays).not.toHaveBeenCalled();
  });

  it.each([
    ['input', 'ui-input', 0.5],
    ['textarea', 'ui-textarea', 0.5],
    ['summary', 'ui-select', 0.5],
    ['span', 'ui-choice__control', 0.5],
    ['div', 'ui-select__popover', 0.54],
    ['details', 'ui-disclosure', 0.5],
  ])('renders the dark Glass pass for %s with its tier optics', (tag, className, opacity) => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    document.documentElement.style.colorScheme = 'dark';
    const control = document.createElement(tag);
    control.className = className;
    control.style.setProperty('--neoverse-material-edge-refraction-opacity', String(opacity));
    control.style.setProperty('--neoverse-material-edge-refraction-chroma', '0.12');
    control.style.backdropFilter = 'blur(12px)';
    setRect(control, { left: 20, top: 30, width: 180, height: 40 });
    document.body.append(control);

    createTestRenderer().mount();

    const canvas = document.querySelector<HTMLCanvasElement>(
      '[data-neoverse-glass-renderer-canvas]',
    );
    expect(canvas?.style.mixBlendMode).toBe('color-dodge');
    expect(gl.blendFuncSeparate).toHaveBeenLastCalledWith(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
    expect(gl.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_light_surface' }),
      0,
    );
    expect(gl.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_opacity' }),
      opacity,
    );
    expect(gl.uniform1f).toHaveBeenCalledWith(expect.objectContaining({ name: 'u_chroma' }), 0.12);
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    expect(control.style.backdropFilter).toBe('blur(12px)');
  });

  it.each(['component', 'prose'] as const)(
    'updates the %s disclosure edge when its native details element opens',
    (kind) => {
      const gl = createFakeGl();
      installCanvasContext({ webgl2: gl });
      const details = document.createElement('details');
      if (kind === 'component') {
        details.className = 'ui-disclosure';
        document.body.append(details);
      } else {
        const prose = document.createElement('article');
        prose.className = 'neoverse-prose';
        prose.append(details);
        document.body.append(prose);
      }
      setRect(details, { left: 20, top: 30, width: 180, height: 40 });
      const renderer = createTestRenderer();
      renderer.mount();
      expect(gl.uniform4f).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'u_rect' }),
        20,
        30,
        180,
        40,
      );

      details.open = true;
      setRect(details, { left: 20, top: 30, width: 180, height: 100 });
      renderer.refresh();
      expect(gl.uniform4f).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'u_rect' }),
        20,
        30,
        180,
        100,
      );
    },
  );

  it.each(['disabled', 'readonly'])('retains the dark Glass edge on %s inputs', (state) => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    document.documentElement.style.colorScheme = 'dark';
    const input = document.createElement('input');
    input.className = 'ui-input';
    input.setAttribute(state, '');
    setRect(input, { left: 20, top: 30, width: 180, height: 40 });
    document.body.append(input);

    createTestRenderer().mount();

    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    expect(gl.uniform1f).toHaveBeenCalledWith(expect.objectContaining({ name: 'u_opacity' }), 0.46);
  });

  it('does not flatten an inherited surface merely because it is inside an implicit form plate', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const popover = document.createElement('div');
    popover.className = 'ui-select__popover';
    const child = document.createElement('div');
    child.className = 'material-glass-subtle';
    child.dataset.neoverseGlassNesting = 'inherit';
    popover.append(child);
    setRect(popover, { left: 10, top: 10, width: 200, height: 100 });
    setRect(child, { left: 30, top: 30, width: 80, height: 40 });
    document.body.append(popover);

    createTestRenderer().mount();

    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
  });

  it('keeps the CSS fallback when no WebGL context is available', () => {
    installCanvasContext();
    const renderer = createTestRenderer();
    renderer.mount();

    expect(document.querySelector('[data-neoverse-glass-renderer-canvas]')).toBeNull();
    expect(document.documentElement.hasAttribute(glassRendererAttribute)).toBe(false);
    renderer.destroy();
  });

  it('deduplicates renderers, draws independent nested Glass, and ignores hidden surfaces', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const outer = document.createElement('article');
    outer.className = 'material-glass-immersive';
    setRect(outer, { width: 300, height: 200 });
    const nested = document.createElement('div');
    nested.className = 'material-glass-subtle';
    setRect(nested, { width: 100, height: 80 });
    const inherited = document.createElement('div');
    inherited.className = 'material-glass-subtle';
    inherited.dataset.neoverseGlassNesting = 'inherit';
    setRect(inherited, { width: 100, height: 80 });
    const controlGroup = document.createElement('div');
    controlGroup.className = 'ui-segmented-control material-glass-subtle';
    setRect(controlGroup, { width: 100, height: 32 });
    const control = document.createElement('button');
    control.className = 'ui-button material-glass-subtle';
    setRect(control, { width: 100, height: 32 });
    const hidden = document.createElement('div');
    hidden.className = 'material-glass-subtle';
    hidden.style.display = 'none';
    setRect(hidden, { width: 100, height: 80 });
    const zero = document.createElement('div');
    zero.className = 'material-glass-subtle';
    setRect(zero, { width: 0, height: 0 });
    const offscreen = document.createElement('div');
    offscreen.className = 'material-glass-subtle';
    setRect(offscreen, { left: window.innerWidth + 10, top: 20, width: 100, height: 80 });
    outer.append(nested, inherited, controlGroup, control, hidden, zero, offscreen);
    document.body.append(outer);

    const first = createTestRenderer();
    const second = createTestRenderer();
    first.mount();
    second.mount();

    expect(document.querySelectorAll('[data-neoverse-glass-renderer-canvas]')).toHaveLength(1);
    // Independent buttons, segmented shells and surface planes share the backdrop compositor.
    expect(gl.drawArrays).toHaveBeenCalledTimes(4);
    second.destroy();
    first.destroy();
  });

  it('removes a stale shared canvas before mounting a replacement runtime', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const staleCanvas = document.createElement('canvas');
    staleCanvas.setAttribute('data-neoverse-glass-renderer-canvas', 'true');
    document.body.append(staleCanvas);
    document.documentElement.setAttribute(glassRendererAttribute, 'webgl');

    const renderer = createTestRenderer();
    renderer.mount();

    expect(staleCanvas.isConnected).toBe(false);
    // A page without an eligible Glass surface owns no renderer canvas.
    expect(document.querySelectorAll('[data-neoverse-glass-renderer-canvas]')).toHaveLength(0);
    expect(gl.drawArrays).toHaveBeenCalledTimes(0);
  });

  it('removes the canvas and renderer marker on destroy', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    document.body.append(glass);
    const renderer = createTestRenderer();
    renderer.mount();

    renderer.destroy();

    expect(document.querySelector('[data-neoverse-glass-renderer-canvas]')).toBeNull();
    expect(document.documentElement.hasAttribute(glassRendererAttribute)).toBe(false);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
  });
});
