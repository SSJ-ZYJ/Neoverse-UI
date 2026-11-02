type Rgb = readonly [number, number, number];

const channels = ['red', 'green', 'blue'] as const;

/** Measure change in a source colour's dominant channel, not an unrelated brighter channel. */
export function measureDominantHighlight(base: Rgb, edge: Rgb, source: Rgb = base) {
  const peak = Math.max(...source);
  const dominantIndex = source.indexOf(peak);
  const lift = base.map((value, channel) => (edge[channel] ?? 0) - value);
  const headroom = 255 - (base[dominantIndex] ?? 0);
  const dominantLift = lift[dominantIndex] ?? 0;
  return {
    source,
    base,
    edge,
    lift,
    dominantChannel: channels[dominantIndex],
    dominantLift,
    normalizedLift: peak >= 16 && headroom >= 16 ? dominantLift / headroom : null,
  };
}

/** Compare colour as well as brightness; an almost-white line can be bright but lose its source. */
export function measureColourRetention(base: Rgb, edge: Rgb) {
  const hsv = (rgb: Rgb) => {
    const [r, g, b] = rgb.map((value) => value / 255);
    const max = Math.max(r ?? 0, g ?? 0, b ?? 0);
    const min = Math.min(r ?? 0, g ?? 0, b ?? 0);
    const chroma = max - min;
    let hue = 0;
    if (chroma > 0) {
      if (max === r) hue = (((g ?? 0) - (b ?? 0)) / chroma) % 6;
      else if (max === g) hue = ((b ?? 0) - (r ?? 0)) / chroma + 2;
      else hue = ((r ?? 0) - (g ?? 0)) / chroma + 4;
    }
    return { hue: (hue * 60 + 360) % 360, saturation: max > 0 ? chroma / max : 0 };
  };
  const before = hsv(base);
  const after = hsv(edge);
  if (before.saturation < 0.05) return { hueDifference: null, saturationRetention: null };
  const angle = Math.abs(after.hue - before.hue);
  return {
    hueDifference: Math.min(angle, 360 - angle),
    saturationRetention: after.saturation / before.saturation,
  };
}
