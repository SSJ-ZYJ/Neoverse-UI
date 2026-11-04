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

test('the shared renderer owns the table bottom rim instead of the inset catch', async ({
  page,
}) => {
  await page.goto('/frame?theme=light&lang=en#data-display', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
  const table = page.locator('[data-data-display-table]');
  await expect(table).toBeVisible();

  const read = () =>
    table.evaluate((element) => {
      const table = element as HTMLTableElement;
      const lastRow = table.rows[table.rows.length - 1];
      const cell = lastRow?.cells[1] as HTMLElement | undefined;
      return {
        tableShadow: getComputedStyle(table).boxShadow,
        cellShadow: cell === undefined ? '' : getComputedStyle(cell).boxShadow,
      };
    });

  await expect
    .poll(async () => (await read()).tableShadow, { message: 'the canvas gives the perimeter' })
    .not.toContain('inset');
  await expect
    .poll(async () => (await read()).cellShadow, {
      message: 'the final row must not repeat a local bottom catch',
    })
    .not.toContain('0px -1px 2px');

  await table.evaluate((element) => element.setAttribute('data-neoverse-glass-edge-pass', 'css'));
  await expect.poll(async () => (await read()).tableShadow).toContain('inset');
  await expect
    .poll(async () => (await read()).cellShadow, {
      message: 'the CSS edge pass keeps its local bottom catch',
    })
    .toContain('0px -1px 2px');

  // The canvas cannot paint inside a native top layer, so a table inside a
  // popover keeps the local catch.
  const topLayerShadow = await table.evaluate((element) => {
    const host = document.createElement('div');
    host.popover = 'manual';
    document.body.append(host);
    const clone = element.cloneNode(true) as HTMLTableElement;
    clone.removeAttribute('data-neoverse-glass-edge-pass');
    host.append(clone);
    host.showPopover();
    const lastRow = clone.rows[clone.rows.length - 1];
    const shadow = getComputedStyle(lastRow?.cells[1] as HTMLElement).boxShadow;
    host.hidePopover();
    host.remove();
    return shadow;
  });
  expect(topLayerShadow, 'a top-layer table keeps its local bottom catch').toContain(
    '0px -1px 2px',
  );
});
