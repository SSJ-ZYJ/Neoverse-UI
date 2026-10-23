import { expect, test } from '@playwright/test';

const presentationViewports = [
  { label: 'mobile 390', width: 390, height: 844 },
  { label: 'desktop 1280', width: 1280, height: 900 },
  { label: 'desktop 1600', width: 1600, height: 900 },
  { label: 'desktop 1920', width: 1920, height: 1080 },
  { label: 'desktop 2560', width: 2560, height: 1080 },
] as const;

for (const theme of ['light', 'dark'] as const) {
  test(`buttons match segmented option corner radius / ${theme}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Desktop control corner geometry.');
    await page.goto(`/?theme=${theme}&lang=en#controls-button`, {
      waitUntil: 'domcontentloaded',
    });
    const radii = await page.locator('#controls-button').evaluate((section) => {
      const button = section.querySelector<HTMLElement>(
        '.ui-button:not(.ui-icon-button):not(.ui-action)',
      );
      const option = section.querySelector<HTMLElement>('.ui-segmented-control__option');
      if (button === null || option === null) {
        throw new Error('Button and segmented option examples are required');
      }
      return {
        button: getComputedStyle(button).borderTopLeftRadius,
        option: getComputedStyle(option).borderTopLeftRadius,
      };
    });
    expect(radii.option).toBe(radii.button);
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`grouped controls preserve concentric corners at both scales / ${theme}`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Desktop control corner geometry.');
    await page.goto(`/?theme=${theme}&lang=en#controls-surface`, {
      waitUntil: 'domcontentloaded',
    });
    const geometry = await page
      .locator('#controls-surface .ui-control-surface')
      .evaluateAll((surfaces) =>
        surfaces
          .filter((surface) => surface.textContent?.includes('scale='))
          .map((surface) => {
            const button = surface.querySelector('.ui-button');
            if (!(surface instanceof HTMLElement) || !(button instanceof HTMLElement)) {
              throw new Error('Scale example is missing a control');
            }
            const parent = surface.getBoundingClientRect();
            const scale = parent.width / surface.offsetWidth;
            const innerRadius = Number.parseFloat(getComputedStyle(button).borderTopLeftRadius);
            const radiusProbe = document.createElement('span');
            radiusProbe.style.position = 'absolute';
            radiusProbe.style.borderRadius = 'var(--neoverse-control-surface-inner-radius)';
            surface.append(radiusProbe);
            const expectedInnerRadius = Number.parseFloat(
              getComputedStyle(radiusProbe).borderTopLeftRadius,
            );
            radiusProbe.remove();
            return { scale, innerRadius, expectedInnerRadius };
          }),
      );
    expect(geometry).toHaveLength(2);
    expect(geometry[1]?.scale).toBeGreaterThan(geometry[0]?.scale ?? 0);
    for (const item of geometry) {
      expect(item.innerRadius).toBeCloseTo(item.expectedInnerRadius, 0);
    }
  });
}
for (const theme of ['light', 'dark'] as const) {
  test(`segmented plates and CSS refraction share concentric corners / ${theme}`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Desktop corner geometry.');
    await page.goto(`/?theme=${theme}&lang=en#controls-segmented-control`, {
      waitUntil: 'domcontentloaded',
    });
    const segmented = page
      .locator('#controls-segmented-control .ui-segmented-control[data-surface="glass-subtle"]')
      .first();
    const corners = await segmented.evaluate((element) => {
      if (!(element instanceof HTMLElement)) throw new Error('Missing segmented control root');
      const slider = element.querySelector<HTMLElement>('.ui-segmented-control__slider');
      if (slider === null) throw new Error('Missing active plate');
      const root = element.getBoundingClientRect();
      const plate = slider.getBoundingClientRect();
      const scale = root.width / element.offsetWidth;
      const radiusProbe = document.createElement('span');
      radiusProbe.style.borderRadius = 'var(--neoverse-control-segmented-option-radius)';
      element.append(radiusProbe);
      const expectedInner = Number.parseFloat(getComputedStyle(radiusProbe).borderTopLeftRadius);
      radiusProbe.remove();
      return {
        outer: Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
        inner: Number.parseFloat(getComputedStyle(slider).borderTopLeftRadius),
        expectedInner,
        inset: (plate.top - root.top) / scale,
      };
    });
    // The slider radius follows its dedicated option token, not a subtraction
    // of the rendered plate offset from the shell radius.
    expect(corners.inner).toBeCloseTo(corners.expectedInner, 2);
    expect(corners.inner).toBeLessThan(corners.outer);
    expect(corners.inset).toBeGreaterThan(0);

    await page.goto(`/?theme=${theme}&lang=en#controls-surface`, {
      waitUntil: 'domcontentloaded',
    });
    const localEdge = page
      .locator('#controls-surface .ui-control-surface[data-neoverse-glass-edge-pass="css"]')
      .first();
    const cssEdge = await localEdge.evaluate((element) => {
      const root = getComputedStyle(element);
      const edge = getComputedStyle(element, '::before');
      return {
        radius: root.borderTopLeftRadius,
        inset: edge.top,
        edgeRadius: edge.borderTopLeftRadius,
      };
    });
    expect(cssEdge.inset).toBe('0px');
    expect(cssEdge.edgeRadius).toBe(cssEdge.radius);
  });
}

