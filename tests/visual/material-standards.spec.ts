import { expect, test } from '@playwright/test';
import { readMaterialFilter } from './material-observation';

const tiers = [
  { surface: 'glass-subtle', blur: '12px', alpha: 0.15 },
  { surface: 'glass-elevated', blur: '18px', alpha: 0.2 },
  { surface: 'glass-immersive', blur: '24px', alpha: 0.3 },
] as const;

for (const framework of ['vue', 'react'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${framework} ${theme}: tier fill and compact button sampling support isolated overrides`, async ({
      page,
    }) => {
      await page.goto(
        framework === 'vue'
          ? `/frame?theme=${theme}&lang=en#controls`
          : `/react-fixture?theme=${theme}&lang=en&contract-fixtures`,
        { waitUntil: 'domcontentloaded' },
      );
      if (framework === 'react') {
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expect(page.locator('html')).toHaveCSS('color-scheme', theme);
      }
      for (const tier of tiers) {
        const button =
          framework === 'vue'
            ? page.locator(`#controls-button .ui-button[data-surface="${tier.surface}"]`).first()
            : page.locator(`[data-tier-button="${tier.surface}"]`);
        const card =
          framework === 'vue'
            ? page.locator(`#controls-button .ui-card[data-surface="${tier.surface}"]`).first()
            : page.locator(`[data-tier-card="${tier.surface}"]`);
        await expect(button).toBeVisible();
        for (const element of [button, card]) {
          const optics = await element.evaluate((element) => {
            const s = getComputedStyle(element);
            return {
              filter: s.backdropFilter,
              color: s.backgroundColor,
              image: s.backgroundImage,
              opacity: s.opacity,
            };
          });
          const blurScale = element === button && theme === 'dark' ? 0.5 : 1;
          expect(await element.evaluate(readMaterialFilter)).toContain(
            `blur(${parseFloat(tier.blur) * blurScale}px)`,
          );
          expect(optics.image).toBe('none');
          expect(optics.opacity).toBe('1');
          expect(alpha(optics.color)).toBeCloseTo(tier.alpha, 3);
        }
        const initialCardFilter = await card.evaluate(readMaterialFilter);
        await button.evaluate((element, surface) => {
          (element as HTMLElement).style.setProperty(`--neoverse-material-${surface}-blur`, '16px');
          (element as HTMLElement).style.setProperty(
            `--neoverse-material-${surface}-transparency`,
            '18%',
          );
        }, tier.surface);
        await expect
          .poll(() => button.evaluate(readMaterialFilter))
          .toContain(`blur(${theme === 'dark' ? 8 : 16}px)`);
        await expect
          .poll(async () =>
            alpha(await button.evaluate((element) => getComputedStyle(element).backgroundColor)),
          )
          .toBeCloseTo(0.18, 3);
        expect(await card.evaluate(readMaterialFilter)).toBe(initialCardFilter);
        await button.evaluate((element) => element.removeAttribute('style'));
      }
      if (framework === 'vue') {
        await expect(page.locator('#controls-button [data-material-legend]').first()).toContainText(
          'glass-subtle',
        );
        await expect(page.locator('#controls-button [data-material-legend]').first()).toContainText(
          `${theme === 'dark' ? 6 : 12}px / 15%`,
        );
      }
    });
  }
}

function alpha(color: string): number {
  return Number(
    color.match(/\/\s*([\d.]+)\s*\)/)?.[1] ?? color.match(/rgba\([^)]*,\s*([\d.]+)\)/)?.[1] ?? 1,
  );
}

