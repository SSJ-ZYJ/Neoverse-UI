import { expect, test } from '@playwright/test';

test('desktop playground uses the 1920x1080 100% baseline and fills the viewport', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'This assertion defines the desktop baseline.');

  await page.goto('/?lang=en', { waitUntil: 'domcontentloaded' });

  const metrics = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>('main:not([data-design-lab-region])');
    if (shell === null) {
      throw new Error('Playground shell is missing');
    }

    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      shellWidth: shell.getBoundingClientRect().width,
    };
  });

  expect(metrics).toEqual({
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    shellWidth: 1920,
  });
});

test('playground presentation scales fluidly with desktop viewport width', async ({ page }) => {
  await page.goto('/#controls', { waitUntil: 'domcontentloaded' });

  const readRootFontSize = async (width: number): Promise<number> => {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(25);
    return page.evaluate(() =>
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
    );
  };

  expect(await readRootFontSize(1280)).toBeCloseTo(18, 1);
  expect(await readRootFontSize(1600)).toBeCloseTo(21, 1);
  expect(await readRootFontSize(1920)).toBeCloseTo(24, 1);
  expect(await readRootFontSize(2560)).toBeCloseTo(24, 1);
});

test('playground visibly applies the Neoverse UI brand icon and favicon', async ({ page }) => {
  await page.goto('/?lang=zh', { waitUntil: 'domcontentloaded' });

  const brandIcon = page.locator('[data-playground-brand-icon]');
  await expect(brandIcon).toBeVisible();
  await expect
    .poll(() =>
      brandIcon.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true);

  const favicon = page.locator('link[rel~="icon"]');
  await expect(favicon).toHaveAttribute('href', /^data:image\/svg\+xml/);
});

test('main playground renders the selected module directly instead of through an adaptive iframe', async ({
  page,
}) => {
  await page.goto('/#controls', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('[data-design-lab-region="module"]')).toBeVisible();
});

test('legacy top-level module links resolve to their consolidated destination', async ({
  page,
}) => {
  await page.goto('/#spacing', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/#layout-shape$/);
  await expect(page.locator('#module-title')).toBeVisible();
});

test('in-page module anchors do not reset the workspace scroll position', async ({ page }) => {
  await page.goto('/#controls', { waitUntil: 'domcontentloaded' });

  const workspace = page.locator('[data-design-lab-workspace]');
  await workspace.evaluate((element) => element.scrollTo({ top: 900, behavior: 'auto' }));
  await page.evaluate(() => {
    window.location.hash = 'controls-action';
  });
  await page.waitForTimeout(100);

  expect(await workspace.evaluate((element) => element.scrollTop)).toBeGreaterThan(100);
  await expect(page).toHaveURL(/#controls-action$/);
});

test('mobile playground header stays within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });

  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
  }));

  expect(overflow.document).toBeLessThanOrEqual(0);
  expect(overflow.body).toBeLessThanOrEqual(0);
  await expect(page.locator('[data-back-to-overview]')).toBeHidden();
});

test('mobile color palettes keep horizontal density inside their own scroll regions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#colors', { waitUntil: 'domcontentloaded' });

  const metrics = await page.evaluate(() => {
    const strip = document.querySelector<HTMLElement>('[data-color-palette-strip]');
    if (strip === null) {
      throw new Error('Color palette strip is missing');
    }

    return {
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      stripClientWidth: strip.clientWidth,
      stripScrollWidth: strip.scrollWidth,
    };
  });

  expect(metrics.documentOverflow).toBeLessThanOrEqual(0);
  expect(metrics.stripScrollWidth).toBeGreaterThan(metrics.stripClientWidth);
});

test('color swatches expose full token names without truncation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/?lang=en#colors', { waitUntil: 'domcontentloaded' });

  const clipped = await page.locator('[data-color-swatch-cell]').evaluateAll((cells) =>
    cells.flatMap((cell) =>
      [
        ...cell.querySelectorAll<HTMLElement>(
          '[data-color-swatch-label], [data-color-swatch-variable], [data-color-swatch-class]',
        ),
      ]
        .filter((element) => {
          const style = getComputedStyle(element);
          return style.textOverflow === 'ellipsis' || style.whiteSpace === 'nowrap';
        })
        .map((element) => element.textContent?.trim() ?? ''),
    ),
  );

  expect(clipped).toEqual([]);

  const typography = await page
    .locator('[data-color-swatch-cell]')
    .first()
    .evaluate((cell) => {
      const label = cell.querySelector<HTMLElement>('[data-color-swatch-label]');
      const variable = cell.querySelector<HTMLElement>('[data-color-swatch-variable]');
      if (label === null || variable === null) {
        throw new Error('Color swatch typography is missing');
      }

      const labelStyle = getComputedStyle(label);
      const variableStyle = getComputedStyle(variable);
      return {
        labelFontSize: Number.parseFloat(labelStyle.fontSize),
        variableFontSize: Number.parseFloat(variableStyle.fontSize),
        variableOverflowWrap: variableStyle.overflowWrap,
        variableWordBreak: variableStyle.wordBreak,
      };
    });

  expect(typography.variableFontSize).toBeLessThan(typography.labelFontSize);
  expect(typography.variableOverflowWrap).toBe('break-word');
  expect(typography.variableWordBreak).toBe('normal');
  await expect(page.getByText('Secondary foreground').first()).toBeVisible();
  await expect(
    page.getByText('--neoverse-color-accent-secondary-foreground').first(),
  ).toBeVisible();
});