test('light segmented selections keep a visible well, raised plate, and aligned tab indicator', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop light-theme material contract.');
  await page.goto('/?theme=light&lang=en#controls-segmented-control', {
    waitUntil: 'domcontentloaded',
  });

  const segmented = page
    .locator('#controls-segmented-control .ui-segmented-control[data-surface="glass-subtle"]')
    .first();

  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-neoverse-glass-renderer');
  });
  const readShellEdge = () =>
    segmented.evaluate((element) => {
      const root = getComputedStyle(element);
      const edge = getComputedStyle(element, '::before');
      return {
        borderColor: root.borderTopColor,
        display: edge.display,
        opacity: Number.parseFloat(edge.opacity) || 0,
        backgroundImage: edge.backgroundImage,
        maskImage: edge.maskImage,
        filter: edge.filter,
      };
    });
  const edgeAtRest = await readShellEdge();
  expect(edgeAtRest.borderColor).toBe('rgba(0, 0, 0, 0)');
  expect(edgeAtRest.display).toBe('block');
  expect(edgeAtRest.opacity).toBeGreaterThan(0);
  // Refraction is a masked backdrop sample, not a painted gradient.
  expect(edgeAtRest.backgroundImage).toBe('none');
  expect(edgeAtRest.maskImage).not.toBe('none');
  expect(edgeAtRest.filter).not.toBe('none');

  const material = await segmented.evaluate((element) => {
    const colorAlpha = (value: string): number => {
      if (value === 'transparent') return 0;
      const slash = value.match(/\/\s*([\d.]+)\s*\)$/);
      if (slash?.[1] !== undefined) return Number.parseFloat(slash[1]);
      const rgba = value.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/);
      if (rgba?.[1] !== undefined) return Number.parseFloat(rgba[1]);
      return 1;
    };

    const slider = element.querySelector<HTMLElement>('.ui-segmented-control__slider');
    if (slider === null) throw new Error('Missing active segmented plate');
    const activeOption = element.querySelector<HTMLElement>(
      '.ui-segmented-control__option--active',
    );
    if (activeOption === null) throw new Error('Missing active segmented option');
    const rootStyle = getComputedStyle(element);
    const sliderStyle = getComputedStyle(slider);
    const shadowProbe = document.createElement('span');
    shadowProbe.style.boxShadow = 'var(--neoverse-control-segmented-active-shadow)';
    element.append(shadowProbe);
    const expectedPlateShadow = getComputedStyle(shadowProbe).boxShadow;
    shadowProbe.remove();
    return {
      wellAlpha: colorAlpha(rootStyle.backgroundColor),
      plateAlpha: colorAlpha(sliderStyle.backgroundColor),
      plateInsetLayers: sliderStyle.boxShadow.match(/inset/g)?.length ?? 0,
      plateShadow: sliderStyle.boxShadow,
      expectedPlateShadow,
    };
  });

  expect(material.wellAlpha).toBeGreaterThan(0);
  expect(material.plateAlpha).toBeGreaterThan(material.wellAlpha);
  // The active plate now uses the shared external depth shadow, not an inset ring.
  expect(material.plateInsetLayers).toBe(0);
  expect(material.plateShadow).toBe(material.expectedPlateShadow);
  expect(material.plateShadow).not.toBe('none');

  const readWellState = () =>
    segmented.evaluate((element) => {
      const style = getComputedStyle(element);
      const perceivedLightness = (value: string): number => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const context = canvas.getContext('2d');
        if (context === null) throw new Error('Unable to create color sampling context');
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        const [red = 0, green = 0, blue = 0, alphaByte = 255] = context.getImageData(
          0,
          0,
          1,
          1,
        ).data;
        const alpha = alphaByte / 255;
        const composite = (channel: number) => (channel * alpha + 255 * (1 - alpha)) / 255;
        return composite(red) * 0.2126 + composite(green) * 0.7152 + composite(blue) * 0.0722;
      };
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        borderColor: style.borderTopColor,
        boxShadow: style.boxShadow,
        backdropFilter: style.backdropFilter,
        lightness: perceivedLightness(style.backgroundColor),
      };
    });

  const restingWellState = await readWellState();

  await segmented.hover();
  const edgeOnHover = await readShellEdge();
  expect(edgeOnHover.borderColor).toBe(edgeAtRest.borderColor);
  expect(edgeOnHover.display).toBe(edgeAtRest.display);
  expect(edgeOnHover.opacity).toBe(edgeAtRest.opacity);
  expect(edgeOnHover.backgroundImage).toBe(edgeAtRest.backgroundImage);

  const hoveredWellState = await readWellState();
  expect(hoveredWellState.lightness).toBeCloseTo(restingWellState.lightness, 3);
  expect(hoveredWellState.backgroundColor).toBe(restingWellState.backgroundColor);
  expect(hoveredWellState.borderColor).toBe(restingWellState.borderColor);
  expect(hoveredWellState.boxShadow).toBe(restingWellState.boxShadow);
  expect(hoveredWellState.backdropFilter).toBe(restingWellState.backdropFilter);
  expect(hoveredWellState.backgroundImage).toBe(restingWellState.backgroundImage);

  const activeOption = segmented.locator('.ui-segmented-control__option--active');
  await activeOption.focus();
  const focusVisual = await activeOption.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow,
    };
  });
  expect(focusVisual.outlineStyle).not.toBe('none');
  expect(Number.parseFloat(focusVisual.outlineWidth)).toBeGreaterThan(0);
  expect(focusVisual.boxShadow).toBe('none');

  await page.goto('/?theme=light&lang=en#controls-surface', {
    waitUntil: 'domcontentloaded',
  });
  const tabs = page.locator('#controls-surface .ui-control-surface--shared-indicator').last();
  await page.evaluate(async () => {
    const surfaces = document.querySelectorAll(
      '#controls-surface .ui-control-surface--shared-indicator',
    );
    const surface = surfaces.item(surfaces.length - 1);
    const items = surface?.querySelectorAll<HTMLElement>('.ui-navigation-item');
    const firstItem = items?.item(0);
    if (!items || firstItem === null || firstItem === undefined) {
      throw new Error('Missing shared navigation labels for font stabilization');
    }
    const style = getComputedStyle(firstItem);
    const family = style.fontFamily.split(',')[0]?.trim();
    if (!family) throw new Error('Missing preferred navigation font family');
    const labels = Array.from(items, (item) => item.textContent ?? '').join(' ');
    await document.fonts.load(`${style.fontWeight} ${style.fontSize} ${family}`, labels);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
  await tabs.locator('.ui-navigation-item').nth(1).click();
  const selection = await tabs.evaluate((element) => {
    const colorAlpha = (value: string): number => {
      if (value === 'transparent') return 0;
      const slash = value.match(/\/\s*([\d.]+)\s*\)$/);
      if (slash?.[1] !== undefined) return Number.parseFloat(slash[1]);
      const rgba = value.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/);
      if (rgba?.[1] !== undefined) return Number.parseFloat(rgba[1]);
      return 1;
    };

    const active = element.querySelector<HTMLElement>('.ui-navigation-item--active');
    const indicator = element.querySelector<HTMLElement>('.ui-control-surface__indicator');
    if (active === null || indicator === null) throw new Error('Missing shared tab selection');
    const style = getComputedStyle(element);
    const spatialDuration = style.getPropertyValue('--neoverse-motion-spatial-duration').trim();
    const expectedDuration = spatialDuration.endsWith('ms')
      ? Number.parseFloat(spatialDuration) / 1000
      : Number.parseFloat(spatialDuration);
    return {
      borderAlpha: colorAlpha(getComputedStyle(active).borderTopColor),
      duration: Number.parseFloat(getComputedStyle(indicator).transitionDuration) || 0,
      expectedDuration,
    };
  });

  expect(selection.borderAlpha).toBeLessThanOrEqual(0.05);
  expect(selection.duration).toBeCloseTo(selection.expectedDuration, 3);
  await expect
    .poll(
      () =>
        tabs.evaluate((element) => {
          const target = element.querySelector<HTMLElement>(
            '.ui-navigation-item--active .ui-navigation-item__indicator',
          );
          const indicator = element.querySelector<HTMLElement>('.ui-control-surface__indicator');
          if (target === null || indicator === null) {
            throw new Error('Missing shared tab selection');
          }
          const targetRect = target.getBoundingClientRect();
          const indicatorRect = indicator.getBoundingClientRect();
          return Math.abs(
            indicatorRect.left + indicatorRect.width / 2 - (targetRect.left + targetRect.width / 2),
          );
        }),
      // Hash navigation and Glass repaint may delay the browser's transition start.
      // Check the CSS duration above; allow the normal assertion window to settle.
      { timeout: Math.max(5000, Math.ceil(selection.expectedDuration * 4000 + 250)) },
    )
    .toBeLessThanOrEqual(1.5);
});

