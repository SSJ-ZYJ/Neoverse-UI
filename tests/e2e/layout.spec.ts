import { expect, type Locator, test } from '@playwright/test';
import { chooseOption, showInspector } from '../support/playground';

const box = (locator: Locator) =>
  locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      width: rect.width,
      height: rect.height,
      radius: Number.parseFloat(style.borderTopLeftRadius),
      fontSize: Number.parseFloat(style.fontSize),
      paddingInline: Number.parseFloat(style.paddingInlineStart),
      zoom: style.zoom,
    };
  });

test.describe('layout', () => {
  test('buttons, icon buttons and segmented options keep their token baseline', async ({
    page,
  }) => {
    await page.goto('/frame?theme=light&lang=en#controls', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#controls-button')).toBeVisible();

    const rootFont = await page.evaluate(() =>
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
    );
    expect(rootFont).toBeCloseTo(16, 1);

    const circles = page.locator('#controls-button [data-button-shape="circle"]');
    await expect(circles).toHaveCount(3);
    const sizes = [28, 36, 44];
    for (let index = 0; index < sizes.length; index += 1) {
      const shape = await box(circles.nth(index));
      expect(shape.width).toBeCloseTo(sizes[index] ?? 0, 0);
      expect(shape.height).toBeCloseTo(shape.width, 0);
      expect(shape.radius).toBeGreaterThanOrEqual(shape.width / 2);
      expect(shape.zoom).toBe('1');
    }

    const button = await box(page.locator('#controls-button .ui-button').first());
    expect(button.height).toBeCloseTo(36, 0);
    expect(button.paddingInline).toBeCloseTo(12, 0);
    expect(button.fontSize).toBeCloseTo(14, 0);

    const segment = await box(
      page.locator('#controls-segmented-control .ui-segmented-control__option').first(),
    );
    expect(segment.height).toBeCloseTo(32, 0);
    expect(segment.fontSize).toBeCloseTo(14, 0);
  });

  test('form controls keep the 40px input baseline', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#forms', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.ui-input').first()).toBeVisible();

    const input = await box(page.locator('.ui-input').first());
    expect(input.height).toBeCloseTo(40, 0);
    expect(input.fontSize).toBeCloseTo(14, 0);
    expect(input.zoom).toBe('1');
  });

  test('badge sizes follow the 13/14/16 scale with one weight and family', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#status-feedback', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('.ui-badge').first()).toBeVisible();

    const typography = await page.locator('.ui-badge').evaluateAll((badges) =>
      badges.map((badge) => {
        const style = getComputedStyle(badge);
        return { size: style.fontSize, weight: style.fontWeight, family: style.fontFamily };
      }),
    );
    expect(new Set(typography.map((entry) => entry.size))).toEqual(
      new Set(['13px', '14px', '16px']),
    );
    expect(new Set(typography.map((entry) => entry.weight))).toEqual(new Set(['650']));
    expect(new Set(typography.map((entry) => entry.family)).size).toBe(1);
  });

  test('interface title roles stay ordered and distinct at every width', async ({ page }) => {
    for (const width of [390, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/?lang=en#foundation-typography', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-type-scale="Title Small"]')).toBeVisible();

      const sizes = await page
        .locator('[data-type-scale]')
        .evaluateAll((rows) =>
          Object.fromEntries(
            rows.map((row) => [
              row.getAttribute('data-type-scale') ?? '',
              Number.parseFloat(getComputedStyle(row).fontSize),
            ]),
          ),
        );
      expect(sizes['Title Small'], `${width}px`).toBeCloseTo(16, 1);
      expect(sizes['Title Medium'], `${width}px`).toBeCloseTo(18, 1);
      expect(sizes['Title Large'], `${width}px`).toBeCloseTo(20, 1);
      expect(sizes['Title Large'] ?? 0).toBeGreaterThan(sizes['Title Medium'] ?? 0);
      expect(sizes['Title Medium'] ?? 0).toBeGreaterThan(sizes['Title Small'] ?? 0);
    }
  });

  test('interactive controls keep a 24px minimum target', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#controls', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#controls-button')).toBeVisible();

    const undersized = await page
      .locator('.ui-button, .ui-icon-button, .ui-segmented-control__option')
      .evaluateAll((elements) =>
        elements
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              label: (element.textContent ?? element.getAttribute('aria-label') ?? '').trim(),
              width: rect.width,
              height: rect.height,
            };
          })
          .filter((entry) => entry.width > 0 && Math.min(entry.width, entry.height) < 24),
      );
    expect(undersized).toEqual([]);
  });

  test('module specimens render at their natural scale', async ({ page }) => {
    for (const module of ['controls', 'forms', 'status-feedback', 'terminal'] as const) {
      await page.goto(`/?lang=en#${module}`, { waitUntil: 'domcontentloaded' });
      const region = page.locator('[data-design-lab-region="module"]');
      await expect(region).toBeVisible();
      const scale = await region.evaluate((element) => ({
        zoom: getComputedStyle(element).zoom,
        fontSize: getComputedStyle(document.documentElement).fontSize,
      }));
      expect(scale.zoom, `${module} must not scale its specimens`).toBe('1');
      expect(Number.parseFloat(scale.fontSize), `${module} root size`).toBeCloseTo(16, 1);
    }
  });

  test('table captions sit above one rounded plate in previews and composition scenes', async ({
    page,
  }) => {
    for (const route of [
      '/?theme=light&lang=en#data-display-table',
      '/?theme=light&lang=en#composition-reading',
      '/?theme=light&lang=en#consumer-parity',
    ]) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const region = page.locator('.ui-table-region').first();
      await expect(region).toBeVisible();
      const geometry = await region.evaluate((element) => {
        const table = element.querySelector('table');
        const caption = table?.querySelector('caption');
        const firstHeader = table?.querySelector('thead th:first-child');
        const lastFirst = table?.querySelector('tbody tr:last-child td:first-child');
        const lastLast = table?.querySelector('tbody tr:last-child td:last-child');
        if (!table || !caption || !firstHeader || !lastFirst || !lastLast) return null;
        return {
          portTopStart: getComputedStyle(element).borderTopLeftRadius,
          portBottomStart: getComputedStyle(element).borderBottomLeftRadius,
          portBottomEnd: getComputedStyle(element).borderBottomRightRadius,
          regionOverflow: getComputedStyle(element).overflowX,
          captionPosition: getComputedStyle(caption).position,
          captionBackground: getComputedStyle(caption).backgroundColor,
          gap: table.getBoundingClientRect().top - caption.getBoundingClientRect().bottom,
          topRadius: getComputedStyle(firstHeader).borderTopLeftRadius,
          bottomStart: getComputedStyle(lastFirst).borderBottomLeftRadius,
          bottomEnd: getComputedStyle(lastLast).borderBottomRightRadius,
        };
      });
      expect(geometry, `${route} must render a table caption`).not.toBeNull();
      // The scroll port repeats the plate radius so its clip owns the bottom
      // corners: a table cannot clip its own cell fills, and a square port leaves
      // their silhouette with right angles. The top corners stay square because
      // the caption occupies that band and a rounded clip would shave its first
      // glyph; the plate's own top corners sit below the band.
      expect(geometry?.portBottomStart, `${route} scroll port bottom-start`).toBe(
        geometry?.topRadius,
      );
      expect(geometry?.portBottomEnd, `${route} scroll port bottom-end`).toBe(geometry?.topRadius);
      expect(geometry?.portTopStart, `${route} caption band clearance`).toBe('0px');
      expect(geometry?.regionOverflow, `${route} scroll port clip`).toBe('auto');
      expect(geometry?.captionPosition, `${route} caption placement`).toBe('absolute');
      expect(geometry?.captionBackground, `${route} caption background`).toBe('rgba(0, 0, 0, 0)');
      expect(geometry?.gap ?? 0, `${route} caption clearance`).toBeGreaterThan(0);
      expect(geometry?.bottomStart, `${route} bottom-start corner`).toBe(geometry?.topRadius);
      expect(geometry?.bottomEnd, `${route} bottom-end corner`).toBe(geometry?.topRadius);
    }
  });
});

