import { createGlassRenderer } from '@neoverse-ui/glass-runtime';

// Match the released Glass appearance by default. The alternative native
// displacement renderer remains available only through its explicit fixture switch.
export function mountPlaygroundGlass() {
  const backend =
    new URLSearchParams(location.search).get('glass') === 'native' ? 'native' : 'webgl';
  const renderer = createGlassRenderer({ backend });
  renderer.mount();
  return renderer;
}
