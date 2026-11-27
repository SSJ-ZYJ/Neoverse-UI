import { createGlassRenderer, type GlassRenderer } from '@neoverse-ui/glass-runtime';

// Match the released Glass appearance by default. The alternative native
// displacement renderer remains available only through its explicit fixture switch.
export function mountPlaygroundGlass() {
  const backend =
    new URLSearchParams(location.search).get('glass') === 'native' ? 'native' : 'webgl';
  const renderer = createGlassRenderer({ backend });
  renderer.mount();
  // Design Lab browser specs drive suspend/resume through the live renderer.
  (window as Window & { __neoverseGlassRenderer?: GlassRenderer }).__neoverseGlassRenderer =
    renderer;
  return renderer;
}
