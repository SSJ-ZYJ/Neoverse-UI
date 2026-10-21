// Reconstruct the canonical body filter from a verified runtime-owned filter;
// the SVG may compose its body blur with a separately refracted edge.
export function readMaterialFilter(element: Element): string {
  const filter = getComputedStyle(element).backdropFilter;
  const id = element.getAttribute('data-neoverse-glass-native-filter');
  const native = id ? document.getElementById(id) : null;
  if (!id || !native?.closest('[data-neoverse-glass-native-defs]')) return filter;
  return filter
    .replace(
      /\s*url\(["']?(?:[^)#]*#)?(nv-backdrop-[\w-]+)["']?\)/g,
      (reference, target: string) => {
        if (target !== id) return reference;
        const blur = native.querySelector('feGaussianBlur')?.getAttribute('stdDeviation');
        return blur === null || blur === undefined ? '' : `blur(${blur}px)`;
      },
    )
    .trim();
}
