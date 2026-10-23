import { expect, test } from '@playwright/test';
import componentMatrix from '../../contracts/component-matrix.json' with { type: 'json' };
import { presenceVariants } from '../../packages/motion/src/index';

for (const theme of ['light', 'dark'] as const) {
  for (const width of [390, 1024]) {
    test(`drawer scrim dims only outside the sidebar at ${width}px in ${theme} theme`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`/?theme=${theme}&lang=en#materials`, { waitUntil: 'domcontentloaded' });

      const navigation = page.locator('#design-lab-navigation');
      const trigger = page.locator('[data-playground-nav-trigger]');
      const dismissLayer = page.locator('.playground-shell > button');
      const readMaterial = () =>
        navigation.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            background: style.backgroundColor,
            filter: style.backdropFilter,
            opacity: style.opacity,
          };
        });
      const restingMaterial = await readMaterial();

      await trigger.click();
      await expect(dismissLayer).toBeVisible();
      await expect(dismissLayer).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      await expect(dismissLayer).toHaveCSS('backdrop-filter', 'none');
      await expect(dismissLayer).toHaveCSS('filter', 'none');
      expect(await readMaterial()).toEqual(restingMaterial);

      const shell = page.locator('.playground-shell');
      await expect
        .poll(() => shell.evaluate((element) => getComputedStyle(element, '::after').opacity))
        .toBe('1');
      const scrim = await shell.evaluate((element) => {
        const style = getComputedStyle(element, '::after');
        const drawer = element.querySelector<HTMLElement>('#design-lab-navigation');
        if (!drawer) throw new Error('Navigation is missing');
        const bounds = drawer.getBoundingClientRect();
        return {
          shadow: style.boxShadow,
          pointerEvents: style.pointerEvents,
          inset: Number.parseFloat(style.left),
          width: Number.parseFloat(style.width),
          radius: style.borderTopLeftRadius,
          drawerRadius: getComputedStyle(drawer).borderTopLeftRadius,
          bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
        };
      });
      expect(scrim.shadow).not.toBe('none');
      expect(scrim.pointerEvents).toBe('none');
      expect(scrim.inset).toBeCloseTo(scrim.bounds.x, 1);
      expect(scrim.width).toBeCloseTo(scrim.bounds.width, 1);
      expect(scrim.radius).toBe(scrim.drawerRadius);

      // Compare actual pixels with and without the scrim in the same open state.
      // This catches dark backdrop sampling even when the Glass tokens stay unchanged.
      const dimmed = await page.screenshot({ animations: 'disabled' });
      const noScrim = await page.addStyleTag({
        content: '.playground-shell::after { visibility: hidden; }',
      });
      const undimmed = await page.screenshot({ animations: 'disabled' });
      await noScrim.evaluate((element) => (element as HTMLElement).remove());
      const samples = await page.evaluate(
        async ({ dimmed, undimmed, bounds, width }) => {
          const sample = async (source: string) => {
            const image = new Image();
            image.src = `data:image/png;base64,${source}`;
            await image.decode();
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Pixel sampling context is unavailable');
            context.drawImage(image, 0, 0);
            const brightness = (x: number, y: number) => {
              const { data } = context.getImageData(Math.floor(x), Math.floor(y), 8, 8);
              let total = 0;
              for (let i = 0; i < data.length; i += 4) {
                total += (data[i] ?? 0) + (data[i + 1] ?? 0) + (data[i + 2] ?? 0);
              }
              return total / (8 * 8 * 3);
            };
            return {
              sidebar: brightness(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2),
              outside: brightness(width - 20, 422),
            };
          };
          return { dimmed: await sample(dimmed), undimmed: await sample(undimmed) };
        },
        {
          dimmed: dimmed.toString('base64'),
          undimmed: undimmed.toString('base64'),
          bounds: scrim.bounds,
          width,
        },
      );
      expect(Math.abs(samples.dimmed.sidebar - samples.undimmed.sidebar)).toBeLessThan(1);
      expect(samples.dimmed.outside).toBeLessThan(samples.undimmed.outside - 1);

      await dismissLayer.click({ position: { x: width - 2, y: 422 } });
      await expect(navigation).toHaveAttribute('inert', '');
      await expect(trigger).toBeFocused();
      await expect(dismissLayer).toHaveCount(0);

      await trigger.click();
      await page.keyboard.press('Escape');
      await expect(navigation).toHaveAttribute('inert', '');
      await expect(trigger).toBeFocused();
      await expect(dismissLayer).toHaveCount(0);
    });
  }
}

