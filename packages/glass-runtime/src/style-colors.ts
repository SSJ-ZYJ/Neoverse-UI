export type Color = [number, number, number];

const parseColorComponent = (value: string, scale: number): number | undefined => {
  const normalized = value.trim();
  if (!/^-?[\d.]+%?$/.test(normalized)) {
    return undefined;
  }

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.min(Math.max(parsed / (normalized.endsWith('%') ? 100 : scale), 0), 1);
};

// Shader color uniforms carry visible RGB contribution, so preserve CSS alpha
// by premultiplying it instead of silently treating translucent tokens as white.
export const parseColor = (value: string): Color | undefined => {
  const normalized = value.trim().toLowerCase();
  const hexMatch = /^#([\da-f]{3,8})$/i.exec(normalized);

  if (hexMatch !== null) {
    const hex = hexMatch[1];
    if (hex === undefined) {
      return undefined;
    }

    const expanded = hex.length <= 4 ? [...hex].map((digit) => `${digit}${digit}`).join('') : hex;
    const channels = expanded.slice(0, 6).match(/[\da-f]{2}/gi);
    if (channels === null || channels.length !== 3) {
      return undefined;
    }

    const alpha = expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1;
    return channels.map((channel) => (Number.parseInt(channel, 16) / 255) * alpha) as Color;
  }

  const rgbMatch = /^(?:rgb|rgba)\((.*)\)$/.exec(normalized);
  if (rgbMatch !== null) {
    const components = (rgbMatch[1] ?? '')
      .trim()
      .replace(/\s*\/\s*/, ',')
      .split(/[\s,]+/);
    if (components.length < 3) {
      return undefined;
    }

    const channels = components.slice(0, 3).map((component) => parseColorComponent(component, 255));
    if (channels.some((channel) => channel === undefined)) {
      return undefined;
    }

    const alpha = components[3] === undefined ? 1 : (parseColorComponent(components[3], 1) ?? 1);
    return channels.map((channel) => (channel ?? 0) * alpha) as Color;
  }

  const colorFunctionMatch = /^color\(\s*srgb\s+(.+)\)$/.exec(normalized);
  if (colorFunctionMatch !== null) {
    const components = (colorFunctionMatch[1] ?? '')
      .trim()
      .replace(/\s*\/\s*/, ',')
      .split(/[\s,]+/);
    if (components.length < 3) {
      return undefined;
    }

    const channels = components.slice(0, 3).map((component) => parseColorComponent(component, 1));
    if (channels.some((channel) => channel === undefined)) {
      return undefined;
    }

    const alpha = components[3] === undefined ? 1 : (parseColorComponent(components[3], 1) ?? 1);
    return channels.map((channel) => (channel ?? 0) * alpha) as Color;
  }

  return undefined;
};
