import { expect, test } from '@playwright/test';

test('Dark checked switch visibly transmits changes in the backdrop', async ({ page }) => {
  await page.goto('/frame?theme=dark&lang=en#forms');
  const control = page.locator('#forms-choice-controls .ui-switch');
  await expect(control).toBeVisible();
  await control.evaluate((element) => {
    const stage = document.createElement('div');
    stage.dataset.choiceBackdropProbe = '';
    stage.style.cssText =
      'position:fixed;inset:24px auto auto 24px;width:240px;height:120px;display:grid;place-items:center;z-index:10000;background:rgb(128 36 68)';
    stage.append(element);
    document.body.append(stage);
  });
  const track = page.locator('[data-choice-backdrop-probe] .ui-switch__control');
  const sample = async () => {
    const shot = await track.screenshot({ animations: 'disabled' });
    return page.evaluate(async (data) => {
      const bitmap = await createImageBitmap(
        await (await fetch(`data:image/png;base64,${data}`)).blob(),
      );
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('No pixel context');
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      // Left interior: clear of the white thumb, round edge and top highlight.
      return [...context.getImageData(8, 12, 1, 1).data].slice(0, 3);
    }, shot.toString('base64'));
  };
  const warm = await sample();
  await page.locator('[data-choice-backdrop-probe]').evaluate((stage) => {
    (stage as HTMLElement).style.background = 'rgb(24 88 132)';
  });
  const cool = await sample();
  const change = warm.reduce((sum, value, index) => sum + Math.abs(value - (cool[index] ?? 0)), 0);
  expect(
    change,
    'Changing the backdrop must visibly change the selected track pixels',
  ).toBeGreaterThan(75);
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  });
  await expect(track).toHaveCSS('backdrop-filter', 'none');
  const opaqueCool = await sample();
  await page.locator('[data-choice-backdrop-probe]').evaluate((stage) => {
    (stage as HTMLElement).style.background = 'rgb(128 36 68)';
  });
  const opaqueWarm = await sample();
  const opaqueChange = opaqueWarm.reduce(
    (sum, value, index) => sum + Math.abs(value - (opaqueCool[index] ?? 0)),
    0,
  );
  expect(
    opaqueChange,
    'Reduced transparency must restore the opaque selection fallback',
  ).toBeLessThan(10);
});

for (const adapter of ['Vue', 'React']) {
  for (const theme of ['light', 'dark']) {
    test(`${adapter} choices keep selection fields appropriate to the theme / ${theme}`, async ({
      page,
    }, testInfo) => {
      await page.goto(
        adapter === 'Vue'
          ? `/frame?theme=${theme}&lang=zh#forms`
          : `/react-fixture?theme=${theme}&lang=en&contract-fixtures=1`,
      );
      const section =
        adapter === 'Vue'
          ? page.locator('#forms-choice-controls')
          : page.locator('[data-contract-form]');
      const checkboxMark = section
        .locator('.ui-checkbox input:checked + .ui-choice__control .ui-choice__indicator')
        .first();
      const radioMark = section
        .locator('.ui-radio input:checked + .ui-choice__control .ui-choice__indicator')
        .first();
      const switchInput = section.locator('.ui-switch input:not(:disabled)').first();
      const thumb = section
        .locator('.ui-switch input:checked + .ui-choice__control .ui-switch__thumb')
        .first();
      await expect(checkboxMark).toBeVisible();
      const foreground = await checkboxMark.evaluate((element) => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--neoverse-choice-control-active-foreground)';
        element.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      });
      await expect(checkboxMark).toHaveCSS('color', foreground);
      await expect(radioMark).toHaveCSS('background-color', foreground);
      await expect(radioMark).toHaveCSS('width', '8px');
      const thumbColor = 'rgb(255, 255, 255)';
      await expect(thumb).toHaveCSS('background-color', thumbColor);
      await expect(thumb).toHaveCSS('width', '18px');
      const selectedField = await checkboxMark
        .locator('..')
        .evaluate((element) => getComputedStyle(element).backgroundImage);
      expect(selectedField).toContain('linear-gradient');
      if (theme === 'light') {
        const stops = [...selectedField.matchAll(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/g)];
        expect(
          stops.length,
          'Light selection must resolve to pale color stops',
        ).toBeGreaterThanOrEqual(2);
        for (const stop of stops) {
          for (const channel of stop.slice(1, 4)) expect(Number(channel)).toBeGreaterThan(0.7);
        }
      }
      const switchControl = switchInput.locator('..').locator('.ui-switch__control');
      await expect(switchControl).toHaveCSS('background-image', selectedField);
      await expect(radioMark.locator('..')).toHaveCSS('background-image', selectedField);
      await switchInput.uncheck();
      await expect(switchControl).toHaveCSS('background-image', 'none');
      await switchInput.check();
      await expect(switchControl).toHaveCSS('background-image', selectedField);
      await expect(thumb).toHaveCSS('background-color', thumbColor);
      const radios = section.locator('.ui-radio input');
      await radios.nth(1).check();
      await expect(radioMark).toHaveCSS('background-color', foreground);
      if (adapter === 'Vue') {
        const disabled = page.locator('#forms-field-states .ui-switch input:disabled');
        await expect(disabled).toBeDisabled();
        await expect(disabled.locator('..').locator('.ui-switch__thumb')).not.toHaveCSS(
          'background-color',
          thumbColor,
        );
        await expect(disabled.locator('..').locator('.ui-switch__control')).toHaveCSS(
          'background-image',
          'none',
        );
        await section.screenshot({ path: testInfo.outputPath(`choices-${theme}.png`) });
      }
    });
  }
}
