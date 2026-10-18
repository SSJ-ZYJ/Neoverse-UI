import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NativeGlassRenderer } from './native';

let renderer: NativeGlassRenderer;
let release = vi.fn(() => undefined);
function surface() {
  const element = document.createElement('div');
  element.className = 'material-glass-elevated';
  element.style.cssText =
    'width:120px;height:80px;box-sizing:border-box;border-radius:16px;backdrop-filter:blur(18px)!important';
  vi.spyOn(element, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
  document.body.append(element);
  return element;
}

describe('native live-backdrop ownership', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-neoverse-glass-renderer');
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        ({
          createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
          putImageData: vi.fn(),
        }) as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,map');
    release = vi.fn(() => undefined);
    renderer = new NativeGlassRenderer(
      document,
      () => true,
      () => true,
      release,
    );
  });
  afterEach(() => {
    renderer.destroy();
    vi.restoreAllMocks();
  });

  it('shares geometry maps and restores caller filters and priority across destroy/remount', () => {
    const a = surface(),
      b = surface();
    renderer.mount();
    renderer.mount();
    expect(a.style.backdropFilter).toContain('url(');
    expect(a.style.getPropertyPriority('backdrop-filter')).toBe('important');
    expect(a.getAttribute('data-neoverse-glass-native-filter')).toBe(
      b.getAttribute('data-neoverse-glass-native-filter'),
    );
    expect(document.querySelectorAll('feDisplacementMap')).toHaveLength(1);
    renderer.destroy();
    expect(a.style.backdropFilter).toBe('blur(18px)');
    expect(a.style.getPropertyPriority('backdrop-filter')).toBe('important');
    expect(a.hasAttribute('data-neoverse-glass-native-filter')).toBe(false);
    expect(document.querySelector('[data-neoverse-glass-native-defs]')).toBeNull();
    expect(release).toHaveBeenCalledTimes(1);
    renderer.mount();
    expect(document.querySelectorAll('feDisplacementMap')).toHaveLength(1);
  });

  it('keeps external filter edits when the owner opts out or is removed', () => {
    const a = surface();
    renderer.mount();
    a.style.setProperty('backdrop-filter', 'blur(12px) saturate(1.2)');
    renderer.refresh();
    expect(a.style.backdropFilter).toMatch(/url\(.*\) saturate\(1.2\)/);
    expect(document.querySelector('feGaussianBlur')?.getAttribute('stdDeviation')).toBe('12');
    a.style.setProperty('--neoverse-material-refraction-strength', '0');
    renderer.refresh();
    expect(a.style.backdropFilter).toBe('blur(12px) saturate(1.2)');
    expect(document.querySelectorAll('feDisplacementMap')).toHaveLength(0);
    a.style.removeProperty('--neoverse-material-refraction-strength');
    renderer.refresh();
    a.remove();
    renderer.refresh();
    expect(a.style.backdropFilter).toBe('blur(12px) saturate(1.2)');
    expect(document.querySelectorAll('feDisplacementMap')).toHaveLength(0);
  });

  it('does not attach effects to invisible or particle-capture surfaces', () => {
    const a = surface();
    a.style.visibility = 'hidden';
    const capture = document.createElement('div');
    capture.setAttribute('data-neoverse-particle-capture', '');
    capture.append(surface());
    document.body.append(capture);
    renderer.mount();
    expect(document.querySelectorAll('feDisplacementMap')).toHaveLength(0);
    expect(a.style.backdropFilter).toBe('blur(18px)');
  });

  it('does not overwrite a caller edit made immediately before destroy', () => {
    const a = surface();
    renderer.mount();
    a.style.setProperty('backdrop-filter', 'blur(8px)', 'important');
    renderer.destroy();
    expect(a.style.backdropFilter).toBe('blur(8px)');
    expect(a.style.getPropertyPriority('backdrop-filter')).toBe('important');
  });
});
