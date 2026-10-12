import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`sidebar selection retains its semantic background through interaction in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/?theme=${theme}&lang=en#dock`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveCSS('color-scheme', theme);
    if (testInfo.project.name === 'mobile') {
      await page.locator('[data-playground-nav-trigger]').click();
    }
    const navigation = page.locator('#design-lab-navigation');
    const selected = navigation.locator('a[href="#dock"]');
    await expect(selected).toHaveAttribute('aria-current', 'page');
    await selected.scrollIntoViewIfNeeded();
    const expected = await selected.evaluate((element) => {
      const reference = document.createElement('span');
      reference.style.backgroundColor = 'var(--neoverse-color-accent-soft)';
      element.append(reference);
      const background = getComputedStyle(reference).backgroundColor;
      reference.remove();
      return background;
    });
    expect(expected).not.toBe('rgba(0, 0, 0, 0)');
    await expect(selected).toHaveCSS('background-color', expected);
    await expect(selected).toHaveCSS('background-image', 'none');
    if (testInfo.project.name === 'desktop') {
      await selected.hover();
      await expect(selected).toHaveCSS('background-color', expected);
    }
    const bounds = await selected.boundingBox();
    if (!bounds) throw new Error('Selected sidebar item is missing');
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await expect(selected).toHaveCSS('background-color', expected);
    // Releasing outside keeps the drawer open and avoids activating navigation.
    await page.mouse.move(bounds.x + bounds.width + 2, bounds.y + bounds.height / 2);
    await page.mouse.up();
    await expect(selected).toHaveCSS('background-color', expected);
    await selected.focus();
    await expect(selected).toBeFocused();
    await expect(selected).toHaveCSS('background-color', expected);
    await expect(navigation.locator('a[href="#controls"]')).toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)',
    );
  });
}

test('Dock language geometry retains the original desktop and compact proportions', async ({
  page,
}, testInfo) => {
  await page.goto('/frame?theme=dark&lang=en#consumer-parity', { waitUntil: 'domcontentloaded' });
  const dock = page.locator('.consumer-parity-dock');
  await expect(dock).toBeVisible();
  const desktop = testInfo.project.name === 'desktop';
  const geometry = await dock.evaluate((element) => {
    const option = element.querySelector('[role="radio"]');
    if (!option) throw new Error('Missing language option');
    const style = getComputedStyle(option);
    return {
      scale: Number(getComputedStyle(element).zoom),
      font: parseFloat(style.fontSize),
      height: option.getBoundingClientRect().height,
      padding: parseFloat(style.paddingInline),
    };
  });
  expect(geometry.scale).toBe(desktop ? 1.3 : 1);
  expect(geometry.font).toBeCloseTo(14, 2);
  expect(geometry.height).toBeCloseTo(32 * (desktop ? 1.3 : 1), 1);
  expect(geometry.padding).toBeCloseTo(6, 1);
});