test('React adapters keep the shared control baseline', async ({ page }) => {
  await page.goto('/react-fixture?theme=light&lang=en', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-react-adapter="UiButton"]')).toBeVisible();

  const button = await box(page.locator('[data-react-adapter="UiButton"]'));
  expect(button.height).toBeCloseTo(36, 0);
  expect(button.paddingInline).toBeCloseTo(12, 0);
  expect(button.fontSize).toBeCloseTo(14, 0);
  expect(button.zoom).toBe('1');

  const input = await box(page.locator('[data-react-adapter="UiInput"]'));
  expect(input.height).toBeCloseTo(40, 0);
  expect(input.fontSize).toBeCloseTo(14, 0);

  const segment = await box(
    page.locator('[data-react-adapter="UiSegmentedControl"] .ui-segmented-control__option').first(),
  );
  expect(segment.height).toBeCloseTo(32, 0);
});

test('the extended button palette keeps green, amber, and purple distinct in both themes', async ({
  page,
}) => {
  for (const theme of ['light', 'dark']) {
    await page.goto(`/react-fixture?theme=${theme}&lang=en`);
    for (const variant of ['success', 'warning', 'accent'] as const) {
      const button = page.locator(`[data-button-palette="${variant}"]`);
      await expect(button).toBeVisible();
      const { red, green, blue } = await button.evaluate((element) => {
        const fill = getComputedStyle(element).backgroundImage;
        const match = fill.match(/(?:color\(srgb |rgba?\()([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
        if (match === null) throw new Error(`Expected a colored fill, received ${fill}`);
        return { red: Number(match[1]), green: Number(match[2]), blue: Number(match[3]) };
      });
      if (variant === 'success') expect(green).toBeGreaterThan(Math.max(red, blue));
      else if (variant === 'warning') {
        expect(red).toBeGreaterThan(green);
        expect(green).toBeGreaterThan(blue);
      } else {
        expect(blue).toBeGreaterThan(red);
        expect(red).toBeGreaterThan(green);
      }
    }
  }
});

test('control surface scales step smoothly from medium to large without altering dock scales', async ({
  page,
}, testInfo) => {
  await page.goto('/frame?theme=light&lang=en#controls-surface', {
    waitUntil: 'domcontentloaded',
  });
  const frameSurfaces = page.locator('#controls-surface .ui-control-surface');
  await expect(frameSurfaces.first()).toBeVisible();

  const scaleSamples = await frameSurfaces.evaluateAll((elements) =>
    elements.map((element) => ({
      text: element.textContent?.trim() ?? '',
      zoom: getComputedStyle(element).zoom,
    })),
  );
  const mediumFrame = scaleSamples.find((entry) => entry.text.includes('scale="md"'));
  const largeFrame = scaleSamples.find((entry) => entry.text.includes('scale="lg"'));
  expect(mediumFrame?.zoom).toBe('1.08');
  expect(largeFrame?.zoom).toBe('1.18');

  await page.goto('/frame?theme=light&lang=en#dock', { waitUntil: 'domcontentloaded' });
  const dockLocator = page.locator('[data-dock-specimen="standard"] .ui-dock');
  const dock = await box(dockLocator);
  expect(dock.zoom).toBe('1.1');
  const dockInsets = await dockLocator.evaluate((element) => {
    const style = getComputedStyle(element);
    const zoom = Number.parseFloat(style.zoom) || 1;
    const border = Number.parseFloat(style.borderLeftWidth) * zoom;
    const surfaceRect = element.getBoundingClientRect();
    const items = Array.from(element.querySelectorAll('.ui-navigation-item')).map((item) =>
      item.getBoundingClientRect(),
    );
    const first = items[0];
    if (!first) throw new Error('Missing dock navigation item');
    return {
      paddingLeft: Number.parseFloat(style.paddingLeft),
      left: first.left - (surfaceRect.left + border),
      top: first.top - (surfaceRect.top + border),
      bottom: surfaceRect.bottom - border - first.bottom,
    };
  });
  expect(dockInsets.paddingLeft).toBeCloseTo(6, 1);
  expect(dockInsets.left).toBeCloseTo(6 * 1.1, 0);
  expect(dockInsets.top).toBeCloseTo(6 * 1.1, 0);
  expect(dockInsets.bottom).toBeCloseTo(6 * 1.1, 0);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?theme=light&lang=en#controls-surface', { waitUntil: 'domcontentloaded' });
  const specimenSurface = page.locator('#controls-surface .ui-control-surface');
  const firstItem = specimenSurface.locator('.ui-navigation-item').first();
  await expect(specimenSurface).toBeVisible();

  const mediumSurface = await box(specimenSurface);
  const mediumItem = await box(firstItem);
  expect(mediumSurface.zoom).toBe('1.08');
  expect(mediumItem.height).toBeCloseTo(32 * 1.08, 1);
  expect(mediumItem.fontSize).toBeCloseTo(14, 1);

  const surfaceInsets = await specimenSurface.evaluate((element) => {
    const style = getComputedStyle(element);
    const zoom = Number.parseFloat(style.zoom) || 1;
    const border = Number.parseFloat(style.borderLeftWidth) * zoom;
    const surfaceRect = element.getBoundingClientRect();
    const items = Array.from(element.querySelectorAll('.ui-navigation-item')).map((item) =>
      item.getBoundingClientRect(),
    );
    const first = items[0];
    const second = items[1];
    const last = items.at(-1);
    if (!first || !second || !last) throw new Error('Missing control-surface navigation items');
    return {
      paddingLeft: Number.parseFloat(style.paddingLeft),
      paddingTop: Number.parseFloat(style.paddingTop),
      left: first.left - (surfaceRect.left + border),
      right: surfaceRect.right - border - last.right,
      top: first.top - (surfaceRect.top + border),
      bottom: surfaceRect.bottom - border - first.bottom,
      gap: second.left - first.right,
    };
  });
  expect(surfaceInsets.paddingLeft).toBeCloseTo(4, 1);
  expect(surfaceInsets.paddingTop).toBeCloseTo(4, 1);
  expect(surfaceInsets.left).toBeCloseTo(4 * 1.08, 0);
  expect(surfaceInsets.right).toBeCloseTo(4 * 1.08, 0);
  expect(surfaceInsets.top).toBeCloseTo(4 * 1.08, 0);
  expect(surfaceInsets.bottom).toBeCloseTo(4 * 1.08, 0);
  expect(surfaceInsets.gap).toBeCloseTo(4 * 1.08, 0);

  const inspector = await showInspector(page, testInfo.project.name === 'mobile');
  await chooseOption(inspector, 'scale', 'Large');

  await expect.poll(async () => (await box(specimenSurface)).zoom).toBe('1.18');
  const largeSurface = await box(specimenSurface);
  const largeItem = await box(firstItem);
  expect(largeItem.height).toBeCloseTo(32 * 1.18, 1);
  expect(largeItem.fontSize).toBeCloseTo(14, 1);
  expect(largeSurface.height).toBeGreaterThan(mediumSurface.height);
});
