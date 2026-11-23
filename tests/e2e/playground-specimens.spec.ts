import { expect, test } from '@playwright/test';

test('every Explorer specimen opens a nonempty, independently sized preview', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?theme=system&lang=en', { waitUntil: 'domcontentloaded' });
  const explorer = page.locator('[data-playground-navigation]');
  const links = explorer.locator('.playground-explorer__specimens a[href^="#"]');
  await expect(links.first()).toBeAttached();
  const hashes = await links.evaluateAll((items) =>
    items.flatMap((item) => (item instanceof HTMLAnchorElement ? [item.hash] : [])),
  );
  const stage = page.locator('[data-design-lab-workspace]');
  for (const hash of [...hashes, '#foundation-layout-shape', '#forms-choice-controls']) {
    await test.step(hash, async () => {
      await page.goto(`/?theme=system&lang=en${hash}`, { waitUntil: 'domcontentloaded' });
      const specimen = stage.locator(`[data-design-lab-region="specimen"]${hash}`);
      await expect(specimen).toBeVisible();
      await expect(page.locator(hash)).toHaveCount(1);
      await expect(
        stage.locator('[data-design-lab-region="module"], [data-qa-matrix]'),
      ).toHaveCount(0);
      expect(
        await specimen.locator('.playground-stage__specimen-content').evaluate((content) => {
          const { height, width } = content.getBoundingClientRect();
          return (
            width > 0 &&
            height > 0 &&
            Array.from(content.children).some((child) => {
              const rect = child.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0;
            })
          );
        }),
      ).toBe(true);
      expect(
        await stage.evaluate((element) => element.scrollWidth - element.clientWidth),
      ).toBeLessThanOrEqual(1);
    });
  }
});

test('the Colors gallery shows every shade and role without sideways scrolling', async ({
  page,
}) => {
  const workspace = page.locator('[data-design-lab-workspace]');
  for (const route of ['colors', 'foundation-colors']) {
    await page.goto(`/?theme=dark&lang=zh#${route}`, { waitUntil: 'domcontentloaded' });
    const firstScale = workspace.locator('[data-color-scale]').first();
    await expect(firstScale).toBeVisible();
    await expect(firstScale.locator('code').first()).toHaveText('50');
    await expect(firstScale.locator('code').last()).toHaveText('950');
    const roles = workspace.locator('[data-color-roles]');
    await expect(roles.locator('[data-color-swatch-variable]').first()).toHaveText(
      '--neoverse-color-surface-canvas',
    );
    await expect(roles.locator('[data-color-swatch-class]').first()).toHaveText(
      'bg-surface-canvas',
    );

    for (const region of [workspace, firstScale, roles]) {
      expect(
        await region.evaluate((element) => element.scrollWidth - element.clientWidth),
      ).toBeLessThanOrEqual(1);
    }
    const filtered = await workspace
      .locator('[data-color-swatch-cell]')
      .evaluateAll((cells) =>
        cells.some((cell) => getComputedStyle(cell).backdropFilter !== 'none'),
      );
    expect(filtered).toBe(false);
  }
});

test('Markdown headings step down through six distinct sizes', async ({ page }) => {
  await page.goto('/?lang=en#foundation-typography', { waitUntil: 'domcontentloaded' });
  const rows = page.locator('[data-markdown-heading]');
  await expect(rows).toHaveCount(6);

  const sizes = await rows.evaluateAll((items) =>
    items.map((row) => {
      const heading = row.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading === null) throw new Error('A heading sample is missing');
      return Number.parseFloat(getComputedStyle(heading).fontSize);
    }),
  );
  expect(new Set(sizes).size).toBe(6);
  for (let index = 1; index < sizes.length; index += 1) {
    expect(sizes[index]).toBeLessThan(sizes[index - 1] ?? 0);
  }

  for (const region of [
    page.locator('[data-markdown-headings]'),
    page.locator('[data-design-lab-workspace]'),
  ]) {
    expect(
      await region.evaluate((element) => element.scrollWidth - element.clientWidth),
    ).toBeLessThanOrEqual(1);
  }
});