test('closed mobile navigation is inert and restores focus to its trigger', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=en', { waitUntil: 'domcontentloaded' });

  const navigation = page.locator('#design-lab-navigation');
  const trigger = page.locator('[data-playground-nav-trigger]');
  await expect(trigger).toBeVisible();
  expect(await navigation.evaluate((element) => (element as HTMLElement).inert)).toBe(true);

  await trigger.click();
  expect(await navigation.evaluate((element) => (element as HTMLElement).inert)).toBe(false);
  expect(await navigation.evaluate((element) => element.contains(document.activeElement))).toBe(
    true,
  );
  await expect
    .poll(() => navigation.evaluate((element) => element.getBoundingClientRect().left))
    .toBeGreaterThan(0);
  const drawerMetrics = await navigation.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      rightGap: document.documentElement.clientWidth - rect.right,
      bottomGap: document.documentElement.clientHeight - rect.bottom,
      radius: Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
    };
  });
  expect(drawerMetrics.left).toBeGreaterThan(0);
  expect(drawerMetrics.top).toBeGreaterThan(0);
  expect(drawerMetrics.rightGap).toBeGreaterThan(0);
  expect(drawerMetrics.bottomGap).toBeGreaterThan(0);
  expect(drawerMetrics.radius).toBeGreaterThan(0);

  await page.keyboard.press('Escape');
  expect(await navigation.evaluate((element) => (element as HTMLElement).inert)).toBe(true);
  await expect
    .poll(() => trigger.evaluate((element) => document.activeElement === element))
    .toBe(true);
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

test('isolated scrollbar fixture renders the real UiScrollbar overlay', async ({ page }) => {
  await page.goto('/frame?theme=light&lang=en#scrollbar-component', {
    waitUntil: 'domcontentloaded',
  });

  const scrollbar = page.locator('[data-ui-scrollbar-fixture]');
  await expect(scrollbar).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(
    await page.evaluate(() => window.innerHeight),
  );

  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight }));
  await expect.poll(() => scrollbar.getAttribute('data-visible')).toBe('true');
});

