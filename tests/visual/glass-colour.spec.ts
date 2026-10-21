import { expect, test } from '@playwright/test';

for (const gpu of [true, false]) {
  test(`Glass retains a purple body across shared tiers / ${gpu ? 'native' : 'CSS fallback'}`, async ({
    page,
  }) => {
    if (!gpu) {
      await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (
          this: HTMLCanvasElement,
          type: string,
          options?: unknown,
        ) {
          if (type === 'webgl' || type === 'webgl2') return null;
          return Reflect.apply(original, this, [type, options]);
        } as typeof original;
      });
    }
    await page.goto(`/frame?glass=${gpu ? 'native' : 'webgl'}&theme=light&lang=en#materials`);
    await page.evaluate(() => {
      const surface = document.querySelector('[data-glass-variant="subtle"]');
      const button = document.querySelector('[data-refraction-control="left"]');
      if (surface === null || button === null) throw new Error('Glass specimens are missing');
      const stage = document.createElement('div');
      stage.style.cssText =
        'position:fixed;left:24px;top:24px;width:320px;height:736px;background:#b6a1e0';
      for (const [index, tier] of ['subtle', 'elevated', 'immersive'].entries()) {
        for (const [type, source] of [
          ['surface', surface],
          ['button', button],
        ] as const) {
          const sample = source.cloneNode(true) as HTMLElement;
          sample.classList.remove('material-glass-subtle');
          sample.classList.add(`material-glass-${tier}`);
          sample.dataset.hueSample = `${type}/${tier}`;
          if (type === 'surface') sample.replaceChildren();
          else sample.querySelector('.ui-button__content')?.replaceChildren();
          sample.style.cssText = `position:absolute;left:20px;top:${
            type === 'surface' ? 20 + index * 144 : 468 + index * 64
          }px;width:280px;height:${type === 'surface' ? 120 : 40}px;min-height:0`;
          stage.append(sample);
        }
      }
      document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
      document.body.append(stage);
    });
    await page.waitForTimeout(400);
    const samples = await page.locator('[data-hue-sample]').evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          name: (element as HTMLElement).dataset.hueSample,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        };
      }),
    );
    const screenshot = await page.screenshot();
    await page.addStyleTag({
      content: `
      [data-neoverse-glass-renderer-canvas], [data-hue-sample]::before,
      [data-hue-sample] > .ui-button__edge-field { visibility: hidden !important }
    `,
    });
    const unlit = await page.screenshot();
    await page.addStyleTag({ content: '[data-hue-sample] { visibility:hidden !important }' });
    const backdrop = await page.screenshot();
    const colours = await page.evaluate(
      async ({ source, unlit, backdrop, samples }) => {
        const read = async (source: string) => {
          const image = await createImageBitmap(
            await (await fetch(`data:image/png;base64,${source}`)).blob(),
          );
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d');
          if (context === null) throw new Error('Cannot inspect bevel colours');
          context.drawImage(image, 0, 0);
          image.close();
          return context.getImageData(0, 0, canvas.width, canvas.height);
        };
        const pixels = await read(source);
        const baseline = await read(unlit);
        const exposed = await read(backdrop);
        return samples.map((sample) => {
          const chroma = (row: number, image = pixels) => {
            let total = 0;
            for (let x = 60; x < 220; x++) {
              const offset = (Math.round(sample.y + row) * pixels.width + sample.x + x) * 4;
              total += (image.data[offset + 2] ?? 0) - (image.data[offset] ?? 0);
            }
            return total / 160;
          };
          const centre = chroma(sample.height / 2);
          return {
            name: sample.name,
            centre,
            // A bright catch must remain recognisably purple, including the
            // first pixel. A white overlay fails here even with a coloured shoulder.
            // The clear bevel samples the actual backdrop. The frosted body
            // boosts saturation by up to 165%, so it is not a hue reference
            // for an unfiltered refracted pixel.
            specularRetention: Math.min(...[0, 1].map((y) => chroma(y) / chroma(y, exposed))),
            retention: Math.min(...[2, 3, 4].map((y) => chroma(y) / chroma(y, baseline))),
          };
        });
      },
      {
        source: screenshot.toString('base64'),
        unlit: unlit.toString('base64'),
        backdrop: backdrop.toString('base64'),
        samples,
      },
    );
    for (const colour of colours) {
      expect(colour.centre, `${colour.name}: the stage must remain visibly purple`).toBeGreaterThan(
        20,
      );
      // Native displacement retains the actual source colour. The released
      // directional fallback deliberately adds chromatic light at its edge;
      // glass-v020-edge.spec.ts guards that appearance against the release.
      if (gpu) {
        expect(colour.retention, `${colour.name}: native bevel colour`).toBeGreaterThan(0.85);
        expect(
          colour.specularRetention,
          `${colour.name}: native outer catch colour`,
        ).toBeGreaterThan(0.95);
      }
    }
  });
}