test('shadow token specimens always place a full-width preview above their text', async ({
  page,
}) => {
  await page.goto('/?theme=dark&lang=en#shadow', { waitUntil: 'domcontentloaded' });
  const specimens = page.locator('#shadow-primitive .playground-shadow-token');
  await expect(specimens).toHaveCount(7);
  const geometry = await specimens.evaluateAll((elements) =>
    elements.map((element) => {
      const preview = element.querySelector<HTMLElement>('[data-preview="shadow"]');
      const copy = element.querySelector<HTMLElement>(':scope > span:last-child');
      if (preview === null || copy === null) throw new Error('Incomplete shadow specimen');
      const sample = preview.getBoundingClientRect();
      const label = copy.getBoundingClientRect();
      const card = element.getBoundingClientRect();
      return {
        layout: getComputedStyle(element).display,
        previewWidth: sample.width,
        availableWidth: card.width,
        previewBottom: sample.bottom,
        copyTop: label.top,
        copyFits: copy.scrollWidth <= copy.clientWidth + 1,
      };
    }),
  );
  expect(geometry.every((item) => item.layout === 'grid')).toBe(true);
  expect(geometry.every((item) => item.previewWidth > item.availableWidth * 0.8)).toBe(true);
  expect(geometry.every((item) => item.copyTop >= item.previewBottom)).toBe(true);
  expect(geometry.every((item) => item.copyFits)).toBe(true);
});