test('hover and press differ, keep base optics, restore, and activate once', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Mouse hover is desktop-only.');
  await page.goto('/frame?theme=dark&lang=en#controls', { waitUntil: 'domcontentloaded' });
  const button = page.getByRole('button', { name: /Interaction ·/ });
  await button.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const read = async () => {
    const optics = await button.evaluate((element) => {
      const s = getComputedStyle(element);
      return {
        fill: s.backgroundColor,
        filter: s.backdropFilter,
        glow: getComputedStyle(element, '::after').opacity,
      };
    });
    return { ...optics, filter: await button.evaluate(readMaterialFilter) };
  };
  const rest = await read();
  await button.hover();
  await expect.poll(async () => (await read()).glow).toBe('0.3');
  const hover = await read();
  expect(hover.fill).toBe(rest.fill);
  expect(hover.filter).toBe(rest.filter);
  await page.mouse.down();
  await expect.poll(async () => (await read()).glow).toBe('1');
  expect((await read()).fill).toBe(rest.fill);
  expect((await read()).filter).toBe(rest.filter);
  await page.mouse.up();
  await expect(button).toHaveText('Interaction · 1');
  await expect.poll(async () => (await read()).glow).toBe('0.3');
  await page.mouse.move(0, 0);
  await expect.poll(async () => (await read()).glow).toBe('0');
  await button.focus();
  await page.keyboard.press('Space');
  await expect(button).toHaveText('Interaction · 2');
  await page.keyboard.press('Enter');
  await expect(button).toHaveText('Interaction · 3');
  await button.hover();
  await page.mouse.down();
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await expect(button).toHaveText('Interaction · 3');
  await expect.poll(async () => (await read()).glow).toBe('0');
});

test('disabled and loading retain their plate and reject native and link activation', async ({
  page,
}) => {
  await page.goto('/frame?theme=light&lang=en#controls', { waitUntil: 'domcontentloaded' });
  for (const selector of [
    '#controls-button .ui-button:disabled:not([aria-busy="true"])',
    '#controls-button .ui-button[aria-busy="true"]',
  ]) {
    const element = page.locator(selector).first();
    await expect(element).toBeDisabled();
    expect(await element.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
    expect(
      alpha(await element.evaluate((element) => getComputedStyle(element).backgroundColor)),
    ).toBeCloseTo(0.15, 3);
    await element.hover({ force: true });
    expect(await element.evaluate((element) => getComputedStyle(element, '::after').opacity)).toBe(
      '0',
    );
  }
  await page.goto('/react-fixture?theme=light&lang=en&contract-fixtures');
  const link = page.locator('[data-disabled-action]');
  await expect(link).toHaveAttribute('aria-disabled', 'true');
  await expect(link).not.toHaveAttribute('href');
  await link.evaluate((element) => (element as HTMLElement).click());
  await expect(page.locator('[data-react-adapter="UiButton"]')).toContainText('Count 0');
  await link.hover({ force: true });
  expect(await link.evaluate((element) => getComputedStyle(element, '::after').opacity)).toBe('0');
});

test('touch cancellation clears press and does not activate', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Uses Chromium touch emulation.');
  await page.goto('/frame?theme=dark&lang=en#controls');
  const button = page.getByRole('button', { name: /Interaction ·/ });
  await button.scrollIntoViewIfNeeded();
  const rect = await button.boundingBox();
  if (!rect) throw new Error('Missing interaction button');
  const session = await page.context().newCDPSession(page);
  const points = [{ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }];
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points });
  await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect(button).toHaveText('Interaction · 0');
  await expect
    .poll(() => button.evaluate((element) => getComputedStyle(element, '::after').opacity))
    .toBe('0');
  await button.tap();
  await expect(button).toHaveText('Interaction · 1');
  await expect
    .poll(() => button.evaluate((element) => getComputedStyle(element, '::after').opacity))
    .toBe('0');
  await session.detach();
});

test('opaque fallback preserves ghost semantics and stops backdrop sampling', async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  });
  await page.goto('/frame?theme=dark&lang=en#controls');
  for (const tier of tiers) {
    const button = page
      .locator(`#controls-button .ui-button[data-surface="${tier.surface}"]`)
      .first();
    expect(await button.evaluate((element) => getComputedStyle(element).backdropFilter)).toBe(
      'none',
    );
    expect(
      alpha(await button.evaluate((element) => getComputedStyle(element).backgroundColor)),
    ).toBe(1);
  }
  const ghost = page.locator('#controls-button .ui-button--ghost').first();
  expect(alpha(await ghost.evaluate((element) => getComputedStyle(element).backgroundColor))).toBe(
    0,
  );
  await session.detach();
});