test('specimen titles share a clear section and subsection hierarchy across modules', async ({
  page,
}) => {
  for (const [route, sectionId, subsection] of [
    ['/?lang=zh#typography', 'typography-scale', '[data-markdown-headings]'],
    ['/?lang=zh#controls', 'controls-button', '[data-specimen-state-row]'],
    ['/frame?theme=light&lang=zh#materials', 'materials-surface', null],
  ] as const) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const section = page.locator(`section#${sectionId}`);
    const sectionHeader = section.locator(':scope > header');
    await expect(sectionHeader.getByRole('heading')).toHaveCSS('font-size', '20px');
    await expect(sectionHeader.locator('p')).toHaveCSS('font-size', '16px');
    if (subsection) {
      const subsectionHeader = section.locator(subsection).first().locator(':scope > header');
      await expect(subsectionHeader.getByRole('heading')).toHaveCSS('font-size', '18px');
      await expect(subsectionHeader.locator('p')).toHaveCSS('font-size', '14px');
    }
    expect(
      await sectionHeader.evaluate((header) => header.scrollWidth - header.clientWidth),
    ).toBeLessThanOrEqual(1);
  }
});

test('Markdown inline styles stay distinct in rendered combinations', async ({ page }) => {
  await page.goto('/?lang=en#foundation-typography', { waitUntil: 'domcontentloaded' });
  const panel = page.locator('[data-markdown-inline]');
  await expect(panel).toBeVisible();

  const read = (row: string, selector: string) =>
    panel.locator(`[data-markdown-inline-row="${row}"] ${selector}`).evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        color: style.color,
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight === 'normal' ? 400 : Number(style.fontWeight),
        fontStyle: style.fontStyle,
        line: style.textDecorationLine,
      };
    });

  const body = await read('bold', 'p');
  const bold = await read('bold', 'strong');
  expect(bold.fontWeight).toBeGreaterThan(body.fontWeight);

  const italic = await read('italic', 'em');
  expect(italic.fontStyle).toBe('italic');
  expect(italic.fontWeight).toBe(body.fontWeight);

  const boldItalic = await read('bold-italic', 'strong em');
  expect(boldItalic.fontWeight).toBeGreaterThan(body.fontWeight);
  expect(boldItalic.fontStyle).toBe('italic');

  const code = await read('code', 'p > code');
  expect(code.fontFamily).not.toBe(body.fontFamily);
  const codeBold = await read('code-bold', 'strong > code');
  expect(codeBold.fontFamily).toBe(code.fontFamily);
  expect(codeBold.fontWeight).toBeGreaterThan(body.fontWeight);

  const strike = await read('strike', 'del');
  expect(strike.line).toContain('line-through');
  expect(strike.color).not.toBe(body.color);

  const link = await read('link', 'a');
  expect(link.line).toContain('underline');
  expect(link.color).not.toBe(body.color);

  const linkBold = await read('link-bold', 'a');
  const nestedBold = await read('link-bold', 'a strong');
  expect(nestedBold.fontWeight).toBeGreaterThan(body.fontWeight);
  expect(nestedBold.color).toBe(linkBold.color);

  const linkStrike = await read('link-strike', 'a');
  const nestedStrike = await read('link-strike', 'a del');
  expect(linkStrike.line).toContain('underline');
  expect(nestedStrike.line).toContain('line-through');
  expect(nestedStrike.color).toBe(linkStrike.color);

  expect(
    await panel.evaluate((element) => element.scrollWidth - element.clientWidth),
  ).toBeLessThanOrEqual(1);
});

