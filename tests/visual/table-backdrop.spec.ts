import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`long contract table shares one continuous backdrop / ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/?theme=${theme}&lang=en#consumer-parity`, {
      waitUntil: 'domcontentloaded',
    });
    const table = page.locator('[data-contract-matrix] .ui-table');
    await expect(table).toBeVisible();
    const optics = await table.evaluate((element) => ({
      filter: getComputedStyle(element).backdropFilter,
      cells: [...element.querySelectorAll('th, td')].map(
        (cell) => getComputedStyle(cell).backdropFilter,
      ),
    }));
    expect(optics.cells.length).toBeGreaterThan(200);
    expect(optics.cells.filter((filter) => filter !== 'none')).toHaveLength(0);
    expect(optics.filter).toContain('blur(12px)');

    await page.locator('.playground-shell__workspace').evaluate(async (element) => {
      for (const fraction of [0.25, 0.5, 1, 0]) {
        element.scrollTop = (element.scrollHeight - element.clientHeight) * fraction;
        await new Promise(requestAnimationFrame);
      }
    });
    await expect(table).toHaveCSS('backdrop-filter', optics.filter);
    await expect(table.locator('td').first()).toHaveCSS('backdrop-filter', 'none');
    await page.screenshot({ path: testInfo.outputPath('contract-table.png') });
  });
}

test('table frost stays continuous at cell seams and while clipped by the viewport', async ({
  page,
}) => {
  await page.goto('/frame?theme=dark&lang=en#consumer-parity', {
    waitUntil: 'domcontentloaded',
  });
  await page.locator('[data-contract-matrix] .ui-table').evaluate((element) => {
    document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
    const stage = document.createElement('div');
    stage.style.cssText =
      'position:absolute;inset:0;height:2200px;background:repeating-linear-gradient(90deg,#fff 0 8px,#000 8px 16px)';
    element.querySelector('caption')?.remove();
    element.innerHTML = `<tbody>${'<tr><td></td><td></td></tr>'.repeat(12)}</tbody>`;
    const table = element as HTMLElement;
    table.style.cssText =
      'position:absolute;left:32px;top:80px;width:320px;table-layout:fixed;box-shadow:none;border-radius:28px';
    for (const cell of element.querySelectorAll<HTMLElement>('td')) {
      cell.style.cssText = 'height:48px;padding:0;background:transparent;box-shadow:none;border:0';
    }
    stage.append(element);
    document.body.append(stage);
    window.scrollTo(0, 0);
  });
  const sample = async () => {
    const screenshot = await page.screenshot();
    return page.evaluate(async (data) => {
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
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const value = (x: number, y: number) =>
        pixels.data[
          (Math.round(y * devicePixelRatio) * pixels.width + Math.round(x * devicePixelRatio)) * 4
        ] ?? 0;
      const range = (y: number) => {
        const row = Array.from({ length: 240 }, (_, x) => value(x + 72, y));
        return Math.max(...row) - Math.min(...row);
      };
      return { outside: range(50), body: range(104), seam: range(128) };
    }, screenshot.toString('base64'));
  };
  const before = await sample();
  expect(before.outside).toBeGreaterThan(200);
  expect(before.body, 'the shared backdrop must actually blur pixels').toBeLessThan(8);
  expect(before.seam, 'cell boundaries must not cut the blur into separate tiles').toBeLessThan(8);
  await page.evaluate(() => window.scrollTo(0, 160));
  const after = await sample();
  expect(after.body, 'partially clipped tables must keep their central frost').toBeLessThan(8);
  expect(after.seam).toBeLessThan(8);
});
