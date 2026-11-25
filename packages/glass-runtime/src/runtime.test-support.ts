import { afterEach, beforeEach, vi } from 'vitest';
import { createGlassRenderer, glassRendererAttribute } from './index';

export const setRect = (element: HTMLElement, rect: Partial<DOMRect>): void => {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    bottom: (rect.top ?? 0) + (rect.height ?? 120),
    height: rect.height ?? 120,
    left: rect.left ?? 0,
    right: (rect.left ?? 0) + (rect.width ?? 240),
    top: rect.top ?? 0,
    width: rect.width ?? 240,
    x: rect.left ?? 0,
    y: rect.top ?? 0,
    toJSON: () => ({}),
  });
};

// A cancel-aware frame queue: suspended renderers must be able to withdraw a
// pending frame, which a plain callback array cannot express.
export const installFrameQueue = () => {
  const pending = new Map<number, FrameRequestCallback>();
  let nextId = 1;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    const id = nextId;
    nextId += 1;
    pending.set(id, callback);
    return id;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: number) => {
    pending.delete(id);
  });
  return {
    flush(timestamp: number) {
      const callbacks = [...pending.values()];
      pending.clear();
      for (const callback of callbacks) callback(timestamp);
    },
    size: () => pending.size,
  };
};

export const installReducedTransparencyMedia = (initial = false) => {
  let reduced = initial;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const originalMatchMedia = window.matchMedia.bind(window);
  const transparencyMedia = {
    get matches() {
      return reduced;
    },
    media: '(prefers-reduced-transparency: reduce)',
    addEventListener: vi.fn((name: string, listener: (event: MediaQueryListEvent) => void) => {
      if (name === 'change') listeners.add(listener);
    }),
    removeEventListener: vi.fn((name: string, listener: (event: MediaQueryListEvent) => void) => {
      if (name === 'change') listeners.delete(listener);
    }),
  } as unknown as MediaQueryList;
  vi.spyOn(window, 'matchMedia').mockImplementation((query) =>
    query === transparencyMedia.media ? transparencyMedia : originalMatchMedia(query),
  );
  return {
    listeners,
    setReduced(matches: boolean) {
      reduced = matches;
      for (const listener of listeners) {
        listener({ matches } as MediaQueryListEvent);
      }
    },
  };
};

// happy-dom delivers MutationObserver records on the microtask queue.
export const flushMutations = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const mountedRenderers: Array<ReturnType<typeof createGlassRenderer>> = [];

export const createTestRenderer = (...args: Parameters<typeof createGlassRenderer>) => {
  const renderer = createGlassRenderer(...args);
  mountedRenderers.push(renderer);
  return renderer;
};

export function registerGlassRendererSuiteHooks(): void {
  afterEach(() => {
    for (const renderer of mountedRenderers) {
      renderer.destroy();
    }
    mountedRenderers.length = 0;
  });

  beforeEach(() => {
    document.documentElement.removeAttribute(glassRendererAttribute);
    document.documentElement.style.removeProperty('--neoverse-color-edge-light');
    document.documentElement.style.removeProperty('color-scheme');
    document.documentElement.style.removeProperty('--neoverse-material-edge-refraction-gain');
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });
}