for (const framework of ['vue', 'react'] as const) {
  test(`${framework}: inset controls share optics through readonly, focus, subtree and global overrides`, async ({
    page,
  }) => {
    await page.goto(
      framework === 'vue'
        ? '/frame?theme=dark&lang=en#forms'
        : '/react-fixture?theme=dark&lang=en&contract-fixtures',
    );
    const input = page.locator('.ui-input:not(:disabled):not([readonly])').first();
    const textarea = page.locator('.ui-textarea:not(:disabled):not([readonly])').first();
    const read = (element: typeof input) =>
      element.evaluate((element) => {
        const s = getComputedStyle(element);
        return {
          fill: s.backgroundColor,
          filter: s.backdropFilter,
          opacity: s.opacity,
          outline: s.outlineStyle,
        };
      });
    for (const control of [input, textarea]) {
      await expect(control).toBeVisible();
      const rest = await read(control);
      expect(rest.filter).toContain('blur(12px)');
      expect(alpha(rest.fill)).toBeCloseTo(0.15, 3);
      await control.focus();
      expect((await read(control)).fill).toBe(rest.fill);
      expect((await read(control)).filter).toBe(rest.filter);
    }
    const readonly = page.locator('.ui-input[readonly]').first();
    await readonly.focus();
    await expect(readonly).toBeFocused();
    const value = await readonly.inputValue();
    await page.keyboard.type('ignored');
    await expect(readonly).toHaveValue(value);
    expect(alpha((await read(readonly)).fill)).toBeCloseTo(0.15, 3);
    await input.evaluate((element) => {
      element.parentElement?.style.setProperty('--neoverse-material-glass-subtle-blur', '17px');
      element.parentElement?.style.setProperty(
        '--neoverse-material-glass-subtle-transparency',
        '22%',
      );
    });
    expect((await read(input)).filter).toContain('blur(17px)');
    await expect.poll(async () => alpha((await read(input)).fill)).toBeCloseTo(0.22, 3);
    expect((await read(textarea)).filter).toContain('blur(12px)');
    await input.evaluate((element) => {
      element.parentElement?.style.removeProperty('--neoverse-material-glass-subtle-blur');
      element.parentElement?.style.removeProperty('--neoverse-material-glass-subtle-transparency');
      document.documentElement.style.setProperty('--neoverse-material-glass-subtle-blur', '14px');
      document.documentElement.style.setProperty(
        '--neoverse-material-glass-subtle-transparency',
        '19%',
      );
    });
    for (const control of [input, textarea, readonly]) {
      expect((await read(control)).filter).toContain('blur(14px)');
      await expect.poll(async () => alpha((await read(control)).fill)).toBeCloseTo(0.19, 3);
    }
  });
}

test('selected segments keep their plate and still express press and keyboard selection', async ({
  page,
}, testInfo) => {
  await page.goto('/frame?theme=dark&lang=en#controls');
  for (const tier of tiers) {
    const group = page.locator(
      `#controls-button .ui-segmented-control[data-surface="${tier.surface}"]`,
    );
    await expect(group).toBeVisible();
    expect(await group.evaluate((element) => getComputedStyle(element).backdropFilter)).toContain(
      `blur(${tier.blur})`,
    );
    const selected = group.locator('.ui-segmented-control__option--active');
    await expect(selected).toHaveText('One');
    if (testInfo.project.name === 'desktop') {
      await selected.hover();
      await page.mouse.down();
      await expect
        .poll(() => selected.evaluate((element) => getComputedStyle(element).transform))
        .toContain('0.97');
      expect(
        alpha(await group.evaluate((element) => getComputedStyle(element).backgroundColor)),
      ).toBeCloseTo(tier.alpha, 3);
      await page.mouse.up();
      await expect
        .poll(() => selected.evaluate((element) => getComputedStyle(element).transform))
        .toBe('none');
    }
    await selected.focus();
    await page.keyboard.press('ArrowRight');
    await expect(group.locator('.ui-segmented-control__option--active')).toHaveText('Two');
    await page.keyboard.press('ArrowLeft');
    await expect(group.locator('.ui-segmented-control__option--active')).toHaveText('One');
  }
});