test('React runtime fixture renders every runtime-validated adapter and updates real DOM state', async ({
  page,
}) => {
  await page.goto('/react-fixture?lang=en&contract-fixtures', { waitUntil: 'domcontentloaded' });

  const runtimeValidatedAdapters = componentMatrix.components
    .filter((component) => component.runtime === 'validated')
    .map((component) => component.name);
  const canonicalAdapters = componentMatrix.components
    .filter((component) => component.track === 'canonical-shared')
    .map((component) => component.name);

  const adapters = page.locator('[data-react-adapter]');
  await expect(adapters).toHaveCount(runtimeValidatedAdapters.length);
  expect(
    await adapters.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-react-adapter')).sort(),
    ),
  ).toEqual([...runtimeValidatedAdapters].sort());
  for (const adapter of runtimeValidatedAdapters) {
    const specimen = page.locator(`[data-react-adapter="${adapter}"]`);
    if (adapter === 'UiScrollbar') {
      // Auto-hidden until scroll activity; mounting is the initial runtime contract.
      await expect(specimen).toBeAttached();
      await expect(specimen).toHaveAttribute('aria-hidden', 'true');
      await expect(specimen).toHaveAttribute('data-visible', 'false');
    } else {
      await expect(specimen).toBeVisible();
    }
  }
  expect(runtimeValidatedAdapters).toEqual(expect.arrayContaining(canonicalAdapters));

  const button = page.locator('[data-react-adapter="UiButton"]');
  await expect(button).toContainText('Count 0');
  await button.click();
  await expect(button).toContainText('Count 1');
  await expect(page.locator('[data-react-count]')).toContainText('Count 1');
  await expect(button).toHaveClass(/ui-button/);

  const action = page.locator('[data-react-adapter="UiAction"]');
  await expect(action).toHaveAttribute('href', '#react-runtime-fixture');

  const iconButton = page.locator('[data-react-adapter="UiIconButton"]');
  await expect(iconButton).toHaveAttribute('aria-label', 'Increase count');

  const popoverAdapter = page.locator('[data-react-adapter="UiPopover"]');
  const popoverTrigger = popoverAdapter.locator('.ui-popover__trigger');
  const popoverPanel = popoverAdapter.locator('.ui-popover__content');
  await popoverTrigger.click();
  await expect(popoverPanel).toBeVisible();
  await expect(popoverPanel).toHaveAttribute('role', 'dialog');
  await page.keyboard.press('Escape');
  await expect(popoverPanel).toBeHidden();
  await expect(popoverTrigger).toBeFocused();

  const dropdownAdapter = page.locator('[data-react-adapter="UiDropdownMenu"]');
  const dropdownTrigger = dropdownAdapter.locator('.ui-dropdown-menu__trigger');
  const dropdownPanel = dropdownAdapter.locator('.ui-dropdown-menu__panel');
  await dropdownTrigger.click();
  await expect(dropdownPanel).toBeVisible();
  const runtimeMenuItems = dropdownPanel.getByRole('menuitem');
  await expect(runtimeMenuItems.first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(runtimeMenuItems.nth(1)).toBeFocused();
  await runtimeMenuItems.nth(1).click();
  await expect(page.locator('[data-react-overlay-state]')).toHaveText('archive');
  await expect(dropdownPanel).toBeHidden();
  await expect(dropdownTrigger).toBeFocused();

  const email = page.locator('[data-react-adapter="UiInput"]');
  await expect(page.locator('label[for="react-runtime-email"]')).toHaveText('Notification email');
  await email.fill('contracts@neoverse.dev');
  await expect(page.locator('[data-react-form-state]')).toContainText('contracts@neoverse.dev');

  const textarea = page.locator('[data-react-adapter="UiTextarea"]');
  await textarea.fill('Runtime DOM updated');
  await expect(page.locator('[data-react-form-state]')).toContainText('Runtime DOM updated');

  const select = page.locator('[data-react-adapter="UiSelect"]');
  await expect(select).toHaveRole('combobox');
  await expect(select).toHaveAttribute('aria-expanded', 'false');
  await select.click();
  await expect(select).toHaveAttribute('aria-expanded', 'true');
  const nativeOption = page.getByRole('option', { name: 'Native' });
  const remoteOption = page.getByRole('option', { name: 'Remote' });
  await expect(remoteOption).toBeVisible();
  await nativeOption.focus();
  await page.keyboard.press('ArrowDown');
  await expect(remoteOption).toBeFocused();
  await page.keyboard.press('Home');
  await expect(nativeOption).toBeFocused();
  await page.keyboard.press('End');
  await expect(remoteOption).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(remoteOption).toBeHidden();
  await expect(select).toBeFocused();
  await expect(select).toHaveAttribute('aria-expanded', 'false');
  await select.click();
  await remoteOption.click();
  await expect(page.locator('[data-react-form-state]')).toContainText('remote');
  await expect(select).toHaveAttribute('aria-expanded', 'false');

  const checkbox = page.locator('[data-react-adapter="UiCheckbox"]');
  await checkbox.locator('.ui-checkbox').click();
  await expect(page.locator('[data-react-form-state]')).toContainText('false');

  const previewRadio = page.getByRole('radio', { name: 'Preview' });
  await previewRadio.click();
  await expect(previewRadio).toBeChecked();
  await expect(page.locator('[data-react-form-state]')).toContainText('preview');

  const runtimeSwitch = page.getByRole('switch', { name: 'Automatic synchronization' });
  await expect(runtimeSwitch).toBeChecked();
  await expect(runtimeSwitch).not.toHaveAttribute('aria-checked');
  await page.locator('[data-react-adapter="UiSwitch"] .ui-switch').click();
  await expect(runtimeSwitch).not.toBeChecked();
  await expect(runtimeSwitch).not.toHaveAttribute('aria-checked');

  const table = page.locator('[data-react-adapter="UiTable"]');
  await expect(table).toHaveRole('table');
  await expect(table.locator('caption')).toHaveText('Runtime component state');
  await expect(table.getByRole('columnheader')).toHaveCount(2);

  const disclosure = page.locator('[data-react-adapter="UiDisclosure"]');
  await expect(disclosure).not.toHaveAttribute('open', '');
  await disclosure.locator('summary').click();
  await expect(disclosure).toHaveAttribute('open', '');

  const presence = page.locator('[data-react-adapter="UiPresence"]');
  await expect(presence).toBeVisible();
  const presenceToggle = page.locator('[data-react-presence-toggle]');
  await presenceToggle.click();
  await expect(presence).toHaveCount(0);
  await presenceToggle.click();
  await expect(page.locator('[data-react-adapter="UiPresence"]')).toBeVisible();
});