test('shared card and button interiors retain local backdrop colours without a sampled band', async ({
  page,
}) => {
  await page.goto('/frame?glass=webgl&theme=light&lang=en#materials');
  await page.evaluate(() => {
    const card = document.querySelector('[data-glass-variant="subtle"]');
    const button = document.querySelector('[data-refraction-control="left"]');
    if (card === null || button === null) throw new Error('Glass specimens are missing');
    const stage = document.createElement('div');
    stage.style.cssText = `position:fixed;left:24px;top:24px;width:320px;height:680px;
      background:linear-gradient(to right,rgb(144 24 24) 0 33.333%,
      rgb(24 144 24) 33.333% 66.667%,rgb(24 24 144) 66.667% 100%)`;
    for (const [index, tier] of ['subtle', 'elevated', 'immersive'].entries()) {
      for (const [type, source] of [
        ['card', card],
        ['button', button],
      ] as const) {
        const sample = source.cloneNode(true) as HTMLElement;
        sample.classList.remove('material-glass-subtle');
        sample.classList.add(`material-glass-${tier}`);
        sample.dataset.channelSample = `${type}/${tier}`;
        if (type === 'card') sample.replaceChildren();
        else sample.querySelector('.ui-button__content')?.replaceChildren();
        sample.style.cssText = `position:absolute;left:20px;top:${
          index * 200 + (type === 'card' ? 20 : 120)
        }px;width:280px;height:${type === 'card' ? 80 : 40}px;min-height:0`;
        stage.append(sample);
      }
    }
    document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
    document.body.append(stage);
  });
  await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
  await page.waitForTimeout(200);
  const probes = await page.locator('[data-channel-sample]').evaluateAll((elements) =>
    elements.flatMap((element) => {
      const rect = element.getBoundingClientRect();
      return [56, 140, 224].map((x, channel) => ({
        name: `${(element as HTMLElement).dataset.channelSample}/${channel}`,
        x: Math.round(rect.x + x),
        // Inside the narrow 0.2.0 edge, the body alone owns backdrop sampling.
        y: Math.round(rect.y) + 4,
        channel,
      }));
    }),
  );
  const lit = await page.screenshot();
  await page.addStyleTag({
    content: `
    [data-neoverse-glass-renderer-canvas] { visibility:hidden !important }
  `,
  });
  const unlit = await page.screenshot();
  const gains = await page.evaluate(
    async ({ lit, unlit, probes }) => {
      const read = async (source: string) => {
        const bitmap = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${source}`)).blob(),
        );
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (context === null) throw new Error('Pixel context is missing');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
        return context.getImageData(0, 0, canvas.width, canvas.height);
      };
      const a = await read(lit);
      const b = await read(unlit);
      return probes.map((probe) => {
        const delta = [0, 0, 0];
        const colour = [0, 0, 0];
        for (let x = probe.x - 6; x <= probe.x + 6; x++) {
          for (let y = probe.y; y < probe.y + 2; y++) {
            for (let c = 0; c < 3; c++) {
              const offset = (y * a.width + x) * 4 + c;
              delta[c] = (delta[c] ?? 0) + ((a.data[offset] ?? 0) - (b.data[offset] ?? 0)) / 26;
              colour[c] = (colour[c] ?? 0) + (a.data[offset] ?? 0) / 26;
            }
          }
        }
        return {
          name: probe.name,
          change: Math.max(...delta.map(Math.abs)),
          dominant: colour[probe.channel] ?? 0,
          other: Math.max(...colour.filter((_, c) => c !== probe.channel)),
        };
      });
    },
    { lit: lit.toString('base64'), unlit: unlit.toString('base64'), probes },
  );
  for (const gain of gains) {
    expect(
      gain.change,
      `${gain.name}: the renderer leaves the interior untouched`,
    ).toBeLessThanOrEqual(1);
    expect(
      gain.dominant,
      `${gain.name}: the frosted body retains its local backdrop colour`,
    ).toBeGreaterThan(gain.other * 1.1);
  }
});