for (const theme of ['light', 'dark'] as const) {
  test(`reading composition keeps prose on the shared Glass material without solid rules / ${theme}`, async ({
    page,
  }) => {
    await page.goto(`/?theme=${theme}&lang=en#composition-reading`, {
      waitUntil: 'domcontentloaded',
    });
    const tableRegion = page.locator('[data-reading-prose] [data-ui-table-region]');
    await expect(tableRegion).not.toHaveAttribute('data-surface');
    const tableSurface = page.locator('[data-reading-prose] .playground-data-table-surface');
    await expect(tableSurface).toHaveAttribute('data-surface', 'none');
    const article = page.locator('[data-reading-composition] article');
    await expect(article).toHaveAttribute('data-surface', 'glass-elevated');
    const proseMaterial = await article.evaluate((element) => {
      const quote = element.querySelector('blockquote');
      const inlineCode = element.querySelector('p code');
      const prose = element.querySelector('[data-reading-prose]');
      if (quote === null || inlineCode === null || prose === null)
        throw new Error('Missing prose material samples');
      const articleStyle = getComputedStyle(element);
      const quoteStyle = getComputedStyle(quote);
      const inlineCodeStyle = getComputedStyle(inlineCode);
      const inlineCodeProbe = document.createElement('span');
      inlineCodeProbe.style.position = 'fixed';
      inlineCodeProbe.style.insetInlineStart = '-9999px';
      inlineCodeProbe.style.background = 'var(--neoverse-prose-inline-code-background)';
      element.append(inlineCodeProbe);
      const inlineCodeProbeStyle = getComputedStyle(inlineCodeProbe);
      const expectedInlineCodeBackground = inlineCodeProbeStyle.backgroundImage;
      const expectedInlineCodeBackgroundColor = inlineCodeProbeStyle.backgroundColor;
      inlineCodeProbe.remove();
      return {
        articleBackground: articleStyle.backgroundImage,
        articleBackgroundColor: articleStyle.backgroundColor,
        articleFilter: articleStyle.backdropFilter,
        proseBackground: getComputedStyle(prose).backgroundImage,
        proseFilter: getComputedStyle(prose).backdropFilter,
        articleShadow: articleStyle.boxShadow,
        quoteBackground: quoteStyle.backgroundImage,
        quoteBackgroundColor: quoteStyle.backgroundColor,
        quoteShadow: quoteStyle.boxShadow,
        quoteBorder: quoteStyle.borderTopWidth,
        quoteFilter: quoteStyle.backdropFilter,
        inlineCodeBackground: inlineCodeStyle.backgroundImage,
        inlineCodeBackgroundColor: inlineCodeStyle.backgroundColor,
        inlineCodeShadow: inlineCodeStyle.boxShadow,
        inlineCodeBorder: inlineCodeStyle.borderTopWidth,
        expectedInlineCodeBackground,
        expectedInlineCodeBackgroundColor,
      };
    });
    // UiSurface owns the sampled Glass color plane; prose owns typography and
    // does not add another background or backdrop blur to that plane.
    expect(proseMaterial.articleBackground).toBe('none');
    expect(proseMaterial.articleBackgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(proseMaterial.articleFilter).toContain('blur(');
    expect(proseMaterial.proseBackground).toBe('none');
    expect(proseMaterial.proseFilter).toBe('none');
    expect(proseMaterial.articleShadow).not.toBe('none');
    expect(proseMaterial.quoteBackground).toBe('none');
    expect(proseMaterial.quoteBackgroundColor).toMatch(/(?:\/\s*0\.15\)|,\s*0\.15\))/);
    expect(proseMaterial.quoteBorder).toBe('0px');
    expect(proseMaterial.quoteFilter).toContain('blur(12px)');
    expect(proseMaterial.inlineCodeBackground).toBe('none');
    expect(proseMaterial.inlineCodeBackgroundColor).toMatch(/(?:\/\s*0\.15\)|,\s*0\.15\))/);
    expect(proseMaterial.inlineCodeBorder).toBe('0px');
    expect(proseMaterial.inlineCodeBackground).toBe(proseMaterial.expectedInlineCodeBackground);
    expect(proseMaterial.inlineCodeBackgroundColor).toBe(
      proseMaterial.expectedInlineCodeBackgroundColor,
    );
    expect(proseMaterial.quoteBackgroundColor).toBe(proseMaterial.inlineCodeBackgroundColor);
    expect(proseMaterial.quoteShadow).not.toBe(proseMaterial.inlineCodeShadow);
    const metrics = await tableRegion.evaluate((element) => {
      const table = element.querySelector('table');
      const cell = element.querySelector('tbody td');
      const zebraRow = element.querySelector('tbody tr:nth-child(even)');
      const zebraFirstCell = zebraRow?.querySelector('td:first-child') ?? null;
      const zebraLastCell = zebraRow?.querySelector('td:last-child') ?? null;
      if (
        table === null ||
        cell === null ||
        zebraRow === null ||
        zebraFirstCell === null ||
        zebraLastCell === null
      ) {
        throw new Error('Missing reading table');
      }
      const tableStyle = getComputedStyle(table);
      const surface = element.closest<HTMLElement>('.playground-data-table-surface');
      if (surface === null) throw new Error('Missing reading table surface');
      const surfaceStyle = getComputedStyle(surface);
      const zebraRowStyle = getComputedStyle(zebraRow);
      const zebraFirstCellStyle = getComputedStyle(zebraFirstCell);
      const zebraLastCellStyle = getComputedStyle(zebraLastCell);
      return {
        surfaceFilter: surfaceStyle.backdropFilter,
        cellFilter: getComputedStyle(cell).backdropFilter,
        filter: tableStyle.backdropFilter,
        background: tableStyle.backgroundImage,
        border: tableStyle.borderTopWidth,
        cellBorder: getComputedStyle(cell).borderRightWidth,
        zebraRowBackground: zebraRowStyle.backgroundColor,
        zebraCellBackground: zebraFirstCellStyle.backgroundColor,
        bottomStartRadius: zebraFirstCellStyle.borderBottomLeftRadius,
        bottomEndRadius: zebraLastCellStyle.borderBottomRightRadius,
        documentOverflow:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(metrics.surfaceFilter).toBe('none');
    expect(metrics.cellFilter).toBe('none');
    expect(metrics.filter).toContain('blur(12px)');
    expect(metrics.background).toBe('none');
    expect(metrics.border).toBe('0px');
    expect(metrics.cellBorder).not.toBe('0px');
    expect(metrics.zebraRowBackground).toBe('rgba(0, 0, 0, 0)');
    expect(metrics.zebraCellBackground).not.toBe('rgba(0, 0, 0, 0)');
    expect(metrics.bottomStartRadius).not.toBe('0px');
    expect(metrics.bottomEndRadius).not.toBe('0px');
    expect(metrics.documentOverflow).toBeLessThanOrEqual(0);
  });
}

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
test('Glass preview stages reuse one controlled gradient without raster backdrops', async ({
  page,
}, testInfo) => {
  await page.goto('/?theme=light&lang=en#materials', { waitUntil: 'domcontentloaded' });

  const stages = page.locator('[data-glass-preview-stage]');
  await expect(stages).toHaveCount(3);

  const readStages = () =>
    stages.evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          backgroundImage: style.backgroundImage,
          backgroundColor: style.backgroundColor,
          width: rect.width,
          height: rect.height,
        };
      }),
    );

  const lightStages = await readStages();
  expect(new Set(lightStages.map(({ backgroundImage }) => backgroundImage)).size).toBe(1);
  expect(
    lightStages.every(
      ({ backgroundImage }) =>
        backgroundImage.includes('radial-gradient') && !backgroundImage.includes('url('),
    ),
  ).toBe(true);
  expect(
    Math.max(...lightStages.map(({ width }) => width)) -
      Math.min(...lightStages.map(({ width }) => width)),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.max(...lightStages.map(({ height }) => height)) -
      Math.min(...lightStages.map(({ height }) => height)),
  ).toBeLessThanOrEqual(1);

  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: /Cycle theme/ }).click();
  } else {
    await page.getByRole('radio', { name: 'Dark' }).click();
  }

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const darkStages = await readStages();
  expect(new Set(darkStages.map(({ backgroundImage }) => backgroundImage)).size).toBe(1);
  expect(darkStages.every(({ backgroundImage }) => !backgroundImage.includes('url('))).toBe(true);
});

