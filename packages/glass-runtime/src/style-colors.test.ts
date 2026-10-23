import { describe, expect, it } from 'vitest';
import { parseColor } from './style-colors';

describe('glass shader color parsing', () => {
  it('premultiplies hex alpha for shader color uniforms', () => {
    expect(parseColor('#ff000080')).toEqual([128 / 255, 0, 0]);
    expect(parseColor('#0f08')).toEqual([0, (255 / 255) * (136 / 255), 0]);
  });

  it('preserves opacity and percentage channels of computed RGB values', () => {
    expect(parseColor('rgb(100% 0% 0% / 50%)')).toEqual([0.5, 0, 0]);
    expect(parseColor('rgba(0, 0, 255, 0.25)')).toEqual([0, 0, 0.25]);
  });

  it('accepts normalized CSS sRGB color values', () => {
    expect(parseColor('color(srgb 1 0.5 0 / 0.5)')).toEqual([0.5, 0.25, 0]);
  });

  it('rejects unsupported or incomplete colors rather than guessing', () => {
    expect(parseColor('var(--color)')).toBeUndefined();
    expect(parseColor('rgb(255, 0)')).toBeUndefined();
    expect(parseColor('')).toBeUndefined();
  });
});
