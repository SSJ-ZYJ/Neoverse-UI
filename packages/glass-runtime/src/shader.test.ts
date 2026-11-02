import { Script } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { glassFragmentShader } from './shader';

type Rgb = [number, number, number];
const luminanceWeights: Rgb = [0.2126, 0.7152, 0.0722];
const dot = (a: Rgb, b: Rgb): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vec3 = (r: number, g = r, b = r): Rgb => [r, g, b];

describe('long Glass edge colour neutralization', () => {
  for (const color of [vec3(0.24, 0.58, 0.9), vec3(0.2, 0.79, 0.6), vec3(0.7)]) {
    it(`preserves highlight luminance for ${color.join(', ')}`, () => {
      // Evaluate the scalar/vector constructor expression from the actual GLSL source.
      // 从实际 GLSL 源码中执行标量与向量构造表达式。
      const expression = /vec3 neutralHighlight\s*=\s*([^;]+);/.exec(glassFragmentShader)?.[1];
      if (!expression) throw new Error('The long-edge neutral highlight expression is missing.');
      const neutral: unknown = new Script(expression).runInNewContext({ color, dot, vec3 });
      if (
        !Array.isArray(neutral) ||
        neutral.length !== 3 ||
        neutral.some((v) => typeof v !== 'number')
      )
        throw new Error('The neutral highlight must have three numeric channels.');
      expect(neutral[0]).toBeCloseTo(neutral[1], 8);
      expect(neutral[1]).toBeCloseTo(neutral[2], 8);
      expect(dot(neutral as Rgb, luminanceWeights)).toBeCloseTo(dot(color, luminanceWeights), 8);
    });
  }
});
