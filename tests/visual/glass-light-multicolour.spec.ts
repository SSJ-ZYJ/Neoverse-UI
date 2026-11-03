import { expect, test } from '@playwright/test';
import { measureColourRetention, measureDominantHighlight } from '../support/glass-colour-metrics';

const colours = [
  { name: 'orange', value: 'rgb(176 96 32)', rgb: [176, 96, 32] },
  { name: 'red', value: 'rgb(160 48 32)', rgb: [160, 48, 32] },
  { name: 'yellow', value: 'rgb(176 152 40)', rgb: [176, 152, 40] },
  { name: 'green', value: 'rgb(48 144 72)', rgb: [48, 144, 72] },
  { name: 'blue', value: 'rgb(48 96 176)', rgb: [48, 96, 176] },
  { name: 'violet', value: 'rgb(128 64 176)', rgb: [128, 64, 176] },
] as const;

for (const source of ['dom', 'canvas'] as const) {
  test(`records light Glass edge response over multiple ${source} colours with body blur`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'The comparison uses a fixed desktop layout.');
    test.fixme(
      true,
      'Known light-edge drift; see docs/material-standards.md#open-edge-contract-failures.',
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/frame?theme=light&lang=en#materials', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
    const probes = await page.evaluate(
      ({ source, colours }) => {
        document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
        const stage = document.createElement('div');
        stage.dataset.glassMulticolourStage = '';
        stage.style.cssText = 'position:fixed;inset:0;background:#eef1f4';
        const left = 24;
        const cellWidth = Math.floor(Math.min(innerWidth - left * 2, 1320) / colours.length);
        const rowHeight = 140;
        const tiers = ['subtle', 'elevated', 'immersive'] as const;
        const pending: Array<{
          element: HTMLElement;
          tier: string;
          shape: string;
          column: number;
        }> = [];
        const background = document.createElement('canvas');
        if (source === 'canvas') {
          background.dataset.glassMulticolourCanvas = '';
          background.width = innerWidth;
          background.height = innerHeight;
          background.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
          stage.append(background);
        }
        const context = source === 'canvas' ? background.getContext('2d') : null;
        if (source === 'canvas' && !context) throw new Error('Missing live canvas backdrop');
        for (const [tierIndex, tier] of tiers.entries()) {
          for (const [shapeIndex, shape] of ['wide', 'card'].entries()) {
            const top = (tierIndex * 2 + shapeIndex) * rowHeight;
            for (const [column, colour] of colours.entries()) {
              if (context) {
                context.fillStyle = colour.value;
                context.fillRect(left + column * cellWidth, top, cellWidth, rowHeight);
              } else {
                const tile = document.createElement('div');
                tile.dataset.glassColourColumn = String(column);
                tile.style.cssText = `position:absolute;left:${left + column * cellWidth}px;top:${top}px;width:${cellWidth}px;height:${rowHeight}px;background:${colour.value}`;
                stage.append(tile);
              }
            }
            const count = shape === 'wide' ? 1 : colours.length;
            for (let index = 0; index < count; index++) {
              const surface = document.createElement('div');
              surface.className = `ui-surface material-glass-${tier}`;
              surface.style.cssText = `position:absolute;left:${left + (shape === 'wide' ? 0 : index * cellWidth + 6)}px;top:${top + 12}px;width:${shape === 'wide' ? colours.length * cellWidth : cellWidth - 12}px;height:112px;border-radius:14px`;
              stage.append(surface);
              for (let column = 0; column < colours.length; column++) {
                if (shape === 'card' && column !== index) continue;
                pending.push({
                  element: surface,
                  tier,
                  shape,
                  column,
                });
              }
            }
          }
        }
        document.body.append(stage);
        return pending.map(({ element, column, ...item }) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            ...item,
            column,
            x:
              item.shape === 'wide'
                ? left + column * cellWidth + cellWidth / 2
                : rect.left + rect.width / 2,
            bottom: rect.bottom,
            filter: style.backdropFilter || style.getPropertyValue('-webkit-backdrop-filter'),
          };
        });
      },
      { source, colours },
    );
    for (const probe of probes) {
      const blur = probe.tier === 'subtle' ? 12 : probe.tier === 'elevated' ? 18 : 24;
      expect(probe.filter, `${probe.tier} retains its body blur`).toContain(`blur(${blur}px)`);
    }
    const settle = () =>
      page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
    const measurementsByPass = [];
    for (const shift of [0, 3]) {
      if (shift) {
        await page.evaluate(
          ({ source, colours, shift }) => {
            const stage = document.querySelector<HTMLElement>('[data-glass-multicolour-stage]');
            if (!stage) throw new Error('Missing multicolour backdrop');
            const left = 24;
            const cellWidth = Math.floor(Math.min(innerWidth - left * 2, 1320) / colours.length);
            const background = stage.querySelector<HTMLCanvasElement>(
              '[data-glass-multicolour-canvas]',
            );
            if (source === 'canvas') {
              const context = background?.getContext('2d');
              if (!context) throw new Error('Missing live canvas backdrop');
              // Repaint without touching the DOM, as for a video or animation.
              for (let row = 0; row < 6; row++) {
                for (let column = 0; column < colours.length; column++) {
                  context.fillStyle = colours[(column + shift) % colours.length]?.value ?? '';
                  context.fillRect(left + column * cellWidth, row * 140, cellWidth, 140);
                }
              }
            } else {
              for (const tile of stage.querySelectorAll<HTMLElement>(
                '[data-glass-colour-column]',
              )) {
                const column = Number(tile.dataset.glassColourColumn);
                tile.style.background = colours[(column + shift) % colours.length]?.value ?? '';
              }
            }
          },
          { source, colours, shift },
        );
      }
      await settle();
      const lit = await page.screenshot();
      const edgeCanvas = page.locator('[data-neoverse-glass-renderer-canvas]');
      await edgeCanvas.evaluate((element) => {
        (element as HTMLElement).style.visibility = 'hidden';
      });
      const unlit = await page.screenshot();
      await edgeCanvas.evaluate((element) => {
        (element as HTMLElement).style.removeProperty('visibility');
      });
      const samples = await page.evaluate(
        async ({ lit, unlit, probes }) => {
          const decode = async (source: string) => {
            const image = await createImageBitmap(
              await (await fetch(`data:image/png;base64,${source}`)).blob(),
            );
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Cannot inspect Glass edge pixels');
            context.drawImage(image, 0, 0);
            image.close();
            return context.getImageData(0, 0, canvas.width, canvas.height);
          };
          const front = await decode(lit);
          const back = await decode(unlit);
          return probes.flatMap((probe) =>
            // Keep every row. Selecting the largest change in any channel would
            // prefer a blue cast even when the source is orange or red.
            Array.from({ length: 5 }, (_, row) => {
              const inset = 4 - row;
              const y = Math.round(probe.bottom) - inset;
              const base = [0, 0, 0];
              const edge = [0, 0, 0];
              for (let x = Math.round(probe.x) - 5; x <= Math.round(probe.x) + 5; x++) {
                const offset = (y * front.width + x) * 4;
                for (let channel = 0; channel < 3; channel++) {
                  base[channel] = (base[channel] ?? 0) + (back.data[offset + channel] ?? 0) / 11;
                  edge[channel] = (edge[channel] ?? 0) + (front.data[offset + channel] ?? 0) / 11;
                }
              }
              return { ...probe, inset, base, edge };
            }),
          );
        },
        { lit: lit.toString('base64'), unlit: unlit.toString('base64'), probes },
      );
      measurementsByPass.push({
        shift,
        measurements: samples.map(({ base, edge, ...sample }) => {
          const colour = colours[(sample.column + shift) % colours.length];
          if (!colour) throw new Error('Missing source colour');
          return {
            ...sample,
            colour: colour.name,
            ...measureDominantHighlight(
              [base[0] ?? 0, base[1] ?? 0, base[2] ?? 0],
              [edge[0] ?? 0, edge[1] ?? 0, edge[2] ?? 0],
              colour.rgb,
            ),
          };
        }),
      });
    }
    const [initial, changed] = measurementsByPass;
    if (!initial || !changed) throw new Error('Missing live backdrop passes');
    await testInfo.attach('light-multicolour-response', {
      body: JSON.stringify({ source, passes: measurementsByPass }),
      contentType: 'application/json',
    });
    for (const [index, before] of initial.measurements.entries()) {
      if (before.inset !== 0) continue;
      const after = changed.measurements[index];
      if (!after) throw new Error('Missing changed backdrop sample');
      expect(
        Math.max(...before.base.map((channel, i) => Math.abs(channel - (after.base[i] ?? 0)))),
        `${before.tier}/${before.shape}/${before.column}: the live backdrop must change`,
      ).toBeGreaterThan(5);
    }
    for (const [index, warm] of initial.measurements.entries()) {
      // Compare the same surface pixel before and after a live hue change.
      // Its geometry and directional edge strength stay fixed across the pair.
      if (warm.inset !== 1 || warm.column >= 3) continue;
      const cool = changed.measurements[index];
      if (!cool || warm.normalizedLift === null || cool.normalizedLift === null) {
        throw new Error('Missing unclipped source-colour response');
      }
      expect
        .soft(
          cool.normalizedLift,
          `${cool.tier}/${cool.shape}/${cool.colour}: the source colour catches light`,
        )
        .toBeGreaterThan(0.4);
      expect
        .soft(
          warm.normalizedLift,
          `${warm.tier}/${warm.shape}/${warm.colour}: warm highlights follow the source as visibly as cool colours`,
        )
        .toBeGreaterThanOrEqual(Math.max(0.4, cool.normalizedLift * 0.5));
    }
    for (const pass of measurementsByPass) {
      for (const sample of pass.measurements) {
        if (sample.inset !== 1) continue;
        const colour = measureColourRetention(sample.base, sample.edge);
        if (colour.hueDifference === null || colour.saturationRetention === null) continue;
        expect
          .soft(
            colour.hueDifference,
            `${sample.tier}/${sample.shape}/${sample.colour}: preserve hue`,
          )
          .toBeLessThanOrEqual(8);
        expect
          .soft(
            colour.saturationRetention,
            `${sample.tier}/${sample.shape}/${sample.colour}: preserve colour saturation`,
          )
          .toBeGreaterThanOrEqual(0.8);
      }
    }
  });
}
