import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`default card reuses the elevated glass material / ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto(`/?theme=${theme}&lang=zh#card`, { waitUntil: 'domcontentloaded' });
    const card = page.locator('[data-card-default]');
    await expect(card).toBeVisible();
    const materials = await card.evaluate(async (element) => {
      const reference = element.cloneNode(false) as HTMLElement;
      reference.removeAttribute('data-card-default');
      reference.classList.remove('ui-card');
      reference.setAttribute('data-neoverse-surface-hover', 'static');
      reference.setAttribute('data-neoverse-glass-edge-pass', 'css');
      element.setAttribute('data-neoverse-glass-edge-pass', 'css');
      element.parentElement?.append(reference);
      getComputedStyle(element).boxShadow;
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
      const readMaterial = (surface: Element) => {
        const style = getComputedStyle(surface);
        const edge = getComputedStyle(surface, '::before');
        return {
          background: style.backgroundColor,
          border: style.border,
          shadow: style.boxShadow,
          filter: style.backdropFilter,
          edgeOpacity: edge.opacity,
          edgeGradient: edge.backgroundImage,
          edgeFilter: edge.filter,
          edgeBackdrop: edge.backdropFilter,
          edgeMask: edge.maskImage,
          edgeMaskComposite: edge.maskComposite,
        };
      };
      const result = { card: readMaterial(element), shared: readMaterial(reference) };
      reference.remove();
      return result;
    });
    expect(materials.card).toEqual(materials.shared);
  });
}

for (const variant of ['subtle', 'elevated', 'immersive'] as const) {
  test(`system dark and explicit dark use identical card glass edges / ${variant}`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Desktop toolbar exposes the theme switch.');
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/?theme=system&lang=zh#card', { waitUntil: 'domcontentloaded' });
    const card = page.locator('[data-card-default]');
    await expect(card).toBeVisible();
    await card.evaluate(async (element, material) => {
      element.classList.remove('material-glass-elevated');
      element.classList.add(`material-glass-${material}`);
      // Settle the fixture's material transition before recording its baseline.
      getComputedStyle(element).backgroundColor;
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
    }, variant);
    const readEdge = () =>
      card.evaluate((element) => {
        const style = getComputedStyle(element);
        const edge = getComputedStyle(element, '::before');
        return {
          scheme: style.colorScheme,
          border: style.border,
          shadow: style.boxShadow,
          background: style.backgroundColor,
          filter: style.backdropFilter,
          edgeDisplay: edge.display,
          edgeOpacity: edge.opacity,
          edgeGradient: edge.backgroundImage,
          edgeFilter: edge.filter,
          carrier: style.getPropertyValue('--neoverse-material-edge-refraction-carrier').trim(),
        };
      });
    const themeSwitch = page.getByRole('radiogroup', { name: '实验室主题' });
    const systemDark = await readEdge();
    expect(systemDark.scheme).toBe('dark');
    await themeSwitch.getByRole('radio', { name: '深色', exact: true }).click();
    await expect.poll(readEdge).toEqual(systemDark);
    await themeSwitch.getByRole('radio', { name: '浅色', exact: true }).click();
    await expect.poll(async () => (await readEdge()).scheme).toBe('light');
    await themeSwitch.getByRole('radio', { name: '跟随系统', exact: true }).click();
    await expect.poll(readEdge).toEqual(systemDark);
    // Server-rendered consumers can retain the explicit system attribute.
    await page.locator('html').evaluate((element) => element.setAttribute('data-theme', 'system'));
    await expect.poll(readEdge).toEqual(systemDark);
    // Device changes must restore the same dark card material as the toolbar.
    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(async () => (await readEdge()).scheme).toBe('light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(readEdge).toEqual(systemDark);
  });
}
