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
        const paleStandard = theme === 'light' && tier === 'elevated' && backdrop === 'pale';
        const scope = backdrop === 'neutral' || paleStandard ? '@optics-smoke' : '@optics-full';
        test(`${theme} ${tier} on ${backdrop} preserves a fine edge ${scope}`, async ({
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
            if (paleStandard) {
              // The straight top edge must stay visible without washing out the pale backdrop.
              expect(captures.metrics.sides.top.median).toBeLessThanOrEqual(12);
            }
            expect(captures.metrics.interior.p95).toBeLessThanOrEqual(3);
            for (const corner of Object.values(captures.metrics.corners)) {
              expect(corner).toBeGreaterThan(0);
            }
            const { upperLeft, upperRight, lowerLeft, lowerRight } = captures.metrics.corners;
            expect(upperLeft + lowerRight).toBeGreaterThan(upperRight + lowerLeft);
            if (theme === 'dark' && backdrop === 'neutral') {
              // A bright lower-right catch must not hide a dim upper-left catch.
              const quietCorner = Math.max(upperRight, lowerLeft);
              expect(upperLeft, 'upper-left catch').toBeGreaterThanOrEqual(1.04 * quietCorner);
              expect(lowerRight, 'lower-right catch').toBeGreaterThanOrEqual(1.44 * quietCorner);
            }
            if (theme === 'light' && backdrop === 'pale') {
              // Both catches need enough volume to stand apart from the quiet corners.
              expect(Math.min(upperLeft, lowerRight)).toBeGreaterThan(
                2.25 * Math.max(upperRight, lowerLeft),
              );
              expect(captures.metrics.blueRetention.lowerRight).toBeGreaterThanOrEqual(0.85);
            }
          } catch (error) {
            await attachOpticalFailure(testInfo, captures);
            throw error;
          }
        });
      }
    }
  }

  test('the light lower-right rim keeps its color over near-white blue @optics-smoke', async ({
    page,
  }, testInfo) => {
    const graphics = await installOpticsProbe(page, 'light', 'elevated', 'pale-blue');
    const captures = await measureOptics(
      page,
      testInfo,
      'light',
      'elevated',
      'pale-blue',
      graphics,
    );
    try {
      expect(captures.metrics.corners.lowerRight).toBeGreaterThan(
        captures.metrics.corners.lowerLeft,
      );
      expect(captures.metrics.blueRetention.lowerRight).toBeGreaterThanOrEqual(0.65);
    } catch (error) {
      await attachOpticalFailure(testInfo, captures);
      throw error;
    }
  });

  test('the light terminal rim keeps its upper-left tint on a pale backdrop @optics-smoke', async ({
    page,
  }, testInfo) => {
    const graphics = await installOpticsProbe(page, 'light', 'elevated', 'terminal-pale');
    const captures = await measureOptics(
      page,
      testInfo,
      'light',
      'elevated',
      'terminal-pale',
      graphics,
    );
    try {
      const { blueRetention, corners, sides } = captures.metrics;
      expect(blueRetention.upperLeft).toBeGreaterThanOrEqual(0.65);
      expect(corners.upperLeft).toBeGreaterThan(Math.max(corners.upperRight, corners.lowerLeft));
      for (const side of Object.values(sides)) {
        expect(side.p10).toBeGreaterThanOrEqual(2);
        expect(side.widthP90).toBeLessThanOrEqual(6);
      }
    } catch (error) {
      await attachOpticalFailure(testInfo, captures);
      throw error;
    }
  });

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
      if (theme === 'light') {
        // Lighting the backdrop should lift its dominant channel, not add a pale wash.
        expect(cool[2]).toBeGreaterThan(cool[0]);
        expect(warm[0]).toBeGreaterThan(warm[2]);
      }
    });
  }
});
