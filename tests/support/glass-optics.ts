import { writeFile } from 'node:fs/promises';
import type { Page, TestInfo } from '@playwright/test';
import { expect } from '@playwright/test';

export type OpticsTheme = 'light' | 'dark';
export type OpticsTier = 'subtle' | 'elevated' | 'immersive';
export type OpticsBackdrop = 'neutral' | 'pale' | 'cool' | 'warm';

export const opticsThemes: readonly OpticsTheme[] = ['light', 'dark'];
export const opticsTiers: readonly OpticsTier[] = ['subtle', 'elevated', 'immersive'];
export const opticsBackdrops: readonly OpticsBackdrop[] = ['neutral', 'pale', 'cool', 'warm'];

const backgrounds: Record<OpticsBackdrop, string> = {
  neutral: 'rgb(118 122 131)',
  pale: 'rgb(218 229 235)',
  cool: 'linear-gradient(125deg, rgb(38 95 160), rgb(122 194 207))',
  warm: 'linear-gradient(125deg, rgb(171 86 53), rgb(235 177 115))',
};

const probe = { left: 224, top: 208, width: 320, height: 180, radius: 24 };
const padding = 12;
const clip = {
  x: probe.left - padding,
  y: probe.top - padding,
  width: probe.width + 2 * padding,
  height: probe.height + 2 * padding,
};

export type EdgeMetrics = {
  p10: number;
  median: number;
  maximumGap: number;
  mean: number;
  peak: number;
  widthP90: number;
  color: [number, number, number];
};

export type OpticsMetrics = {
  theme: OpticsTheme;
  tier: OpticsTier;
  backdrop: OpticsBackdrop;
  renderer: string;
  vendor: string;
  bodyFilter: string;
  sides: Record<'top' | 'right' | 'bottom' | 'left', EdgeMetrics>;
  corners: Record<'upperLeft' | 'upperRight' | 'lowerLeft' | 'lowerRight', number>;
  interior: { mean: number; p95: number };
};

export async function installOpticsProbe(
  page: Page,
  theme: OpticsTheme,
  tier: OpticsTier,
  backdrop: OpticsBackdrop,
): Promise<{ renderer: string; vendor: string; bodyFilter: string }> {
  await page.goto(`/frame?theme=${theme}&lang=en#materials`, {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
  await page.evaluate(
    ({ surfaceTier, background, position }) => {
      const app = document.querySelector<HTMLElement>('#app');
      if (app) app.style.display = 'none';
      for (const previous of document.querySelectorAll(
        '[data-neoverse-optics-probe], [data-neoverse-optics-backdrop]',
      )) {
        previous.remove();
      }

      const backdropElement = document.createElement('div');
      backdropElement.dataset.neoverseOpticsBackdrop = '';
      Object.assign(backdropElement.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '1',
        background,
        pointerEvents: 'none',
      });
      const surface = document.createElement('div');
      surface.dataset.neoverseOpticsProbe = '';
      surface.className = `material-glass-${surfaceTier}`;
      Object.assign(surface.style, {
        position: 'fixed',
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
        borderRadius: `${position.radius}px`,
        zIndex: '2',
        pointerEvents: 'none',
      });
      document.body.append(backdropElement, surface);
    },
    { surfaceTier: tier, background: backgrounds[backdrop], position: probe },
  );

  const surface = page.locator('[data-neoverse-optics-probe]');
  await expect(surface).toBeVisible();
  await expect
    .poll(() =>
      page.locator('[data-neoverse-glass-renderer-canvas]').evaluate((canvas) => {
        const element = canvas as HTMLCanvasElement;
        return element.width > 0 && element.height > 0;
      }),
    )
    .toBe(true);

  const graphics = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (gl === null) throw new Error('Cannot inspect a real WebGL context');
    const probeElement = document.querySelector<HTMLElement>('[data-neoverse-optics-probe]');
    if (probeElement === null) throw new Error('The optical probe is missing');
    const extension = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = extension
      ? String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
    const vendor = extension
      ? String(gl.getParameter(extension.UNMASKED_VENDOR_WEBGL))
      : String(gl.getParameter(gl.VENDOR));
    return {
      renderer,
      vendor,
      bodyFilter: getComputedStyle(probeElement).backdropFilter,
    };
  });

  if (!/swiftshader/i.test(graphics.renderer)) {
    throw new Error(
      `Optics requires SwiftShader, received renderer=${graphics.renderer}, vendor=${graphics.vendor}`,
    );
  }
  const expectedBlur = { subtle: 12, elevated: 18, immersive: 24 }[tier];
  expect(graphics.bodyFilter).toContain(`blur(${expectedBlur}px)`);

  // Flush the mutation-triggered edge render; no arbitrary millisecond sleeps.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
  return graphics;
}