for (const framework of ['vue', 'react'] as const) {
  test(`${framework}: dark filled buttons retain neutral and primary fields independently of Glass`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(
      framework === 'vue'
        ? '/frame?theme=dark&lang=en#controls'
        : '/react-fixture?lang=en&contract-fixtures',
      { waitUntil: 'domcontentloaded' },
    );
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    const prefix = framework === 'vue' ? '#controls-button ' : '';
    for (const variant of ['secondary', 'primary'] as const) {
      const button = page
        .locator(`${prefix}.ui-button--${variant}[data-surface="glass-subtle"]`)
        .first();
      await expect(button).toBeVisible();
      const field = button.locator('.ui-button__tone-field');
      await expect(field).toHaveCount(1);
      const normalizeField = (value: string) =>
        button.evaluate((element, value) => {
          const probe = document.createElement('span');
          probe.style.backgroundImage = value;
          element.append(probe);
          const result = getComputedStyle(probe).backgroundImage;
          probe.remove();
          return result;
        }, value);
      const neutralRest = 'linear-gradient(145deg, rgb(181 197 213 / 13%), rgb(127 147 168 / 7%))';
      const neutralHover =
        'linear-gradient(145deg, rgb(181 197 213 / 17%), rgb(127 147 168 / 10%))';
      const accent = (mint: number, blue: number) =>
        `linear-gradient(145deg, color-mix(in srgb, var(--neoverse-color-accent-secondary) ${mint}%, transparent), color-mix(in srgb, var(--neoverse-color-accent-primary) ${blue}%, transparent))`;
      const read = () =>
        button.evaluate((element) => {
          const field = element.querySelector('.ui-button__tone-field');
          if (!field) throw new Error('Missing command tone field');
          const style = getComputedStyle(element);
          return {
            base: style.backgroundColor,
            filter: style.backdropFilter,
            tone: getComputedStyle(field).backgroundImage,
            fieldFilter: getComputedStyle(field).backdropFilter,
          };
        });
      await page.mouse.move(0, 0);
      const rest = await read();
      expect(rest.tone).toBe(
        await normalizeField(
          variant === 'primary' ? `${accent(18, 10)}, ${neutralRest}` : neutralRest,
        ),
      );
      expect(rest.fieldFilter).toBe('none');
      expect(rest.filter).toContain('blur(12px)');
      if (variant === 'primary') expect(rest.tone.match(/linear-gradient/g)).toHaveLength(2);
      else expect(rest.tone.match(/linear-gradient/g)).toHaveLength(1);
      if (testInfo.project.name === 'desktop') {
        await button.hover();
        expect((await read()).tone).toBe(
          await normalizeField(
            variant === 'primary' ? `${accent(24, 14)}, ${neutralHover}` : neutralHover,
          ),
        );
        await page.mouse.down();
        expect((await read()).tone).toBe(
          await normalizeField(
            variant === 'primary' ? `${accent(30, 18)}, ${neutralHover}` : accent(13, 7),
          ),
        );
        expect((await read()).base).toBe(rest.base);
        expect((await read()).filter).toBe(rest.filter);
        await page.mouse.up();
        await page.mouse.move(0, 0);
        await expect.poll(async () => (await read()).tone).toBe(rest.tone);
      }
    }
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`${theme}: Dock retains floating depth, trailing grouping and persistent selection`, async ({
    page,
  }) => {
    await page.goto(`/frame?theme=${theme}&lang=en#consumer-parity`, {
      waitUntil: 'domcontentloaded',
    });
    const dock = page.locator('.consumer-parity-dock');
    await expect(dock).toBeVisible();
    const trailing = dock.locator('.ui-control-surface__group--trailing');
    const selected = dock.locator('.ui-navigation-item--active');
    expect(
      await selected.evaluate((element) => getComputedStyle(element).backgroundImage),
    ).not.toBe('none');
    if (theme === 'dark')
      await expect(trailing).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.03)');
    const shadow =
      theme === 'dark'
        ? '0 18px 42px -20px rgb(0 0 0 / 48%), 0 6px 18px -12px rgb(0 0 0 / 58%)'
        : '0 18px 42px -20px rgb(14 34 44 / 20%), 0 6px 18px -12px rgb(14 34 44 / 14%)';
    const expected = await dock.evaluate((element, shadow) => {
      const probe = document.createElement('span');
      probe.style.boxShadow = `var(--neoverse-control-chrome-edge-highlight), ${shadow}`;
      element.append(probe);
      const result = getComputedStyle(probe).boxShadow;
      probe.remove();
      return result;
    }, shadow);
    await expect(dock).toHaveCSS('box-shadow', expected);
    await expect(trailing).toHaveCSS('backdrop-filter', 'none');
    await expect(dock).toHaveCSS('background-image', 'none');
    expect(await dock.evaluate((element) => getComputedStyle(element).backdropFilter)).toContain(
      'blur(12px)',
    );
  });

  test(`${theme}: segmented selection retains its accent field without changing tier optics`, async ({
    page,
  }) => {
    await page.goto(`/frame?theme=${theme}&lang=en#controls`, { waitUntil: 'domcontentloaded' });
    const group = page
      .locator('#controls-button .ui-segmented-control[data-surface="glass-subtle"]')
      .first();
    const slider = group.locator('.ui-segmented-control__slider');
    await expect(slider).toBeVisible();
    expect(await slider.evaluate((element) => getComputedStyle(element).backgroundImage)).not.toBe(
      'none',
    );
    const base = await group.evaluate((element) => ({
      fill: getComputedStyle(element).backgroundColor,
      filter: getComputedStyle(element).backdropFilter,
    }));
    await group.getByRole('radio', { name: 'Two', exact: true }).click();
    expect(
      await group.evaluate((element) => ({
        fill: getComputedStyle(element).backgroundColor,
        filter: getComputedStyle(element).backdropFilter,
      })),
    ).toEqual(base);
  });

  for (const framework of ['vue', 'react'] as const) {
    test(`${framework} ${theme}: command buttons retain their theme-specific depth`, async ({
      page,
    }, testInfo) => {
      await page.goto(
        framework === 'vue'
          ? `/frame?theme=${theme}&lang=en#controls`
          : `/react-fixture?theme=${theme}&lang=en&contract-fixtures`,
        { waitUntil: 'domcontentloaded' },
      );
      // The React fixture defaults to system theme; select the actual test theme.
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      await expect(page.locator('html')).toHaveCSS('color-scheme', theme);
      const button =
        framework === 'vue'
          ? page
              .locator('#controls-button .ui-button--secondary[data-surface="glass-subtle"]')
              .first()
          : page.locator('.ui-button--secondary').first();
      await button.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      // Preserved pre-migration shadows. Glass blur/alpha are tested separately.
      const rest =
        theme === 'dark'
          ? 'inset 0 1px 0 rgb(255 255 255 / 8%)'
          : 'inset 0 1px 0 rgb(255 255 255 / 36%), 0 3px 9px -5px rgb(14 34 44 / 18%), var(--neoverse-shadow-control)';
      const hover =
        theme === 'dark'
          ? 'inset 0 1px 0 rgb(255 255 255 / 10%)'
          : 'inset 0 1px 0 rgb(255 255 255 / 44%), 0 4px 12px -6px rgb(14 34 44 / 20%), var(--neoverse-shadow-control)';
      const resolveShadow = (value: string) =>
        button.evaluate((element, value) => {
          const reference = document.createElement('span');
          reference.style.boxShadow = value;
          element.append(reference);
          const shadow = getComputedStyle(reference).boxShadow;
          reference.remove();
          return shadow;
        }, value);
      await expect
        .poll(() => button.evaluate((element) => getComputedStyle(element).boxShadow))
        .toBe(await resolveShadow(rest));
      if (testInfo.project.name === 'desktop') {
        await button.hover();
        await expect
          .poll(() => button.evaluate((element) => getComputedStyle(element).boxShadow))
          .toBe(await resolveShadow(hover));
      }
      const primary =
        framework === 'vue'
          ? page
              .locator('#controls-button .ui-button--primary[data-surface="glass-subtle"]')
              .first()
          : page.locator('.ui-button--primary').first();
      await primary.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      const primaryRest =
        theme === 'dark'
          ? 'inset 0 1px 0 color-mix(in srgb, var(--neoverse-color-edge-light) 72%, transparent), 0 8px 20px -16px color-mix(in srgb, var(--neoverse-color-accent-secondary) 42%, transparent)'
          : rest;
      const primaryHover =
        theme === 'dark'
          ? 'inset 0 1px 0 color-mix(in srgb, var(--neoverse-color-edge-light) 82%, transparent), 0 10px 24px -17px color-mix(in srgb, var(--neoverse-color-accent-secondary) 50%, transparent)'
          : hover;
      await expect
        .poll(() => primary.evaluate((element) => getComputedStyle(element).boxShadow))
        .toBe(await resolveShadow(primaryRest));
      if (testInfo.project.name === 'desktop') {
        await primary.hover();
        await expect
          .poll(() => primary.evaluate((element) => getComputedStyle(element).boxShadow))
          .toBe(await resolveShadow(primaryHover));
      }
    });
  }
}