test('table cell and disclosure share the inset tier without stacking or densifying on open', async ({
  page,
}) => {
  await page.goto('/frame?theme=light&lang=en#data-display');
  const table = page.locator('.ui-table').first();
  const cell = table.locator('tbody td').first();
  const disclosure = page.locator('.ui-disclosure').first();
  for (const plane of [cell, disclosure]) {
    expect(await plane.evaluate((element) => getComputedStyle(element).backdropFilter)).toContain(
      'blur(12px)',
    );
    expect(
      alpha(await plane.evaluate((element) => getComputedStyle(element).backgroundColor)),
    ).toBeCloseTo(0.15, 3);
  }
  await disclosure.locator('summary').click();
  expect(
    alpha(await disclosure.evaluate((element) => getComputedStyle(element).backgroundColor)),
  ).toBeCloseTo(0.15, 3);
  await table.evaluate((element) => {
    (element as HTMLElement).style.setProperty('--neoverse-material-glass-subtle-blur', '16px');
    (element as HTMLElement).style.setProperty(
      '--neoverse-material-glass-subtle-transparency',
      '18%',
    );
  });
  for (const plane of [table.locator('th').first(), cell]) {
    expect(await plane.evaluate((element) => getComputedStyle(element).backdropFilter)).toContain(
      'blur(16px)',
    );
    await expect
      .poll(async () =>
        alpha(await plane.evaluate((element) => getComputedStyle(element).backgroundColor)),
      )
      .toBeCloseTo(0.18, 3);
  }
});

test('Playground customization updates real optics and computed annotations, then resets', async ({
  page,
}) => {
  await page.goto('/frame?theme=light&lang=en#controls');
  const preview = page.locator('[data-material-custom-preview]');
  const resetButton = page.getByRole('button', { name: 'Reset to standard' });
  const referenceGhost = page
    .getByRole('article', { name: 'Surface ownership' })
    .getByRole('button', { name: 'Ghost', exact: true });
  const resetForeground = await resetButton.evaluate((button) => getComputedStyle(button).color);
  const ghostForeground = await referenceGhost.evaluate((button) => getComputedStyle(button).color);
  expect(resetForeground).toBe(ghostForeground);
  await page.locator('[data-custom-blur]').fill('21');
  await page.locator('[data-custom-alpha]').fill('27');
  for (const plane of [preview.locator('.ui-button'), preview.locator('.ui-card')]) {
    await expect.poll(() => plane.evaluate(readMaterialFilter)).toContain('blur(21px)');
    await expect
      .poll(async () =>
        alpha(await plane.evaluate((element) => getComputedStyle(element).backgroundColor)),
      )
      .toBeCloseTo(0.27, 3);
  }
  await expect(
    page
      .locator('[data-specimen-preview]')
      .filter({ has: preview })
      .locator('[data-material-legend]'),
  ).toContainText('21px / 27%');
  await expect(
    page
      .locator('[data-specimen-preview]')
      .filter({ has: preview })
      .locator('[data-material-legend]'),
  ).toContainText('Custom');
  await page.getByRole('button', { name: 'Reset to standard' }).click();
  await expect
    .poll(() => preview.locator('.ui-card').evaluate(readMaterialFilter))
    .toContain('blur(18px)');
  await expect
    .poll(async () =>
      alpha(
        await preview
          .locator('.ui-card')
          .evaluate((element) => getComputedStyle(element).backgroundColor),
      ),
    )
    .toBeCloseTo(0.2, 3);
});

