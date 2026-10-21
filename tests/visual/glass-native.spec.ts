import { expect, type Page, test } from '@playwright/test';

test.use({ deviceScaleFactor: 1.5 });

async function scene(page: Page, source: 'dom' | 'canvas' = 'dom') {
  await page.goto('/frame?glass=native&theme=light&lang=en#materials');
  await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'native');
  await page.evaluate((source) => {
    document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
    document.body.style.background = '#e0e0e0';
    const stage = document.createElement('div');
    stage.style.cssText = 'position:fixed;inset:0;background:#e0e0e0';
    const paint = document.createElement(source === 'canvas' ? 'canvas' : 'div');
    paint.dataset.nativeSource = '';
    paint.style.cssText = 'position:absolute;inset:0';
    if (paint instanceof HTMLCanvasElement) {
      paint.width = 800;
      paint.height = 900;
      const context = paint.getContext('2d');
      if (!context) throw new Error('Missing canvas source');
      for (let y = 0; y < 900; y += 12) {
        context.fillStyle = y % 24 === 0 ? '#4f56bf' : '#b766a6';
        context.fillRect(0, y, 800, 12);
      }
    } else {
      for (let y = 0; y < 900; y += 12) {
        const stripe = document.createElement('div');
        stripe.style.cssText = `position:absolute;left:0;top:${y}px;width:100%;height:12px;background:${y % 24 === 0 ? '#4f56bf' : '#b766a6'}`;
        stripe.textContent = 'REAL UNDERLYING DOM';
        stripe.style.color = '#1e1638';
        paint.append(stripe);
      }
    }
    const card = document.createElement('div');
    card.dataset.nativeCard = '';
    card.className = 'material-glass-elevated';
    card.style.cssText =
      'position:absolute;left:24px;top:84px;width:320px;height:260px;border-radius:28px;background:transparent;box-shadow:none;border:0;--neoverse-material-edge-refraction-opacity:0.5';
    stage.append(paint, card);
    document.body.append(stage);
  }, source);
  await expect(page.locator('[data-native-card]')).toHaveAttribute(
    'data-neoverse-glass-native-filter',
    /nv-backdrop-/,
  );
  await page.waitForTimeout(100);
}

async function compare(page: Page, bent: Buffer, frost: Buffer) {
  return page.evaluate(
    async ({ bent, frost }) => {
      const read = async (data: string) => {
        const bitmap = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${data}`)).blob(),
        );
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Missing pixel context');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
        return context.getImageData(0, 0, canvas.width, canvas.height);
      };
      const [a, b] = await Promise.all([read(bent), read(frost)]);
      if (!a || !b) throw new Error('Missing comparison');
      const ratio = devicePixelRatio;
      const difference = (x0: number, y0: number, width: number, height: number) => {
        let total = 0,
          count = 0;
        for (let y = Math.round(y0 * ratio); y < (y0 + height) * ratio; y++)
          for (let x = Math.round(x0 * ratio); x < (x0 + width) * ratio; x++) {
            const offset = (y * a.width + x) * 4;
            for (let c = 0; c < 3; c++) {
              total += Math.abs((a.data[offset + c] ?? 0) - (b.data[offset + c] ?? 0));
              count++;
            }
          }
        return total / count;
      };
      return { edge: difference(104, 85, 160, 5), body: difference(104, 144, 160, 120) };
    },
    { bent: bent.toString('base64'), frost: frost.toString('base64') },
  );
}

for (const source of ['dom', 'canvas'] as const) {
  test(`native refraction displaces live sibling ${source} pixels and preserves central frost`, async ({
    page,
  }) => {
    await scene(page, source);
    const card = page.locator('[data-native-card]');
    const bent = await page.screenshot();
    await card.evaluate((element) =>
      (element as HTMLElement).style.setProperty('--neoverse-material-refraction-strength', '0'),
    );
    await expect(card).not.toHaveAttribute('data-neoverse-glass-native-filter');
    const frost = await page.screenshot();
    const pixels = await compare(page, bent, frost);
    expect(pixels.edge, 'actual sibling pixels must move at the bevel').toBeGreaterThan(2);
    expect(pixels.body, 'flat central frost must stay unchanged').toBeLessThan(0.5);
    await expect(card).toHaveCSS('backdrop-filter', /blur\(18px\)/);
  });
}

test('zero refraction strength removes the SVG operation without removing native blur', async ({
  page,
}) => {
  await scene(page);
  const card = page.locator('[data-native-card]');
  await card.evaluate((element) =>
    (element as HTMLElement).style.setProperty('--neoverse-material-refraction-strength', '0'),
  );
  await expect(card).not.toHaveAttribute('data-neoverse-glass-native-filter');
  await expect(card).toHaveCSS('backdrop-filter', /blur\(18px\)/);
  expect(await card.evaluate((e) => getComputedStyle(e).backdropFilter)).not.toContain('url(');
});

test('live source changes and scrolling reuse local vector maps', async ({ page }) => {
  await scene(page);
  const vectors = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('[data-neoverse-glass-native-defs] filter')].map((e) => ({
        id: e.id,
        vector: e.querySelector('feImage')?.getAttribute('href'),
      })),
    );
  const before = await vectors();
  const card = page.locator('[data-native-card]');
  const first = await card.screenshot();
  await page.locator('[data-native-source]').evaluate((e) => {
    (e as HTMLElement).style.transform = 'translateY(30px)';
    document.body.style.minHeight = '3000px';
    window.scrollTo(0, 400);
  });
  await page.waitForTimeout(100);
  const second = await card.screenshot();
  expect(second.equals(first), 'real source movement must change the visible glass').toBe(false);
  expect(await vectors(), 'moving source pixels must not regenerate geometry vectors').toEqual(
    before,
  );
  await expect(page.locator('[data-neoverse-glass-renderer-canvas]')).toHaveCount(0);
});

for (const theme of ['light', 'dark']) {
  test(`native bevel preserves neutral and purple source colours / ${theme}`, async ({ page }) => {
    await scene(page);
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
      const source = document.querySelector<HTMLElement>('[data-native-source]');
      if (!source) throw new Error('Missing source');
      source.replaceChildren();
      source.style.background = '#939393';
    }, theme);
    const colour = async () => {
      const shot = await page.screenshot();
      return page.evaluate(async (data) => {
        const bitmap = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${data}`)).blob(),
        );
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Missing colour context');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
        return Array.from(
          context.getImageData(
            Math.round(160 * devicePixelRatio),
            Math.round(86 * devicePixelRatio),
            1,
            1,
          ).data,
        );
      }, shot.toString('base64'));
    };
    await page.waitForTimeout(100);
    const neutral = await colour();
    expect(
      Math.max(...neutral.slice(0, 3)) - Math.min(...neutral.slice(0, 3)),
      'neutral backdrop must not acquire an artificial spectrum',
    ).toBeLessThanOrEqual(1);
    await page
      .locator('[data-native-source]')
      .evaluate((e) => ((e as HTMLElement).style.background = '#9569bc'));
    await page.waitForTimeout(100);
    const purple = await colour();
    expect(
      (purple[2] ?? 0) - (purple[0] ?? 0),
      'purple source must remain purple at the edge',
    ).toBeGreaterThan(15);
    expect((purple[0] ?? 0) - (purple[1] ?? 0)).toBeGreaterThan(15);
  });
}