test('plain, bold, and struck links stay underlined and darken on hover', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [theme, backdrop] of [
    ['light', '#d8e8ef'],
    ['dark', '#112832'],
  ]) {
    await page.goto(`/?theme=${theme}&lang=en#foundation-typography`, {
      waitUntil: 'domcontentloaded',
    });
    const panel = page.locator('[data-markdown-inline]');
    for (const row of ['link', 'link-bold', 'link-strike']) {
      const link = panel.locator(`[data-markdown-inline-row="${row}"]`).getByRole('link');
      await expect(link).toHaveCSS('text-decoration-line', 'underline');
      const readUnderline = () =>
        link.evaluate((element, background) => {
          const context = new OffscreenCanvas(1, 1).getContext('2d');
          if (!context) throw new Error('Cannot resolve the underline color without a canvas');
          const luminance = () => {
            const channels = context.getImageData(0, 0, 1, 1).data.slice(0, 3);
            const [red, green, blue] = Array.from(channels, (channel) => {
              const value = channel / 255;
              return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * (red ?? 0) + 0.7152 * (green ?? 0) + 0.0722 * (blue ?? 0);
          };
          context.fillStyle = background;
          context.fillRect(0, 0, 1, 1);
          const base = luminance();
          context.fillStyle = getComputedStyle(element).textDecorationColor;
          context.fillRect(0, 0, 1, 1);
          const stroke = luminance();
          return {
            stroke,
            contrast: (Math.max(base, stroke) + 0.05) / (Math.min(base, stroke) + 0.05),
          };
        }, backdrop);
      const rest = await readUnderline();
      expect
        .soft(rest.contrast, `${row} underline contrasts with the ${theme} backdrop`)
        .toBeGreaterThanOrEqual(theme === 'light' ? 2.4 : 3);
      if (theme === 'light') expect.soft(rest.contrast).toBeLessThan(3);
      if (row === 'link' && !testInfo.project.use.hasTouch) {
        await link.hover();
        const hover = await readUnderline();
        expect.soft(hover.stroke, `${theme} hover darkens the underline`).toBeLessThan(rest.stroke);
        expect.soft(hover.contrast).toBeGreaterThanOrEqual(theme === 'light' ? 2.8 : 3);
        await page.mouse.move(0, 0);
      }
    }
  }
});

test('plain and bold inline code remain distinct on a quiet canvas without a border', async ({
  page,
}) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.goto(`/?theme=${theme}&lang=en#foundation-typography`, {
      waitUntil: 'domcontentloaded',
    });
    const panel = page.locator('[data-markdown-inline]');
    for (const row of ['code', 'code-bold']) {
      const code = panel.locator(`[data-markdown-inline-row="${row}"] p code`);
      await expect(code).toHaveCSS('border-width', '0px');
      const separation = await code.evaluate((element) => {
        const style = getComputedStyle(element);
        const context = new OffscreenCanvas(1, 1).getContext('2d');
        if (!context) throw new Error('Cannot resolve the inline code colors without a canvas');
        const brightness = () => {
          const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
          return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
        };
        context.fillStyle = style.getPropertyValue('--neoverse-color-surface-canvas').trim();
        context.fillRect(0, 0, 1, 1);
        const backdrop = brightness();
        context.fillStyle = style.backgroundColor;
        context.fillRect(0, 0, 1, 1);
        return Math.abs(brightness() - backdrop);
      });
      expect
        .soft(separation, `${row} separates from the ${theme} canvas`)
        .toBeGreaterThanOrEqual(12);
    }
  }
});

test('specimens sit on the stage without a painted card around them', async ({ page }) => {
  // `as const` keeps each entry a [hash, selector] tuple, so the destructured
  // selector stays a string under noUncheckedIndexedAccess.
  for (const [hash, selector] of [
    ['materials', '[data-surface-preset="glass-immersive"]'],
    ['forms', '[data-form-input]'],
    ['controls', '[data-qa-stage="gradient"] button'],
    ['motion', '[data-neoverse-dissolve]'],
    ['colors', '.color-gallery__role-list'],
  ] as const) {
    await page.goto(`/?lang=en#${hash}`, { waitUntil: 'domcontentloaded' });
    const specimen = page.locator(selector).first();
    const layer = await specimen.evaluate((element) => {
      for (let node = element.parentElement; node; node = node.parentElement) {
        if (node.hasAttribute('data-design-lab-workspace')) return null;
        const css = getComputedStyle(node);
        if (css.backgroundColor !== 'rgba(0, 0, 0, 0)') return node.className;
        const effects = [css.backgroundImage, css.backdropFilter, css.boxShadow];
        if (effects.some((value) => value !== 'none')) return node.className;
      }
    });
    expect(layer, hash).toBeNull();
  }
});

