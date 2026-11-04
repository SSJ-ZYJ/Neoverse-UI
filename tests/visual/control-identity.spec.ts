import { expect, test } from '@playwright/test';

type SerializedColour = { channels: [number, number, number]; alpha: number };

// Engines may round a nested `color-mix` chain to 8-bit channels while a single
// mix keeps the float alpha, so two equivalent expressions can serialize a few
// ten-thousandths apart. Compare the rendered colour instead of its string.
function parseSerializedColour(value: string): SerializedColour {
  const srgb = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/.exec(value);
  if (srgb) {
    return {
      channels: [Number(srgb[1]), Number(srgb[2]), Number(srgb[3])],
      alpha: srgb[4] === undefined ? 1 : Number(srgb[4]),
    };
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)$/.exec(
    value,
  );
  if (rgb) {
    return {
      channels: [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255],
      alpha: rgb[4] === undefined ? 1 : Number(rgb[4]),
    };
  }
  throw new Error(`Unsupported colour serialization: ${value}`);
}

function expectSameColour(actual: string, expected: string) {
  const rendered = parseSerializedColour(actual);
  const reference = parseSerializedColour(expected);
  expect(rendered.channels.map((channel) => Math.round(channel * 255))).toEqual(
    reference.channels.map((channel) => Math.round(channel * 255)),
  );
  // The alpha still has to hold the intended composition; only the arithmetic
  // path may differ, and it never moves by more than one 8-bit step.
  expect(Math.abs(rendered.alpha - reference.alpha)).toBeLessThanOrEqual(1 / 255);
}

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

// Legacy Dock sizing, Glass tiers and filled-button optical assertions were
// superseded by dock-language-proportions, dock-consumer-size, button-glass,
// and glass-dark-visibility. Keep interaction-specific contracts here.
for (const theme of ['light', 'dark'] as const) {
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
    const selectionEdge = () =>
      slider.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          content: getComputedStyle(element, '::before').content,
          borderColor: style.borderTopColor,
          borderStyle: style.borderTopStyle,
          borderWidth: style.borderTopWidth,
        };
      });
    const edge = await selectionEdge();
    expect(['none', 'normal']).toContain(edge.content);
    if (theme === 'light') {
      const releaseBorder = await slider.evaluate((element) => {
        const reference = document.createElement('span');
        reference.style.borderTopColor =
          'color-mix(in srgb, rgb(116 186 229 / 48%) 34%, transparent)';
        element.append(reference);
        const color = getComputedStyle(reference).borderTopColor;
        reference.remove();
        return color;
      });
      expectSameColour(edge.borderColor, releaseBorder);
      expect(edge.borderStyle).toBe('solid');
      expect(edge.borderWidth).toBe('1px');
    }
    const base = await group.evaluate((element) => ({
      fill: getComputedStyle(element).backgroundColor,
      filter: getComputedStyle(element).backdropFilter,
    }));
    await group.getByRole('radio', { name: 'Two', exact: true }).click();
    expect(await selectionEdge()).toEqual(edge);
    expect(
      await group.evaluate((element) => ({
        fill: getComputedStyle(element).backgroundColor,
        filter: getComputedStyle(element).backdropFilter,
      })),
    ).toEqual(base);
  });
}