export async function measureOptics(
  page: Page,
  testInfo: TestInfo,
  theme: OpticsTheme,
  tier: OpticsTier,
  backdrop: OpticsBackdrop,
  graphics: { renderer: string; vendor: string; bodyFilter: string },
): Promise<{ metrics: OpticsMetrics; lit: Buffer; unlit: Buffer }> {
  const lit = await page.screenshot({ clip, animations: 'disabled', caret: 'hide' });
  const canvasSelector =
    '[data-neoverse-glass-renderer-canvas], [data-neoverse-glass-chroma-canvas]';
  await page.locator(canvasSelector).evaluateAll((canvases) => {
    for (const canvas of canvases) {
      (canvas as HTMLElement).style.visibility = 'hidden';
    }
  });
  const unlit = await page.screenshot({ clip, animations: 'disabled', caret: 'hide' });
  await page.locator(canvasSelector).evaluateAll((canvases) => {
    for (const canvas of canvases) {
      (canvas as HTMLElement).style.removeProperty('visibility');
    }
  });

  const results = await page.evaluate(
    async ({ first, second, inset, position, screenshotWidth, screenshotHeight }) => {
      async function readPixels(base64: string): Promise<Uint8ClampedArray> {
        const imageBytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
        const image = await createImageBitmap(new Blob([imageBytes]));
        if (image.width !== screenshotWidth || image.height !== screenshotHeight) {
          throw new Error('The optical capture must have DPR 1 and fixed dimensions');
        }
        const canvas = new OffscreenCanvas(image.width, image.height);
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (context === null) throw new Error('Cannot decode optical capture');
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, image.width, image.height).data;
        image.close();
        return pixels;
      }

      const [litPixels, unlitPixels] = await Promise.all([readPixels(first), readPixels(second)]);
      const strength = new Uint8Array(screenshotWidth * screenshotHeight);
      const signed = new Int16Array(screenshotWidth * screenshotHeight * 3);
      for (let index = 0; index < strength.length; index += 1) {
        const offset = index * 4;
        const signedOffset = index * 3;
        let maximum = 0;
        for (let channel = 0; channel < 3; channel += 1) {
          const difference =
            (litPixels[offset + channel] ?? 0) - (unlitPixels[offset + channel] ?? 0);
          signed[signedOffset + channel] = difference;
          maximum = Math.max(maximum, Math.abs(difference));
        }
        strength[index] = maximum;
      }
      const delta = (x: number, y: number) => strength[y * screenshotWidth + x] ?? 0;
      const percentile = (values: number[], proportion: number) => {
        const sorted = [...values].sort((a, b) => a - b);
        return sorted[Math.floor((sorted.length - 1) * proportion)] ?? 0;
      };
      const average = (values: number[]) =>
        values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
      const sides = {} as Record<
        'top' | 'bottom' | 'left' | 'right',
        {
          p10: number;
          median: number;
          maximumGap: number;
          mean: number;
          peak: number;
          widthP90: number;
          color: [number, number, number];
        }
      >;
      for (const side of ['top', 'right', 'bottom', 'left'] as const) {
        const horizontal = side === 'top' || side === 'bottom';
        const total = horizontal ? position.width : position.height;
        const minimum = Math.floor(total * 0.2);
        const maximum = Math.ceil(total * 0.8);
        const values: number[] = [];
        const widths: number[] = [];
        const channels = [0, 0, 0];
        let channelSamples = 0;
        let maximumGap = 0;
        let gap = 0;
        for (let along = minimum; along < maximum; along += 1) {
          let peak = 0;
          let width = 0;
          let peakX = 0;
          let peakY = 0;
          for (let normal = -6; normal <= 7; normal += 1) {
            const x = horizontal
              ? inset + along
              : inset + (side === 'left' ? normal : position.width + normal);
            const y = horizontal
              ? inset + (side === 'top' ? normal : position.height + normal)
              : inset + along;
            const strengthAtPoint = delta(x, y);
            if (strengthAtPoint >= 2) width += 1;
            if (strengthAtPoint > peak) {
              peak = strengthAtPoint;
              peakX = x;
              peakY = y;
            }
          }
          values.push(peak);
          widths.push(width);
          if (peak < 2) {
            gap += 1;
            maximumGap = Math.max(maximumGap, gap);
          } else {
            gap = 0;
            const signedOffset = (peakY * screenshotWidth + peakX) * 3;
            for (let channel = 0; channel < 3; channel += 1) {
              channels[channel] = (channels[channel] ?? 0) + (signed[signedOffset + channel] ?? 0);
            }
            channelSamples += 1;
          }
        }
        sides[side] = {
          p10: percentile(values, 0.1),
          median: percentile(values, 0.5),
          maximumGap,
          mean: average(values),
          peak: Math.max(...values),
          widthP90: percentile(widths, 0.9),
          color: channels.map(
            (value) => Math.round((value / Math.max(channelSamples, 1)) * 10) / 10,
          ) as [number, number, number],
        };
      }

      const cornerSignal = (xOrigin: number, yOrigin: number) => {
        const values: number[] = [];
        for (let y = 0; y < position.radius + 8; y += 1) {
          for (let x = 0; x < position.radius + 8; x += 1) {
            values.push(delta(xOrigin + x, yOrigin + y));
          }
        }
        return average(values);
      };
      const corners = {
        upperLeft: cornerSignal(inset - 4, inset - 4),
        upperRight: cornerSignal(inset + position.width - position.radius - 4, inset - 4),
        lowerLeft: cornerSignal(inset - 4, inset + position.height - position.radius - 4),
        lowerRight: cornerSignal(
          inset + position.width - position.radius - 4,
          inset + position.height - position.radius - 4,
        ),
      };
      const interiorValues: number[] = [];
      for (let y = inset + 36; y < inset + position.height - 36; y += 4) {
        for (let x = inset + 36; x < inset + position.width - 36; x += 4) {
          interiorValues.push(delta(x, y));
        }
      }
      return {
        sides,
        corners,
        interior: { mean: average(interiorValues), p95: percentile(interiorValues, 0.95) },
      };
    },
    {
      first: lit.toString('base64'),
      second: unlit.toString('base64'),
      inset: padding,
      position: probe,
      screenshotWidth: clip.width,
      screenshotHeight: clip.height,
    },
  );

  const metrics: OpticsMetrics = { theme, tier, backdrop, ...graphics, ...results };
  await writeFile(
    testInfo.outputPath(`optics-metrics-${backdrop}.json`),
    JSON.stringify(metrics, null, 2),
  );
  return { metrics, lit, unlit };
}

export async function attachOpticalFailure(
  testInfo: TestInfo,
  captures: { lit: Buffer; unlit: Buffer },
): Promise<void> {
  await testInfo.attach('optics-lit', { body: captures.lit, contentType: 'image/png' });
  await testInfo.attach('optics-unlit', { body: captures.unlit, contentType: 'image/png' });
}