test('focused compositions and foundations keep the full galleries in the isolated frame', async ({
  page,
}) => {
  await page.goto('/?lang=en#composition-standard-mode', { waitUntil: 'domcontentloaded' });
  const composition = page.locator('[data-design-lab-region="specimen"]#composition-standard-mode');
  await expect(composition.locator('[data-composition-surface]')).toHaveCount(2);
  await expect(composition.getByRole('heading', { name: 'Atlas workspace' })).toBeVisible();
  await expect(composition.getByRole('heading', { name: 'Aurora Atlas' })).toBeVisible();
  await expect(composition.locator('#composition-reading')).toHaveCount(0);
  await expect(composition.locator('#composition-control-cluster')).toHaveCount(0);
  const backdrop = page.getByRole('radiogroup', { name: 'Stage background' });
  await backdrop.getByRole('radio', { name: 'Gradient' }).click();
  const workspace = page.locator('[data-design-lab-workspace]');
  await expect(workspace).toHaveAttribute('data-stage-background', 'gradient');
  await expect(workspace).not.toHaveCSS('background-image', 'none');
  const surfaces = composition.locator('[data-composition-surface]');
  await expect(surfaces.first()).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(surfaces.first()).toHaveCSS('backdrop-filter', 'none');
  await expect(surfaces.last()).not.toHaveCSS('backdrop-filter', 'none');

  await page.goto('/?lang=en#foundation-layout-shape', { waitUntil: 'domcontentloaded' });
  const geometry = page.locator('[data-design-lab-region="specimen"]#foundation-layout-shape');
  for (const preview of ['space', 'radius', 'border']) {
    await expect(geometry.locator(`[data-token-preview="${preview}"]`).first()).toBeVisible();
  }
  await expect(geometry.locator('[data-token-preview="layout"]')).toHaveCount(0);
  await expect(geometry.locator('#spacing-alias, #radius-alias, #border-style')).toHaveCount(0);

  await page.goto('/frame?theme=light&lang=en#composition-standard-mode', {
    waitUntil: 'domcontentloaded',
  });
  await expect(
    page.locator('#composition-standard-mode .playground-material-backdrop'),
  ).toHaveCount(0);
  await expect(page.locator('#composition-reading')).toBeVisible();
  await expect(page.locator('#composition-control-cluster')).toBeVisible();
  await expect(page.locator('#composition-floating-toolbar')).toBeVisible();
  await expect(page.locator('#composition-project-card').getByRole('progressbar')).toBeVisible();
  const docsMode = page.locator('#composition-docs-toolbar').getByRole('radiogroup');
  await docsMode.getByRole('radio', { name: 'Preview' }).press('Space');
  await expect(docsMode.getByRole('radio', { name: 'Preview' })).toBeChecked();
  await expect(page.locator('[data-specimen-control="preset"]')).toHaveCount(0);

  await page.goto('/frame?theme=light&lang=en#foundation-layout-shape', {
    waitUntil: 'domcontentloaded',
  });
  for (const id of ['spacing-alias', 'radius-alias', 'border-style']) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  await expect(page.locator('[data-token-preview="layout"]').first()).toBeVisible();
});

test('a modal stays centred in the viewport after the page scrolls', async ({ page }) => {
  await page.goto('/frame?theme=light&lang=en#overlays-dialog', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-dialog-open]').click();
  const dialog = page.locator('dialog.ui-dialog');
  await expect(dialog).toBeVisible();

  await expect
    .poll(() =>
      dialog.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return Math.max(
          Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2),
          Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2),
        );
      }),
    )
    .toBeLessThan(1);
});

test('the Disclosure specimen uses the reading measure in the Design Lab', async ({ page }) => {
  await page.goto('/?theme=light&lang=en#data-display-disclosure', {
    waitUntil: 'domcontentloaded',
  });
  const disclosure = page.locator('[data-design-lab-region="specimen"] .ui-disclosure');
  await expect(disclosure).toBeVisible();
  const geometry = await page.evaluate(() => {
    const stage = document.querySelector('.playground-stage__specimen-content');
    const specimen = document.querySelector('[data-design-lab-region="specimen"] .ui-disclosure');
    if (!(stage instanceof HTMLElement) || !(specimen instanceof HTMLElement)) {
      throw new Error('The specimen stage is missing');
    }
    return {
      stage: stage.getBoundingClientRect().width,
      specimen: specimen.getBoundingClientRect().width,
    };
  });
  expect(geometry.specimen).toBeGreaterThan(300);
});