test('floating dock keeps balanced geometry across desktop presentation scales', async ({
  page,
}) => {
  for (const width of [1280, 1600, 1920, 2560]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto('/?theme=dark&lang=en#consumer-parity', { waitUntil: 'domcontentloaded' });

    const metrics = await page
      .locator('[data-consumer-parity="floating-navigation"]')
      .evaluate((dock) => {
        const active = dock.querySelector<HTMLElement>(
          '.consumer-parity-dock__item.ui-navigation-item--active',
        );
        const icon = active?.querySelector<HTMLElement>('.ui-action__leading > svg');
        const indicator = active?.querySelector<HTMLElement>('.ui-navigation-item__indicator');
        const trailing = dock.querySelector<HTMLElement>('.ui-control-surface__group--trailing');
        const option = trailing?.querySelector<HTMLElement>('.ui-segmented-control__option');
        if (!active || !icon || !indicator || !trailing || !option) {
          throw new Error('Floating dock geometry nodes are missing');
        }

        const dockRect = dock.getBoundingClientRect();
        const activeRect = active.getBoundingClientRect();
        const iconRect = icon.getBoundingClientRect();
        const indicatorRect = indicator.getBoundingClientRect();
        const trailingRect = trailing.getBoundingClientRect();
        const optionRect = option.getBoundingClientRect();
        const items = [...dock.querySelectorAll<HTMLElement>('.consumer-parity-dock__item')];
        const itemRects = items.map((item) => item.getBoundingClientRect());
        const itemGaps = itemRects.slice(1).flatMap((rect, index) => {
          const previous = itemRects[index];
          return previous ? [rect.left - previous.right] : [];
        });
        const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
        const navigationFontSize = Number.parseFloat(getComputedStyle(active).fontSize);

        return {
          documentOverflow:
            document.documentElement.scrollWidth - document.documentElement.clientWidth,
          navigationHeight: activeRect.height,
          navigationFontRatio: navigationFontSize / rootFontSize,
          minimumItemGapRatio: Math.min(...itemGaps) / rootFontSize,
          indicatorContentGap: indicatorRect.top - iconRect.bottom,
          trailingOuterGap: dockRect.right - trailingRect.right,
          optionHeight: optionRect.height,
          trailingInsideDock: trailingRect.right <= dockRect.right + 0.1,
        };
      });

    expect(metrics.documentOverflow, `viewport ${width}`).toBeLessThanOrEqual(0);
    expect(metrics.trailingInsideDock, `viewport ${width}`).toBe(true);
    expect(
      metrics.minimumItemGapRatio,
      `navigation item spacing at viewport ${width}`,
    ).toBeGreaterThanOrEqual(0.2);
    expect(
      metrics.navigationFontRatio,
      `navigation label density at viewport ${width}`,
    ).toBeLessThanOrEqual(0.72);
    expect(
      metrics.indicatorContentGap / metrics.navigationHeight,
      `indicator breathing room at viewport ${width}`,
    ).toBeGreaterThanOrEqual(0.13);
    expect(
      metrics.trailingOuterGap / metrics.navigationHeight,
      `trailing edge breathing room at viewport ${width}`,
    ).toBeGreaterThanOrEqual(0.24);
    expect(
      metrics.optionHeight / metrics.navigationHeight,
      `segmented option density at viewport ${width}`,
    ).toBeLessThanOrEqual(0.9);
  }
});
test('floating dock keeps hovered and active navigation plates visually separated', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Mouse hover regression is desktop-specific.');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?theme=dark&lang=zh#consumer-parity', { waitUntil: 'domcontentloaded' });

  const dock = page.locator('[data-consumer-parity="floating-navigation"]');
  const items = dock.locator('.consumer-parity-dock__item');
  await items.nth(1).hover();

  const metrics = await dock.evaluate((element) => {
    const navItems = [...element.querySelectorAll<HTMLElement>('.consumer-parity-dock__item')];
    const active = navItems[0];
    const hovered = navItems[1];
    if (!active || !hovered) throw new Error('Adjacent navigation items are missing');
    const activeRect = active.getBoundingClientRect();
    const hoveredRect = hovered.getBoundingClientRect();
    return {
      gap: hoveredRect.left - activeRect.right,
      rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
      activeBackground: getComputedStyle(active).backgroundImage,
      hoveredBackground: getComputedStyle(hovered).backgroundColor,
    };
  });

  expect(metrics.gap).toBeGreaterThanOrEqual(metrics.rootFontSize * 0.2);
  expect(metrics.activeBackground).not.toBe('none');
  expect(metrics.hoveredBackground).not.toBe('rgba(0, 0, 0, 0)');
});
test('main playground swaps the material backdrop when switching to dark theme', async ({
  page,
}) => {
  await page.goto('/?theme=light&lang=en#materials', { waitUntil: 'domcontentloaded' });

  const backdrop = page.locator('[style*="material-background-"]').first();
  await expect(backdrop).toBeVisible();
  await expect(backdrop).toHaveAttribute('style', /material-background-light/);

  await page.getByRole('radio', { name: 'Dark' }).click();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(backdrop).toHaveAttribute('style', /material-background-dark/);
});

test('system theme keeps the material backdrop synchronized with the preferred color scheme', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/?theme=system&lang=en#materials', { waitUntil: 'domcontentloaded' });

  const backdrop = page.locator('[style*="material-background-"]').first();
  await expect(backdrop).toHaveAttribute('style', /material-background-dark/);

  await page.emulateMedia({ colorScheme: 'light' });
  await expect(backdrop).toHaveAttribute('style', /material-background-light/);
});