test('shell segmented controls keep their Glass surface and outer inset in the header', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Pointer hover regression is desktop-specific.');

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?theme=dark&lang=zh#controls', { waitUntil: 'domcontentloaded' });

  const control = page.locator('[data-playground-page] > header .ui-segmented-control').first();
  const inactive = control
    .locator('.ui-segmented-control__option:not(.ui-segmented-control__option--active)')
    .first();
  await expect(control).toHaveAttribute('data-surface', 'glass-subtle');
  await expect(inactive).toBeVisible();
  const controls = page.locator('[data-playground-page] > header .ui-segmented-control');
  await expect(controls).toHaveCount(2);
  const insets = await controls.evaluateAll((elements) =>
    elements.map((element) => {
      const options = element.querySelector<HTMLElement>('.ui-segmented-control__options');
      if (!options) throw new Error('Segmented-control options are missing');
      const root = element.getBoundingClientRect();
      const inner = options.getBoundingClientRect();
      return {
        blockStart: inner.top - root.top,
        blockEnd: root.bottom - inner.bottom,
        inlineStart: inner.left - root.left,
        inlineEnd: root.right - inner.right,
      };
    }),
  );
  for (const [index, inset] of insets.entries()) {
    expect(inset.blockStart, `control ${index} top inset`).toBeGreaterThanOrEqual(4);
    expect(inset.blockEnd, `control ${index} bottom inset`).toBeGreaterThanOrEqual(4);
    expect(inset.inlineStart, `control ${index} start inset`).toBeGreaterThanOrEqual(4);
    expect(inset.inlineEnd, `control ${index} end inset`).toBeGreaterThanOrEqual(4);
  }

  const controlSurface = await control.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      borderColor: style.borderColor,
      borderStyle: style.borderStyle,
      boxShadow: style.boxShadow,
      backdropFilter: style.backdropFilter,
    };
  });
  expect(
    controlSurface.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
      controlSurface.backgroundImage !== 'none' ||
      (controlSurface.borderStyle !== 'none' &&
        controlSurface.borderColor !== 'rgba(0, 0, 0, 0)') ||
      controlSurface.boxShadow !== 'none' ||
      controlSurface.backdropFilter !== 'none',
  ).toBe(true);

  const readOptionPlate = () =>
    inactive.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        borderColor: style.borderColor,
        borderStyle: style.borderStyle,
        boxShadow: style.boxShadow,
      };
    });

  const resting = await readOptionPlate();
  expect(resting.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(resting.backgroundImage).toBe('none');
  expect(resting.borderColor).toBe('rgba(0, 0, 0, 0)');
  expect(resting.boxShadow).toBe('none');

  await inactive.hover();
  const hovered = await readOptionPlate();
  expect(
    hovered.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
      hovered.backgroundImage !== 'none' ||
      (hovered.borderStyle !== 'none' && hovered.borderColor !== 'rgba(0, 0, 0, 0)') ||
      hovered.boxShadow !== 'none',
  ).toBe(true);
});
test('segmented header plates stay still on refresh and animate on selection', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Header segmented controls are desktop-only.');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    const transitions: string[] = [];
    (
      window as Window & {
        __segmentedPlateTransitions?: string[];
      }
    ).__segmentedPlateTransitions = transitions;
    document.addEventListener(
      'transitionrun',
      (event) => {
        const target = event.target;
        if (
          target instanceof Element &&
          target.matches('.ui-segmented-control__slider') &&
          target.closest('[data-playground-page] > header') !== null
        ) {
          transitions.push((event as TransitionEvent).propertyName);
        }
      },
      true,
    );
  });

  async function readTransitions(): Promise<string[]> {
    const transitions = await page.evaluate(() => {
      const windowState = window as Window & {
        __segmentedPlateTransitions?: string[];
      };
      return windowState.__segmentedPlateTransitions ?? [];
    });
    return transitions;
  }

  for (let refresh = 0; refresh < 3; refresh += 1) {
    if (refresh === 0) {
      await page.goto('/?theme=dark&lang=zh#controls', { waitUntil: 'domcontentloaded' });
    } else {
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
    await expect(page.locator('[data-playground-page] > header .ui-segmented-control')).toHaveCount(
      2,
    );
    await page.waitForTimeout(500);
    expect(await readTransitions(), `slider transitions after refresh ${refresh + 1}`).toEqual([]);
  }

  const themeOptions = page
    .locator('[data-playground-page] > header .ui-segmented-control')
    .first()
    .getByRole('radio');
  const currentIndex = await themeOptions.evaluateAll((elements) =>
    elements.findIndex((element) => element.getAttribute('aria-checked') === 'true'),
  );
  expect(currentIndex).toBeGreaterThanOrEqual(0);
  const optionCount = await themeOptions.count();
  const nextOption = themeOptions.nth((currentIndex + 1) % optionCount);
  await nextOption.click();
  await expect(nextOption).toHaveAttribute('aria-checked', 'true');
  await expect.poll(readTransitions).toContain('transform');
});

