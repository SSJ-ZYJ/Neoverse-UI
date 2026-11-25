import { describe, expect, it, vi } from 'vitest';
import { createFakeGl, installCanvasContext } from './fake-webgl.test-support';
import {
  createTestRenderer,
  registerGlassRendererSuiteHooks,
  setRect,
} from './runtime.test-support';

describe('Glass renderer optics and theme profiles', () => {
  registerGlassRendererSuiteHooks();

  it('uses the same backdrop-composited WebGL edge for independent buttons', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const button = document.createElement('button');
    button.className = 'ui-button material-glass-subtle';
    setRect(button, { width: 100, height: 32 });
    document.body.append(button);

    const renderer = createTestRenderer();
    renderer.mount();

    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  });

  it('applies a consumer edge gain and refreshes it on the same canvas', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const card = document.createElement('div');
    card.className = 'material-glass-elevated';
    setRect(card, { width: 100, height: 60 });
    document.body.append(card);
    document.documentElement.style.colorScheme = 'light';
    document.documentElement.style.setProperty('--neoverse-material-edge-refraction-gain', '2.5');
    const renderer = createTestRenderer();
    renderer.mount();
    const canvas = document.querySelector('[data-neoverse-glass-renderer-canvas]');
    expect(gl.uniform1f).toHaveBeenCalledWith(expect.objectContaining({ name: 'u_gain' }), 2.5);
    document.documentElement.style.colorScheme = 'dark';
    document.documentElement.style.setProperty('--neoverse-material-edge-refraction-gain', '1');
    renderer.refresh();
    expect(document.querySelector('[data-neoverse-glass-renderer-canvas]')).toBe(canvas);
    expect(
      gl.uniform1f.mock.calls.filter(([location]) => location?.name === 'u_gain').at(-1)?.[1],
    ).toBe(1);
  });

  it('keeps tier blur and the shared canvas when the palette changes', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const card = document.createElement('article');
    card.className = 'material-glass-elevated';
    card.style.backdropFilter = 'blur(18px) saturate(145%)';
    setRect(card, { width: 120, height: 80 });
    document.body.append(card);
    document.documentElement.style.colorScheme = 'light';
    const renderer = createTestRenderer();
    renderer.mount();
    const canvas = document.querySelector('[data-neoverse-glass-renderer-canvas]');
    for (const theme of ['dark', 'light']) {
      document.documentElement.style.colorScheme = theme;
      renderer.refresh();
      expect(
        gl.uniform1f.mock.calls
          .filter(([location]) => location?.name === 'u_light_surface')
          .at(-1)?.[1],
      ).toBe(theme === 'light' ? 1 : 0);
      expect(document.querySelector('[data-neoverse-glass-renderer-canvas]')).toBe(canvas);
      expect(card.style.backdropFilter).toBe('blur(18px) saturate(145%)');
      expect(card.children).toHaveLength(0);
    }
    expect(gl.drawArrays).toHaveBeenCalledTimes(3);
    expect(gl.createProgram).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-neoverse-glass-native-defs]')).toBeNull();
  });

  it('keeps the backdrop lift when the system color scheme changes', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const css = window.CSS;
    vi.spyOn(css, 'supports').mockImplementation(
      (...args: string[]) => args[0] === 'mix-blend-mode' && args[1] === 'color-dodge',
    );
    vi.spyOn(window, 'CSS', 'get').mockReturnValue(css);
    const systemScheme = new EventTarget();
    const removeListener = vi.spyOn(systemScheme, 'removeEventListener');
    const originalMatchMedia = window.matchMedia.bind(window);
    const originalGetComputedStyle = window.getComputedStyle.bind(window);
    let computedScheme = 'light';
    vi.spyOn(window, 'matchMedia').mockImplementation((query) =>
      query === '(prefers-color-scheme: dark)'
        ? (systemScheme as MediaQueryList)
        : originalMatchMedia(query),
    );
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
      const style = originalGetComputedStyle(element, pseudo);
      if (element !== document.documentElement) return style;
      return new Proxy(style, {
        get(target, property) {
          if (property === 'colorScheme') return computedScheme;
          const value = Reflect.get(target, property, target);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
    });
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const card = document.createElement('article');
    card.className = 'material-glass-elevated';
    setRect(card, {});
    document.body.append(card);
    const renderer = createTestRenderer();
    renderer.mount();
    const canvas = document.querySelector<HTMLCanvasElement>(
      '[data-neoverse-glass-renderer-canvas]',
    );
    expect(canvas?.style.mixBlendMode).toBe('color-dodge');
    expect(gl.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_light_surface' }),
      1,
    );

    // A media-query change updates computed CSS without mutating the DOM.
    computedScheme = 'dark';
    systemScheme.dispatchEvent(new Event('change'));
    expect(canvas?.style.mixBlendMode).toBe('color-dodge');
    expect(
      gl.uniform1f.mock.calls
        .filter(([location]) => location?.name === 'u_light_surface')
        .at(-1)?.[1],
    ).toBe(0);
    renderer.destroy();
    expect(removeListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('uses the established luminance fallback when no color scheme is declared', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const card = document.createElement('article');
    card.className = 'material-glass-elevated';
    setRect(card, {});
    document.body.append(card);
    document.documentElement.style.setProperty('--neoverse-color-edge-light', 'rgb(255 255 255)');
    const renderer = createTestRenderer();
    renderer.mount();
    expect(gl.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_corner_focus' }),
      0.4,
    );
    expect(gl.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_light_surface' }),
      -1,
    );

    document.documentElement.style.setProperty('--neoverse-color-edge-light', 'rgb(0 0 0)');
    renderer.refresh();
    expect(
      gl.uniform1f.mock.calls
        .filter(([location]) => location?.name === 'u_corner_focus')
        .at(-1)?.[1],
    ).toBe(0);
  });

  it('keeps a continuous light contour with a moderate corner focus and retains the dark button profile', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const button = document.createElement('button');
    button.className = 'ui-button material-glass-subtle';
    setRect(button, { width: 100, height: 32 });
    document.body.append(button);
    document.documentElement.style.colorScheme = 'light';
    const renderer = createTestRenderer();
    renderer.mount();
    expect(gl.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_corner_focus' }),
      0.4,
    );

    button.remove();
    const card = document.createElement('article');
    card.className = 'material-glass-elevated';
    setRect(card, { width: 300, height: 180 });
    document.body.append(card);
    gl.uniform1f.mockClear();
    renderer.refresh();
    expect(gl.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_corner_focus' }),
      0.4,
    );

    document.documentElement.style.colorScheme = 'dark';
    gl.uniform1f.mockClear();
    renderer.refresh();
    expect(gl.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_corner_focus' }),
      0,
    );

    card.remove();
    document.body.append(button);
    gl.uniform1f.mockClear();
    renderer.refresh();
    expect(gl.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_corner_focus' }),
      1,
    );
  });

  it('keeps dark chroma independent of brighter edge opacity and ancestor opacity', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const parent = document.createElement('section');
    parent.style.opacity = '0.5';
    const card = document.createElement('article');
    card.className = 'material-glass-elevated';
    card.style.setProperty('--neoverse-material-edge-refraction-opacity', '0.54');
    card.style.setProperty('--neoverse-material-edge-refraction-chroma', '0.12');
    setRect(card, { width: 100, height: 60 });
    parent.append(card);
    document.body.append(parent);
    document.documentElement.style.colorScheme = 'dark';
    const renderer = createTestRenderer();
    renderer.mount();
    expect(gl.uniform1f).toHaveBeenCalledWith(expect.objectContaining({ name: 'u_opacity' }), 0.27);
    expect(gl.uniform1f).toHaveBeenCalledWith(expect.objectContaining({ name: 'u_chroma' }), 0.12);
    card.style.setProperty('--neoverse-material-edge-refraction-opacity', '0.8');
    renderer.refresh();
    expect(gl.uniform1f).toHaveBeenCalledWith(expect.objectContaining({ name: 'u_opacity' }), 0.4);
    expect(
      gl.uniform1f.mock.calls.filter(([location]) => location?.name === 'u_chroma').at(-1)?.[1],
    ).toBe(0.12);
  });

  it('allows an explicitly opted-in button to use the shared WebGL edge pass', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const button = document.createElement('button');
    button.className = 'ui-button material-glass-subtle';
    button.dataset.neoverseGlassEdgePassActive = 'webgl';
    setRect(button, { width: 100, height: 32 });
    document.body.append(button);

    const renderer = createTestRenderer();
    renderer.mount();

    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  });

  it('resolves the released color response without losing translucent token strength', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    document.documentElement.style.setProperty(
      '--neoverse-color-edge-light',
      'rgb(255 255 255 / 13%)',
    );
    const glass = document.createElement('article');
    glass.className = 'material-glass-elevated';
    glass.style.setProperty(
      '--neoverse-material-edge-refraction-carrier',
      'rgb(255 255 255 / 6.47%)',
    );
    setRect(glass, { width: 100, height: 60 });
    document.body.append(glass);

    const renderer = createTestRenderer();
    renderer.mount();

    expect(gl.uniform3f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_edge_light' }),
      0.13,
      0.13,
      0.13,
    );
    expect(gl.uniform3f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_carrier' }),
      0.0647,
      0.0647,
      0.0647,
    );
  });
});
