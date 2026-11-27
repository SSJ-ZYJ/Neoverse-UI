import type { Color } from '../style-colors.js';
import { parseFirstNumber } from '../surface-geometry.js';
import { colorProperties, firstPropertyValue, resolveColor } from './style-resolution.js';

export interface SceneColors {
  gain: number;
  edgeLight: Color;
  primary: Color;
  secondary: Color;
  tertiary: Color;
  lightSurface: number;
  isLight: boolean;
  colorDodge: boolean;
}

export interface SceneColorWindow {
  CSS?: Pick<typeof CSS, 'supports'>;
  getComputedStyle: Window['getComputedStyle'];
}

/** FNV-1a accumulation keeps frame and color signatures allocation-free. */
export const mixSignature = (hash: number, value: number): number => {
  const next = hash ^ (Math.round(value * 100) | 0);
  return Math.imul(next, 16777619);
};

export const mixSignatureText = (hash: number, value: string): number => {
  let next = hash;
  for (let index = 0; index < value.length; index += 1) {
    next ^= value.charCodeAt(index);
    next = Math.imul(next, 16777619);
  }
  return next;
};

/** Theme colors change with the root token signature, not on every frame.
 * Caching avoids roughly forty probe style writes and computed-style reads
 * per repaint, and keeps the probe out of the mutation stream. */
export class SceneColorCache {
  private signature = 0;
  private cached: SceneColors | undefined;

  public invalidate(): void {
    this.signature = 0;
    this.cached = undefined;
  }

  public resolve(
    rootStyle: CSSStyleDeclaration,
    view: Window & SceneColorWindow,
    probe: HTMLElement,
  ): SceneColors {
    let hash = 2166136261;
    hash = mixSignatureText(hash, rootStyle.colorScheme);
    for (const property of colorProperties) {
      hash = mixSignatureText(hash, rootStyle.getPropertyValue(property));
    }
    hash = mixSignatureText(
      hash,
      rootStyle.getPropertyValue('--neoverse-material-edge-refraction-gain'),
    );
    const signature = hash || 1;
    if (this.cached !== undefined && this.signature === signature) {
      return this.cached;
    }

    const gain = Math.max(
      parseFirstNumber(rootStyle.getPropertyValue('--neoverse-material-edge-refraction-gain'), 1),
      0,
    );
    const edgeLight = resolveColor(
      rootStyle,
      [
        firstPropertyValue(rootStyle, ['--neoverse-color-edge-light', '--edge-light']) ??
          'var(--neoverse-color-edge-light)',
        'var(--edge-light)',
      ],
      view,
      probe,
      [1, 1, 1],
    );
    const lightSurface =
      rootStyle.colorScheme === 'light' ? 1 : rootStyle.colorScheme === 'dark' ? 0 : -1;
    // Match the shader's smoothstep(0.55, 0.88, luminance) > 0.5 fallback
    // when a consumer has not declared a color scheme.
    const lightLuminance = edgeLight[0] * 0.2126 + edgeLight[1] * 0.7152 + edgeLight[2] * 0.0722;
    const isLight = lightSurface === 1 || (lightSurface === -1 && lightLuminance > 0.715);
    const primary = resolveColor(
      rootStyle,
      [
        firstPropertyValue(rootStyle, ['--neoverse-color-accent-primary', '--accent-primary']) ??
          'var(--neoverse-color-accent-primary)',
        'var(--accent-primary)',
      ],
      view,
      probe,
      [0.45, 0.73, 0.9],
    );
    const secondary = resolveColor(
      rootStyle,
      [
        firstPropertyValue(rootStyle, [
          '--neoverse-color-accent-secondary',
          '--accent-secondary',
        ]) ?? 'var(--neoverse-color-accent-secondary)',
        'var(--accent-secondary)',
      ],
      view,
      probe,
      [0.3, 0.85, 0.7],
    );
    const tertiary = resolveColor(
      rootStyle,
      [
        firstPropertyValue(rootStyle, ['--neoverse-color-accent-tertiary', '--accent-tertiary']) ??
          'var(--neoverse-color-accent-tertiary)',
        'var(--accent-tertiary)',
      ],
      view,
      probe,
      [0.48, 0.43, 0.9],
    );
    const colors: SceneColors = {
      gain,
      edgeLight,
      primary,
      secondary,
      tertiary,
      lightSurface,
      isLight,
      colorDodge: view.CSS?.supports('mix-blend-mode', 'color-dodge') === true,
    };
    this.signature = signature;
    this.cached = colors;
    return colors;
  }
}