test('system theme keeps the gradient preview backdrop synchronized with the preferred color scheme', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/?theme=system&lang=en#materials', { waitUntil: 'domcontentloaded' });

  const backdrop = page.locator('[data-glass-preview-stage]').first();
  await expect(backdrop).toBeVisible();
  const dark = await backdrop.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundImage: style.backgroundImage,
      backgroundColor: style.backgroundColor,
    };
  });
  expect(dark.backgroundImage).toContain('radial-gradient');
  expect(dark.backgroundImage).not.toContain('url(');

  await page.emulateMedia({ colorScheme: 'light' });
  await expect
    .poll(() => backdrop.evaluate((element) => getComputedStyle(element).backgroundColor))
    .not.toBe(dark.backgroundColor);
});

test('Playground keeps the 100% zoom presentation baseline across responsive widths', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'The baseline is covered once from the desktop project.',
  );

  for (const viewport of presentationViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/?theme=light&lang=en#controls', { waitUntil: 'domcontentloaded' });

    const metrics = await page.evaluate(() => {
      const shell = document.querySelector<HTMLElement>('main:not([data-design-lab-region])');
      if (shell === null) {
        throw new Error('Playground shell is missing');
      }

      return {
        devicePixelRatio: window.devicePixelRatio,
        visualViewportScale: window.visualViewport?.scale ?? 1,
        shellWidth: shell.getBoundingClientRect().width,
        viewportWidth: window.innerWidth,
        documentOverflow:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

    expect(metrics.devicePixelRatio, viewport.label).toBe(1);
    expect(metrics.visualViewportScale, viewport.label).toBe(1);
    expect(metrics.shellWidth, viewport.label).toBeCloseTo(metrics.viewportWidth, 1);
    expect(metrics.documentOverflow, viewport.label).toBeLessThanOrEqual(0);
  }
});

for (const theme of ['light', 'dark'] as const) {
  for (const viewport of presentationViewports) {
    for (const route of [
      { moduleId: 'controls', selector: '[data-design-lab-region="module"]' },
      { moduleId: 'composition', selector: '[data-design-lab-region="module"]' },
      { moduleId: 'consumer-parity', selector: '[data-consumer-parity="floating-navigation"]' },
    ] as const) {
      test(`high-risk Playground surfaces stay inside local overflow regions across themes and widths / ${theme} / ${viewport.label} / ${route.moduleId}`, async ({
        page,
      }, testInfo) => {
        test.skip(
          testInfo.project.name !== 'desktop',
          'Responsive coverage runs once from the desktop project.',
        );

        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`/?theme=${theme}&lang=en#${route.moduleId}`, {
          waitUntil: 'domcontentloaded',
        });
        const target = page.locator(route.selector).first();
        await expect(target, `${theme} ${viewport.label} ${route.moduleId}`).toBeVisible();

        const metrics = await page.evaluate((selector) => {
          const workspace = document.querySelector<HTMLElement>('[data-design-lab-workspace]');
          const target = document.querySelector<HTMLElement>(selector);
          if (workspace === null || target === null) {
            throw new Error(`Responsive fixture is missing: ${selector}`);
          }

          const rect = target.getBoundingClientRect();
          return {
            workspaceOverflow: workspace.scrollWidth - workspace.clientWidth,
            documentOverflow:
              document.documentElement.scrollWidth - document.documentElement.clientWidth,
            bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
            targetLeft: rect.left,
            targetRight: rect.right,
            viewportWidth: window.innerWidth,
          };
        }, route.selector);

        expect(
          metrics.workspaceOverflow,
          `${theme} ${viewport.label} ${route.moduleId}`,
        ).toBeLessThanOrEqual(1);
        expect(
          metrics.documentOverflow,
          `${theme} ${viewport.label} ${route.moduleId}`,
        ).toBeLessThanOrEqual(0);
        expect(
          metrics.bodyOverflow,
          `${theme} ${viewport.label} ${route.moduleId}`,
        ).toBeLessThanOrEqual(0);
        expect(
          metrics.targetLeft,
          `${theme} ${viewport.label} ${route.moduleId}`,
        ).toBeGreaterThanOrEqual(-1);
        expect(
          metrics.targetRight,
          `${theme} ${viewport.label} ${route.moduleId}`,
        ).toBeLessThanOrEqual(metrics.viewportWidth + 1);
      });
    }
  }
}