test('Vue Select keeps the shared combobox and option keyboard contract', async ({ page }) => {
  await page.goto('/frame?theme=light&lang=en#forms', { waitUntil: 'domcontentloaded' });

  const select = page.locator('#forms-select [data-form-select]');
  const shell = select.locator('xpath=..');
  await expect(select).toHaveRole('combobox');
  await expect(select).toHaveAttribute('aria-expanded', 'false');

  await select.click();
  await expect(select).toHaveAttribute('aria-expanded', 'true');

  const options = shell.getByRole('option');
  await expect(options).toHaveCount(2);
  await options.first().focus();
  await page.keyboard.press('ArrowDown');
  await expect(options.nth(1)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(options.first()).toBeFocused();
  await page.keyboard.press('End');
  await expect(options.last()).toBeFocused();
  await page.keyboard.press('Escape');

  await expect(options.first()).toBeHidden();
  await expect(select).toBeFocused();
  await expect(select).toHaveAttribute('aria-expanded', 'false');
});

test('Vue overlay primitives share top-layer positioning, light dismiss, keyboard focus, and menu navigation', async ({
  page,
}) => {
  await page.goto('/frame?theme=light&lang=en#controls', { waitUntil: 'domcontentloaded' });

  const section = page.locator('#controls-overlays');
  await expect(section).toBeVisible();

  const popover = section.locator('[data-overlay-popover]');
  const popoverTrigger = popover.locator('.ui-popover__trigger');
  const popoverPanel = popover.locator('.ui-popover__content');
  await popoverTrigger.click();
  await expect(popoverPanel).toBeVisible();

  const geometry = await popoverPanel.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      position: style.position,
      backdropFilter: style.backdropFilter,
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  });
  expect(geometry.position).toBe('fixed');
  expect(geometry.backdropFilter).not.toBe('none');
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);

  await page.keyboard.press('Escape');
  await expect(popoverPanel).toBeHidden();
  await expect(popoverTrigger).toBeFocused();

  await popoverTrigger.click();
  await expect(popoverPanel).toBeVisible();
  await page.mouse.click(8, 8);
  await expect(popoverPanel).toBeHidden();

  const dropdown = section.locator('[data-overlay-dropdown]');
  const dropdownTrigger = dropdown.locator('.ui-dropdown-menu__trigger');
  const menu = dropdown.locator('.ui-dropdown-menu__panel');
  await dropdownTrigger.click();
  await expect(menu).toBeVisible();

  const items = menu.getByRole('menuitem');
  await expect(items.first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(items.nth(1)).toBeFocused();
  await page.keyboard.press('End');
  await expect(items.last()).toBeFocused();
  await items.nth(1).click();
  await expect(section.locator('[data-overlay-selection]')).toContainText('archive');
  await expect(menu).toBeHidden();
  await expect(dropdownTrigger).toBeFocused();
});

