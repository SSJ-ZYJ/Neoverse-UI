import { expect, test } from '@playwright/test';
import {
  attachOpticalFailure,
  installOpticsProbe,
  measureOptics,
  opticsBackdrops,
  opticsThemes,
  opticsTiers,
} from '../support/glass-optics';

test.describe('Aurora Glass optical diagnostics', () => {
  for (const theme of opticsThemes) {
    for (const tier of opticsTiers) {
      for (const backdrop of opticsBackdrops) {
        // Each tier/theme combination gets one short PR gate; the remaining
        // backdrops belong to an explicit full optical acceptance run.
        const scope = backdrop === 'neutral' ? '@optics-smoke' : '@optics-full';
        test(`${theme} ${tier} on ${backdrop} preserves a sampled edge ${scope}`, async ({
          page,
        }, testInfo) => {
          const graphics = await installOpticsProbe(page, theme, tier, backdrop);
          const captures = await measureOptics(page, testInfo, theme, tier, backdrop, graphics);

          try {
            // Conservative structural guards from a Linux SwiftShader baseline.
            // They cannot establish visual quality or historical color matching.
            for (const side of Object.values(captures.metrics.sides)) {
              expect(side.p10).toBeGreaterThanOrEqual(2);
              expect(side.maximumGap).toBeLessThanOrEqual(6);
              expect(side.widthP90).toBeLessThanOrEqual(6);
            }
            expect(captures.metrics.interior.p95).toBeLessThanOrEqual(3);
            for (const corner of Object.values(captures.metrics.corners)) {
              expect(corner).toBeGreaterThan(0);
            }
            const { upperLeft, upperRight, lowerLeft, lowerRight } = captures.metrics.corners;
            expect(upperLeft + lowerRight).toBeGreaterThan(upperRight + lowerLeft);
          } catch (error) {
            await attachOpticalFailure(testInfo, captures);
            throw error;
          }
        });
      }
    }
  }

  for (const theme of opticsThemes) {
    test(`${theme} edges change color with the backdrop @optics-full`, async ({
      page,
    }, testInfo) => {
      const signatures: Array<[number, number, number]> = [];
      for (const backdrop of ['cool', 'warm'] as const) {
        const graphics = await installOpticsProbe(page, theme, 'elevated', backdrop);
        const captures = await measureOptics(page, testInfo, theme, 'elevated', backdrop, graphics);
        signatures.push(captures.metrics.sides.right.color);
      }
      const [cool, warm] = signatures;
      if (!cool || !warm) throw new Error('Both diagnostic backdrops are required');
      expect(
        Math.max(...cool.map((channel, index) => Math.abs(channel - (warm[index] ?? 0)))),
      ).toBeGreaterThanOrEqual(1);
    });
  }
});
