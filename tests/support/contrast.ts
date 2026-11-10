/**
 * Measures WCAG contrast from the rendered document, not from token strings.
 *
 * The function runs inside the page, so it carries its own canvas-based color
 * parsing: the engine serializes colors as `rgb()`, `rgba()`, `color(srgb ...)`
 * or a named value depending on the declaration, and canvas normalizes all of
 * them to 8-bit RGBA.
 */
export type ContrastSample = {
  selector: string;
  text: string;
  ratio: number;
  foreground: string;
  background: string;
  fontSize: string;
  fontWeight: string;
};

export function measureContrast(selectors: readonly string[]): ContrastSample[] {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (context === null) throw new Error('A 2D canvas context is required');

  const parse = (value: string): [number, number, number, number] => {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = '#000000';
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
    return [red ?? 0, green ?? 0, blue ?? 0, (alpha ?? 255) / 255];
  };

  const composite = (
    foreground: readonly number[],
    background: readonly number[],
  ): [number, number, number] => {
    const alpha = foreground[3] ?? 1;
    return [0, 1, 2].map((index) =>
      Math.round((foreground[index] ?? 0) * alpha + (background[index] ?? 0) * (1 - alpha)),
    ) as [number, number, number];
  };

  const luminance = (color: readonly number[]): number => {
    const [red, green, blue] = color.slice(0, 3).map((channel) => {
      const value = (channel ?? 0) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };

  const ratio = (first: readonly number[], second: readonly number[]): number => {
    const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a) as [
      number,
      number,
    ];
    return (lighter + 0.05) / (darker + 0.05);
  };

  const backdrop = (element: Element): [number, number, number] => {
    const layers: number[][] = [];
    let node: Element | null = element;
    while (node !== null) {
      const color = parse(getComputedStyle(node).backgroundColor);
      if ((color[3] ?? 1) > 0) layers.push([...color]);
      if ((color[3] ?? 1) >= 0.999) break;
      node = node.parentElement;
    }
    let base: [number, number, number] = [255, 255, 255];
    for (const layer of layers.reverse()) base = composite(layer, base);
    return base;
  };

  const samples: ContrastSample[] = [];
  for (const selector of selectors) {
    for (const element of document.querySelectorAll(selector)) {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (rect.width === 0 || rect.height === 0 || style.visibility === 'hidden') continue;
      const background = backdrop(element);
      const foreground = composite(parse(style.color), background);
      samples.push({
        selector,
        text: (element.textContent ?? '').trim().slice(0, 40),
        ratio: Number(ratio(foreground, background).toFixed(2)),
        foreground: style.color,
        background: `rgb(${background.join(' ')})`,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
      });
    }
  }
  return samples;
}