test('motion playground exercises semantic roles and the current presence contract', async ({
  page,
}) => {
  await page.goto('/?lang=en#motion', { waitUntil: 'domcontentloaded' });

  const roleDurations = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      feedback: style.getPropertyValue('--neoverse-motion-feedback-duration').trim(),
      state: style.getPropertyValue('--neoverse-motion-state-duration').trim(),
      spatial: style.getPropertyValue('--neoverse-motion-spatial-duration').trim(),
      enter: style.getPropertyValue('--neoverse-motion-enter-duration').trim(),
      exit: style.getPropertyValue('--neoverse-motion-exit-duration').trim(),
    };
  });
  for (const duration of Object.values(roleDurations)) {
    expect(duration).not.toBe('');
    expect(duration).not.toBe('0ms');
    expect(duration).not.toBe('0s');
  }

  const specimens = page.locator('[data-motion-presence-specimen]');
  await expect(specimens).toHaveCount(presenceVariants.length);
  const renderedVariants = await specimens.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-neoverse-motion')),
  );
  expect(renderedVariants).toEqual([...presenceVariants]);

  const vuePresence = page.locator('[data-motion-presence-adapter="vue"]');
  await expect(vuePresence).toHaveAttribute('data-neoverse-motion', 'veil');
  await expect(vuePresence).toHaveClass(/nv-appear/);

  const staggeredItems = page.locator('[data-motion-presence-group-item]');
  await expect(staggeredItems).toHaveCount(5);
  const staggerDelays = await staggeredItems.evaluateAll((elements) =>
    elements.map((element) =>
      (element as HTMLElement).style.getPropertyValue('--neoverse-motion-enter-delay'),
    ),
  );
  expect(staggerDelays[0]).toBe('');
  expect(staggerDelays.slice(1)).toEqual(['40ms', '80ms', '120ms', '160ms']);

  const toggle = page.locator('[data-motion-presence-toggle]');
  await toggle.click();
  await expect(specimens).toHaveCount(0);
  await expect(vuePresence).toHaveCount(0);

  await toggle.click();
  await expect(specimens).toHaveCount(presenceVariants.length);
  await expect(page.locator('[data-motion-presence-adapter="vue"]')).toBeVisible();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedDurations = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      feedback: style.getPropertyValue('--neoverse-motion-feedback-duration').trim(),
      state: style.getPropertyValue('--neoverse-motion-state-duration').trim(),
      spatial: style.getPropertyValue('--neoverse-motion-spatial-duration').trim(),
      enter: style.getPropertyValue('--neoverse-motion-enter-duration').trim(),
      exit: style.getPropertyValue('--neoverse-motion-exit-duration').trim(),
      particle: style.getPropertyValue('--neoverse-motion-particle-duration').trim(),
    };
  });
  expect(new Set(Object.values(reducedDurations))).toEqual(new Set(['1ms']));
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
          usesSharedDock: dock.classList.contains('ui-dock'),
          documentOverflow:
            document.documentElement.scrollWidth - document.documentElement.clientWidth,
          navigationHeight: activeRect.height,
          navigationFontRatio: navigationFontSize / rootFontSize,
          minimumItemGapRatio: Math.min(...itemGaps) / rootFontSize,
          indicatorContentGap: indicatorRect.top - iconRect.bottom,
          leadingOuterGap: activeRect.left - dockRect.left,
          topOuterGap: activeRect.top - dockRect.top,
          trailingOuterGap: dockRect.right - trailingRect.right,
          optionHeight: optionRect.height,
          trailingInsideDock: trailingRect.right <= dockRect.right + 0.1,
        };
      });

    expect(metrics.usesSharedDock, `viewport ${width}`).toBe(true);
    expect(metrics.documentOverflow, `viewport ${width}`).toBeLessThanOrEqual(0);
    expect(metrics.trailingInsideDock, `viewport ${width}`).toBe(true);
    expect(
      metrics.minimumItemGapRatio,
      `navigation item spacing at viewport ${width}`,
    ).toBeGreaterThanOrEqual(0.2);
    expect(
      metrics.navigationFontRatio,
      `navigation label density at viewport ${width}`,
    ).toBeLessThanOrEqual(1);
    expect(metrics.navigationFontRatio).toBeGreaterThanOrEqual(0.7);
    expect(
      metrics.indicatorContentGap / metrics.navigationHeight,
      `indicator breathing room at viewport ${width}`,
    ).toBeGreaterThanOrEqual(0.13);
    expect(
      Math.abs(metrics.leadingOuterGap - metrics.topOuterGap),
      `leading edge inset balance at viewport ${width}`,
    ).toBeLessThanOrEqual(0.75);
    expect(
      Math.abs(metrics.trailingOuterGap - metrics.topOuterGap),
      `trailing edge inset balance at viewport ${width}`,
    ).toBeLessThanOrEqual(0.75);
    expect(
      metrics.optionHeight / metrics.navigationHeight,
      `segmented option density at viewport ${width}`,
    ).toBeLessThanOrEqual(0.9);
  }
});