test('keyboard focus remains visible on representative Playground controls in both themes', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'Keyboard focus coverage runs once from the desktop project.',
  );

  const focusTargets = [
    '#controls-button [data-specimen-state-row][data-specimen-label="Focus"] .ui-button',
    '#controls-icon-button [data-specimen-state-row][data-specimen-label="Focus"] .ui-button',
    '#controls-action [data-specimen-state-row][data-specimen-label="Focus"] .ui-action',
    '#controls-navigation-item [data-specimen-state-row][data-specimen-label="Focus"] .ui-navigation-item',
    '#controls-segmented-control [data-specimen-state-row][data-specimen-label="Focus"] [role="radio"]',
  ];

  for (const theme of ['light', 'dark'] as const) {
    await page.goto(`/frame?theme=${theme}&lang=en#controls`, { waitUntil: 'domcontentloaded' });
    for (const selector of focusTargets) {
      const target = page.locator(selector).first();
      await expect(target, `${theme} ${selector}`).toBeVisible();
      await target.focus();
      const focusState = await target.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          isFocusVisible: element.matches(':focus-visible'),
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          boxShadow: style.boxShadow,
        };
      });

      expect(focusState.isFocusVisible, `${theme} ${selector}`).toBe(true);
      expect(
        focusState.outlineWidth !== '0px' ||
          focusState.outlineStyle !== 'none' ||
          focusState.boxShadow !== 'none',
        `${theme} ${selector}`,
      ).toBe(true);
    }
  }
});
