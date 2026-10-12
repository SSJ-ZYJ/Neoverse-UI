import { expect, test } from '@playwright/test';

test('explicit dark and system dark retain identical glass refraction', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'Desktop theme switch exposes segmented controls.',
  );
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/?theme=system&lang=zh#controls', { waitUntil: 'domcontentloaded' });

  const themeSwitch = page.getByRole('radiogroup', { name: '实验室主题' });
  await expect(themeSwitch).toBeVisible();
  const readGlassEdges = () =>
    page.evaluate(() => {
      const segmented = document.querySelector<HTMLElement>(
        '.playground-shell__toolbar-actions .ui-segmented-control',
      );
      const button = document.querySelector<HTMLElement>('#controls-button .ui-button--primary');
      const edge = button?.querySelector<HTMLElement>('.ui-button__edge-field');
      if (!segmented || !button || !edge) throw new Error('Glass fixtures missing');
      const segmentedEdge = getComputedStyle(segmented, '::before');
      const buttonEdge = getComputedStyle(edge);
      return {
        resolvedScheme: getComputedStyle(segmented).colorScheme,
        segmentedDisplay: segmentedEdge.display,
        segmentedOpacity: Number.parseFloat(segmentedEdge.opacity),
        buttonDisplay: buttonEdge.display,
        buttonOpacity: Number.parseFloat(buttonEdge.opacity),
      };
    });

  const systemDark = await readGlassEdges();
  expect(systemDark.resolvedScheme).toBe('dark');
  expect(systemDark.segmentedDisplay).toBe('block');
  expect(systemDark.segmentedOpacity).toBeGreaterThan(0.1);
  expect(systemDark.buttonDisplay).not.toBe('none');
  expect(systemDark.buttonOpacity).toBeGreaterThan(0.08);

  await themeSwitch.getByRole('radio', { name: '深色' }).click();
  await expect(themeSwitch.getByRole('radio', { name: '深色' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect.poll(readGlassEdges).toEqual(systemDark);

  await themeSwitch.getByRole('radio', { name: '浅色' }).click();
  await expect.poll(async () => (await readGlassEdges()).resolvedScheme).toBe('light');
  await themeSwitch.getByRole('radio', { name: '跟随系统' }).click();
  await expect.poll(readGlassEdges).toEqual(systemDark);
});

test('switching from system light to explicit dark does not remove glass edges', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop toolbar exposes the theme switch.');
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/?theme=system&lang=zh#controls', { waitUntil: 'domcontentloaded' });

  const themeSwitch = page.getByRole('radiogroup', { name: '实验室主题' });
  await expect(themeSwitch).toBeVisible();
  const readEdgeOpacity = () =>
    page.evaluate(() => {
      const segmented = document.querySelector<HTMLElement>(
        '.playground-shell__toolbar-actions .ui-segmented-control',
      );
      const buttonEdge = document.querySelector<HTMLElement>(
        '#controls-button .ui-button--primary .ui-button__edge-field',
      );
      if (!segmented || !buttonEdge) throw new Error('Missing glass control');
      return {
        scheme: getComputedStyle(segmented).colorScheme,
        display: getComputedStyle(segmented, '::before').display,
        segment: Number.parseFloat(getComputedStyle(segmented, '::before').opacity),
        button: Number.parseFloat(getComputedStyle(buttonEdge).opacity),
      };
    });

  const systemLight = await readEdgeOpacity();
  expect(systemLight.scheme).toBe('light');
  expect(systemLight.display).toBe('block');
  expect(systemLight.segment).toBeGreaterThan(0);
  expect(systemLight.button).toBeGreaterThan(0);

  await themeSwitch.getByRole('radio', { name: '深色' }).click();
  await expect.poll(async () => (await readEdgeOpacity()).scheme).toBe('dark');
  const explicitDark = await readEdgeOpacity();
  expect(explicitDark.display).toBe('block');
  expect(explicitDark.segment).toBeGreaterThan(0);
  expect(explicitDark.button).toBeGreaterThan(0);

  await themeSwitch.getByRole('radio', { name: '跟随系统' }).click();
  await expect.poll(readEdgeOpacity).toEqual(systemLight);
});