test('dock is discoverable as a standalone component specimen', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'This assertion defines the desktop Dock specimen.',
  );

  await page.goto('/?theme=dark&lang=en#dock-component', { waitUntil: 'domcontentloaded' });

  const specimen = page.locator('#dock-component');
  await expect(specimen).toBeVisible();
  const docks = specimen.locator('.ui-dock');
  await expect(docks).toHaveCount(2);
  await expect(docks.first()).toHaveAttribute('data-surface', 'glass-elevated');
  await expect(docks.first()).toHaveClass(/ui-control-surface--scale-md/);
  await expect(docks.nth(1)).toHaveClass(/ui-dock--compact/);
  await expect(docks.nth(1)).toHaveClass(/ui-control-surface--scale-md/);
  await expect(docks.first().locator('.ui-control-surface__group--trailing')).toHaveCount(1);
  await expect(specimen.locator('[data-specimen-state-row]')).toHaveCount(0);

  const geometry = await specimen
    .locator('[data-dock-specimen="standard"] [data-dock-preview]')
    .evaluate((preview) => {
      const dock = preview.querySelector<HTMLElement>('.ui-dock');
      if (dock === null) throw new Error('Standard Dock is missing');
      const previewRect = preview.getBoundingClientRect();
      const dockRect = dock.getBoundingClientRect();
      return {
        previewClientWidth: preview.clientWidth,
        previewScrollWidth: preview.scrollWidth,
        dockWidth: dockRect.width,
        dockInsidePreview:
          dockRect.left >= previewRect.left - 0.1 && dockRect.right <= previewRect.right + 0.1,
        documentOverflow:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

  expect(geometry.previewScrollWidth).toBeLessThanOrEqual(geometry.previewClientWidth + 1);
  expect(geometry.dockWidth).toBeLessThan(geometry.previewClientWidth);
  expect(geometry.dockInsidePreview).toBe(true);
  expect(geometry.documentOverflow).toBeLessThanOrEqual(0);
});

test('state-row previews preserve component proportions inside a dedicated stage', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'This assertion defines desktop specimen geometry.',
  );

  await page.goto('/?theme=dark&lang=zh#controls-navigation-item', {
    waitUntil: 'domcontentloaded',
  });

  const preview = page
    .locator('#controls-navigation-item [data-specimen-state-row] [data-specimen-preview]')
    .first();
  const navigationItem = preview.locator('.ui-navigation-item').first();
  const metrics = await navigationItem.evaluate((element) => {
    const previewContent = element.closest('.playground-specimen-preview__content');
    const stateRow = element.closest<HTMLElement>('[data-specimen-state-row]');
    const copyHeading = stateRow?.querySelector<HTMLElement>('[data-specimen-copy] h3');
    const copyHint = stateRow?.querySelector<HTMLElement>('[data-specimen-copy] p');
    if (!(previewContent instanceof HTMLElement))
      throw new Error('Missing specimen preview content');
    if (!(copyHeading instanceof HTMLElement) || !(copyHint instanceof HTMLElement))
      throw new Error('Missing specimen copy');
    const rect = element.getBoundingClientRect();
    return {
      rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
      copyHeadingFontSize: Number.parseFloat(getComputedStyle(copyHeading).fontSize),
      copyHintFontSize: Number.parseFloat(getComputedStyle(copyHint).fontSize),
      zoom: Number.parseFloat(getComputedStyle(previewContent).zoom),
      stageBackground: getComputedStyle(previewContent.parentElement as HTMLElement)
        .backgroundImage,
      renderedHeight: rect.height,
      cssHeight: Number.parseFloat(getComputedStyle(element).height),
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  expect(metrics.zoom).toBe(1);
  expect(metrics.stageBackground).toContain('radial-gradient');
  expect(metrics.copyHeadingFontSize / metrics.rootFontSize).toBeGreaterThanOrEqual(0.8);
  expect(metrics.copyHeadingFontSize / metrics.rootFontSize).toBeLessThanOrEqual(1);
  expect(metrics.copyHintFontSize / metrics.rootFontSize).toBeGreaterThanOrEqual(0.8);
  expect(metrics.copyHintFontSize / metrics.rootFontSize).toBeLessThan(1);
  expect(metrics.copyHeadingFontSize).toBeGreaterThan(metrics.copyHintFontSize);
  expect(metrics.copyHeadingFontSize / metrics.copyHintFontSize).toBeLessThanOrEqual(1.2);
  expect(metrics.renderedHeight / metrics.cssHeight).toBeCloseTo(metrics.zoom, 1);
  expect(metrics.documentOverflow).toBeLessThanOrEqual(0);

  for (const selector of [
    '#controls-button [data-specimen-preview]',
    '#controls-segmented-control [data-specimen-preview]',
  ]) {
    await expect(page.locator(selector).first()).toBeVisible();
    const zoom = await page
      .locator(`${selector} .playground-specimen-preview__content`)
      .first()
      .evaluate((element) => Number.parseFloat(getComputedStyle(element).zoom));
    expect(zoom).toBeCloseTo(metrics.zoom, 2);
  }
});

test('icon button geometry follows the canonical size selectors', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop component geometry contract.');
  await page.goto('/?theme=light&lang=en#controls-icon-button', {
    waitUntil: 'domcontentloaded',
  });

  const md = page.locator('#controls-icon-button .ui-icon-button--md').first();
  const stretch = page.locator('#controls-button .ui-icon-button--stretch').first();
  const sm = page.locator('#controls-density [data-density-controls] .ui-icon-button--sm').first();
  const smButton = page
    .locator('#controls-density [data-density-controls] .ui-button--sm:not(.ui-icon-button)')
    .first();

  await expect(md).toBeVisible();
  await expect(stretch).toBeVisible();
  await expect(sm).toBeVisible();
  await expect(smButton).toBeVisible();

  const geometry = await page.evaluate(() => {
    const read = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing geometry fixture: ${selector}`);
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    };

    const stretchElement = document.querySelector<HTMLElement>(
      '#controls-button .ui-icon-button--stretch',
    );
    const stretchParent = stretchElement?.parentElement;
    if (!stretchParent) throw new Error('Missing stretch IconButton row');
    const stretchParentRect = stretchParent.getBoundingClientRect();

    return {
      md: read('#controls-icon-button .ui-icon-button--md'),
      stretch: read('#controls-button .ui-icon-button--stretch'),
      stretchParent: { width: stretchParentRect.width, height: stretchParentRect.height },
      stretchMinHeight: Number.parseFloat(getComputedStyle(stretchElement).minHeight),
      sm: read('#controls-density [data-density-controls] .ui-icon-button--sm'),
      smButton: read(
        '#controls-density [data-density-controls] .ui-button--sm:not(.ui-icon-button)',
      ),
    };
  });

  expect(geometry.md.width).toBeCloseTo(geometry.md.height, 1);
  expect(geometry.sm.width).toBeCloseTo(geometry.sm.height, 1);
  expect(geometry.sm.height).toBeCloseTo(geometry.smButton.height, 1);
  // Stretch does not override the canonical minimum tap height.
  expect(geometry.stretch.height).toBeCloseTo(
    Math.max(geometry.stretchParent.height, geometry.stretchMinHeight),
    1,
  );
  expect(geometry.stretch.width).toBeGreaterThanOrEqual(geometry.md.width);
});

test('shared navigation indicator stays aligned inside the specimen stage', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop specimen geometry.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?theme=light&lang=zh#controls-surface', {
    waitUntil: 'domcontentloaded',
  });

  const surface = page.locator('#controls-surface .ui-control-surface--shared-indicator').last();
  await expect(surface).toHaveAttribute('data-neoverse-navigation-indicator-ready', 'true');

  const readAlignment = () =>
    surface.evaluate((element) => {
      const active = element.querySelector<HTMLElement>('.ui-navigation-item--active');
      const marker = active?.querySelector<HTMLElement>('.ui-navigation-item__indicator');
      const shared = element.querySelector<HTMLElement>('.ui-control-surface__indicator');
      const preview = element.closest<HTMLElement>('.playground-specimen-preview__content');
      if (!active || !marker || !shared || !preview) {
        throw new Error('Shared navigation indicator fixture is incomplete');
      }
      const markerRect = marker.getBoundingClientRect();
      const sharedRect = shared.getBoundingClientRect();
      return {
        previewZoom: Number.parseFloat(getComputedStyle(preview).zoom),
        x: Math.abs(sharedRect.x - markerRect.x),
        y: Math.abs(sharedRect.y - markerRect.y),
        width: Math.abs(sharedRect.width - markerRect.width),
        height: Math.abs(sharedRect.height - markerRect.height),
      };
    });

  const initial = await readAlignment();
  expect(initial.previewZoom).toBe(1);
  expect(initial.x).toBeLessThanOrEqual(0.2);
  expect(initial.y).toBeLessThanOrEqual(0.2);
  expect(initial.width).toBeLessThanOrEqual(0.2);
  expect(initial.height).toBeLessThanOrEqual(0.2);

  const components = surface.getByRole('link', { name: '组件' });
  await components.click();
  await expect(components).toHaveAttribute('aria-current', 'page');

  const moved = await readAlignment();
  expect(moved.x).toBeLessThanOrEqual(0.2);
  expect(moved.y).toBeLessThanOrEqual(0.2);
  expect(moved.width).toBeLessThanOrEqual(0.2);
  expect(moved.height).toBeLessThanOrEqual(0.2);
});