for (const framework of ['vue', 'react'] as const) {
  test(`${framework}: select panel owns Standard glass while selected items press independently`, async ({
    page,
  }, testInfo) => {
    await page.goto(
      framework === 'vue'
        ? '/frame?theme=dark&lang=en#forms'
        : '/react-fixture?theme=dark&lang=en&contract-fixtures',
    );
    const trigger = page
      .locator('.ui-select:not([aria-disabled="true"]):not([aria-readonly="true"])')
      .first();
    await trigger.click();
    const panel = trigger.locator('xpath=..').locator('.ui-select__popover');
    await expect(panel).toBeVisible();
    const read = () =>
      panel.evaluate((element) => ({
        fill: getComputedStyle(element).backgroundColor,
        filter: getComputedStyle(element).backdropFilter,
      }));
    const rest = await read();
    expect(await panel.evaluate(readMaterialFilter)).toContain('blur(18px)');
    expect(alpha(rest.fill)).toBeCloseTo(0.2, 3);
    if (testInfo.project.name === 'desktop') {
      const selected = panel.locator('.ui-select__option[aria-selected="true"]');
      await selected.hover();
      expect(await read()).toEqual(rest);
      await page.mouse.down();
      await expect
        .poll(async () =>
          alpha(await selected.evaluate((element) => getComputedStyle(element).backgroundColor)),
        )
        .toBeCloseTo(0.1, 3);
      expect(await read()).toEqual(rest);
      await page.mouse.up();
      await expect(panel).toBeHidden();
    }
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });
}

test('opaque and reduced-motion form fallbacks retain readonly focus without backdrop sampling', async ({
  page,
}) => {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-reduced-transparency', value: 'reduce' },
      { name: 'prefers-reduced-motion', value: 'reduce' },
    ],
  });
  await page.goto('/frame?theme=light&lang=en#forms');
  for (const control of [
    page.locator('.ui-input').first(),
    page.locator('.ui-textarea').first(),
    page.locator('.ui-select').first(),
  ]) {
    expect(await control.evaluate((element) => getComputedStyle(element).backdropFilter)).toBe(
      'none',
    );
    expect(
      alpha(await control.evaluate((element) => getComputedStyle(element).backgroundColor)),
    ).toBe(1);
    expect(await control.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe(
      '0s',
    );
  }
  const readonly = page.locator('.ui-input[readonly]').first();
  await readonly.focus();
  await expect(readonly).toBeFocused();
  await session.detach();
});

test('choice and Notice retain Light optics, state tint and opaque accessibility fallbacks', async ({
  page,
}) => {
  await page.goto('/frame?theme=dark&lang=en#forms');
  const choice = page.locator('.ui-radio input:not(:checked) + .ui-choice__control').first();
  const selected = page.locator('.ui-checkbox input:checked + .ui-choice__control').first();
  await expect(selected).toHaveCSS('background-image', /linear-gradient/);
  expect(await choice.evaluate((element) => getComputedStyle(element).backdropFilter)).toContain(
    'blur(12px)',
  );
  expect(
    alpha(await choice.evaluate((element) => getComputedStyle(element).backgroundColor)),
  ).toBeCloseTo(0.15, 3);
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  });
  expect(await choice.evaluate((element) => getComputedStyle(element).backdropFilter)).toBe('none');
  await expect(selected).toHaveCSS('background-image', /linear-gradient/);
  await expect
    .poll(async () =>
      alpha(await choice.evaluate((element) => getComputedStyle(element).backgroundColor)),
    )
    .toBe(1);
  await page.goto('/frame?theme=dark&lang=en#status-feedback');
  for (const notice of await page.locator('.ui-notice').all()) {
    expect(await notice.evaluate((element) => getComputedStyle(element).backdropFilter)).toBe(
      'none',
    );
    expect(
      alpha(await notice.evaluate((element) => getComputedStyle(element).backgroundColor)),
    ).toBe(1);
  }
  await session.send('Emulation.setEmulatedMedia', { features: [] });
  for (const notice of await page.locator('.ui-notice').all()) {
    expect(await notice.evaluate((element) => getComputedStyle(element).backdropFilter)).toContain(
      'blur(12px)',
    );
    await expect
      .poll(async () =>
        alpha(await notice.evaluate((element) => getComputedStyle(element).backgroundColor)),
      )
      .toBeCloseTo(0.15, 3);
  }
  await session.detach();
});
