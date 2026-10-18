import { afterEach, describe, expect, it, vi } from 'vitest';
import { GlassBackgrounds } from './background';

const color = (value: string): [number, number, number, number] | undefined => {
  const channels = value.match(/[\d.]+/g)?.map(Number);
  if (!channels || channels.length < 3) return undefined;
  return [
    (channels[0] ?? 0) / 255,
    (channels[1] ?? 0) / 255,
    (channels[2] ?? 0) / 255,
    channels[3] ?? 1,
  ];
};

const setup = () => {
  const gl = {
    TEXTURE_2D: 1,
    TEXTURE0: 0,
    TEXTURE_MIN_FILTER: 2,
    TEXTURE_MAG_FILTER: 3,
    TEXTURE_WRAP_S: 4,
    TEXTURE_WRAP_T: 5,
    LINEAR: 6,
    CLAMP_TO_EDGE: 7,
    RGBA: 8,
    UNSIGNED_BYTE: 9,
    createTexture: vi.fn(() => ({})),
    deleteTexture: vi.fn(),
    bindTexture: vi.fn(),
    activeTexture: vi.fn(),
    texParameteri: vi.fn(),
    texImage2D: vi.fn(),
  };
  const images: HTMLImageElement[] = [];
  const createElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((name: string) => {
    const element = createElement(name);
    if (name === 'img') {
      // Control completion order instead of Happy DOM's synchronous data load.
      Object.defineProperty(element, 'src', { get: () => '', set: vi.fn() });
      images.push(element as HTMLImageElement);
    }
    return element;
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  const stage = createElement('div');
  stage.style.cssText =
    'background-color:rgb(255,255,255);background-image:linear-gradient(red,blue)';
  let top = 24;
  stage.getBoundingClientRect = () => new DOMRect(24, top, 320, 240);
  const card = createElement('div');
  stage.append(card);
  document.body.append(stage);
  const refresh = vi.fn();
  const cache = new GlassBackgrounds(
    gl as unknown as WebGLRenderingContext,
    document,
    refresh,
    color,
  );
  return {
    gl,
    images,
    stage,
    card,
    refresh,
    cache,
    scroll: (value: number) => {
      top = value;
    },
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('Glass background paint cache', () => {
  it('reuses the painted texture as its source scrolls and releases detached resources', () => {
    const { gl, images, stage, card, cache, scroll } = setup();
    cache.beginFrame();
    expect(cache.sample(card, window)).toBeUndefined();
    expect(images).toHaveLength(1);
    images[0]?.dispatchEvent(new Event('load'));
    const first = cache.sample(card, window);
    expect(first?.texture).toBeDefined();
    scroll(-276);
    cache.beginFrame();
    const moved = cache.sample(card, window);
    expect(moved?.texture).toBe(first?.texture);
    expect(moved?.rect.top).toBe(-276);
    expect(images).toHaveLength(1);
    expect(gl.texImage2D).toHaveBeenCalledTimes(2); // fallback plus one paint
    stage.remove();
    cache.beginFrame();
    expect(gl.deleteTexture).toHaveBeenCalledWith(first?.texture);
    cache.destroy();
    expect(gl.deleteTexture).toHaveBeenCalledTimes(2);
  });

  it('ignores an older theme paint that finishes after the source has changed', () => {
    const { gl, images, stage, card, cache, refresh } = setup();
    cache.beginFrame();
    cache.sample(card, window);
    stage.style.backgroundImage = 'linear-gradient(green,purple)';
    cache.beginFrame();
    cache.sample(card, window);
    expect(images).toHaveLength(2);
    images[0]?.dispatchEvent(new Event('load'));
    expect(gl.texImage2D).toHaveBeenCalledTimes(1);
    images[1]?.dispatchEvent(new Event('load'));
    expect(gl.texImage2D).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(cache.sample(card, window)?.texture).toBeDefined();
    cache.destroy();
  });

  it('composites translucent solid backgrounds without preparing an image', () => {
    const { images, stage, card, cache } = setup();
    const tint = document.createElement('div');
    tint.style.backgroundColor = 'rgba(255,0,0,0.25)';
    tint.getBoundingClientRect = () => new DOMRect(24, 24, 320, 240);
    stage.style.backgroundImage = 'none';
    stage.append(tint);
    tint.append(card);
    cache.beginFrame();
    expect(cache.sample(card, window)?.color).toEqual([1, 0.75, 0.75, 1]);
    expect(images).toHaveLength(0);
    cache.destroy();
  });

  it('discards old theme colours when the replacement paint fails', () => {
    const { gl, images, stage, card, cache } = setup();
    cache.sample(card, window);
    images[0]?.dispatchEvent(new Event('load'));
    const old = cache.sample(card, window)?.texture;
    expect(old).toBeDefined();
    stage.style.backgroundImage = 'linear-gradient(green,purple)';
    cache.beginFrame();
    cache.sample(card, window);
    images[1]?.dispatchEvent(new Event('error'));
    expect(cache.sample(card, window)).toBeUndefined();
    expect(gl.deleteTexture).toHaveBeenCalledWith(old);
    cache.destroy();
  });
});
