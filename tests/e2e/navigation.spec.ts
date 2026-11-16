import { expect, test } from '../support/e2e';

test.describe('navigation', () => {
  test('breadcrumb links navigate and update the current item', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/react-fixture?theme=light&lang=en');

    const breadcrumb = page.locator('[data-navigation="default"]');
    await expect(breadcrumb).toHaveAttribute('aria-label', 'Page path');
    await expect(breadcrumb.locator('li')).toHaveCount(3);
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Current chapter');
    await expect(breadcrumb.locator('.ui-breadcrumb__separator[aria-hidden="true"]')).toHaveCount(
      2,
    );

    const home = breadcrumb.getByRole('link', { name: 'Home' });
    await home.focus();
    await home.press('Enter');
    await expect(page).toHaveURL(/#react-navigation-home$/);

    await page.locator('[data-breadcrumb-toggle]').click();
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Home');
    await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveCount(0);
    await expect(breadcrumb.getByRole('link', { name: 'Documentation' })).toHaveAttribute(
      'href',
      '#react-navigation-docs',
    );
    await expect(page.locator('[data-navigation="custom"] [aria-current="page"]')).toHaveText(
      'Home',
    );
    expect(errors).toEqual([]);
  });

  test('dock keeps native links, trailing content and the compact composition', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/react-fixture?theme=light&lang=zh');

    const dock = page.locator('[data-react-adapter="UiDock"]');
    await expect(dock).toHaveAttribute('aria-label', '快捷导航');
    await expect(page.locator('[data-dock-div]')).toHaveJSProperty('tagName', 'DIV');

    const home = dock.getByRole('link', { name: '首页' });
    await home.focus();
    await home.press('Enter');
    await expect(page).toHaveURL(/#react-navigation-home$/);

    const trailing = dock.locator('.ui-control-surface__group--trailing');
    await trailing.getByRole('button').click();
    await expect(trailing.getByRole('button')).toHaveText('计数 1');

    await page.locator('[data-dock-compact-toggle]').click();
    await expect(dock).toHaveClass(/ui-dock--compact/);

    await page.locator('[data-dock-trailing-toggle]').click();
    await expect(trailing).toHaveCount(0);
    await expect(dock.getByRole('link')).toHaveCount(2);

    await page.locator('[data-dock-trailing-toggle]').click();
    await expect(trailing.getByRole('button')).toHaveText('计数 1');
    expect(errors).toEqual([]);
  });

  test('segmented control supports keyboard selection and skips disabled values', async ({
    page,
  }) => {
    await page.goto('/react-fixture?theme=light&lang=en&contract-fixtures=1');
    const group = page.locator('[data-react-adapter="UiSegmentedControl"]');
    const radios = group.getByRole('radio');

    await radios.first().focus();
    await radios.first().press('ArrowRight');
    await expect(radios.nth(2)).toBeFocused();
    await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'true');
    await radios.nth(2).press('Home');
    await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
    await radios.first().press('End');
    await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'true');
    await radios.nth(2).press('ArrowRight');
    await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
  });

  test('segmented control reconciles rejected, loading and disabled updates', async ({ page }) => {
    await page.goto('/react-fixture?theme=light&lang=en&contract-fixtures=1');
    const group = page.locator('[data-react-adapter="UiSegmentedControl"]');
    const radios = group.getByRole('radio');

    await page.locator('[data-parity-reject]').click();
    await radios.nth(2).click();
    await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
    await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'false');

    await page.locator('[data-parity-loading]').click();
    await expect(group).toHaveAttribute('aria-busy', 'true');
    for (const radio of await radios.all()) await expect(radio).toBeDisabled();
    await page.locator('[data-parity-loading]').click();

    await page.locator('[data-parity-disabled]').click();
    for (const radio of await radios.all()) await expect(radio).toBeDisabled();
    await page.locator('[data-parity-disabled]').click();
    await page.locator('[data-parity-options]').click();
    await expect(
      page.locator('[data-parity-uncontrolled]').getByRole('radio', { checked: true }),
    ).toHaveText('C');
  });

  test('Vue segmented control selects with pointer and keyboard in one group', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#controls');
    const group = page.locator('#controls-segmented-control .ui-segmented-control').first();
    const radios = group.getByRole('radio');

    await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
    await expect(radios.nth(1)).toBeDisabled();
    await radios.nth(2).click();
    await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'true');
    await expect(radios.first()).toHaveAttribute('aria-checked', 'false');

    await radios.nth(2).press('ArrowRight');
    await expect(radios.first()).toBeFocused();
    await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
  });

  test('step flow marks exactly one current stage', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#data-display-step-flow');
    const flow = page.locator('#data-display-step-flow .ui-step-flow');

    await expect(flow).toBeVisible();
    await expect(flow.locator('[aria-current="step"]')).toHaveCount(1);
    await expect(flow.locator('.ui-step-flow__item--complete')).not.toHaveCount(0);
  });

  test('dock navigation item reports the current page and keeps its links reachable', async ({
    page,
  }) => {
    await page.goto('/frame?theme=light&lang=en#dock');
    const dock = page.locator('#dock .ui-dock').first();
    const links = dock.getByRole('link');

    await expect(links.first()).toBeVisible();
    const active = dock.locator('[aria-current="page"]');
    await expect(active).toHaveCount(1);
    const href = await active.getAttribute('href');
    expect(href).toBeTruthy();
    await active.focus();
    await expect(active).toBeFocused();
  });

  test.describe('dock shared indicator', () => {
    const indicatorGeometry = (indicator: Element) => {
      const rect = indicator.getBoundingClientRect();
      const group = indicator.closest('.ui-control-surface__group');
      const marker = group?.querySelector(
        '.ui-navigation-item--active .ui-navigation-item__indicator',
      );
      if (!marker) throw new Error('Active navigation marker is missing');
      const target = marker.getBoundingClientRect();
      return {
        left: Math.abs(rect.left - target.left),
        top: Math.abs(rect.top - target.top),
        width: Math.abs(rect.width - target.width),
        height: Math.abs(rect.height - target.height),
        radius: getComputedStyle(indicator).borderRadius,
        markerRadius: getComputedStyle(marker).borderRadius,
      };
    };

    for (const theme of ['light', 'dark'] as const) {
      test(`the indicator glides on transform and settles on the active item in ${theme}`, async ({
        page,
      }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(`/frame?theme=${theme}&lang=en#dock`);
        const dock = page.locator('[data-dock-specimen="standard"] .ui-dock');
        const items = dock.locator('.ui-navigation-item');
        const indicator = dock.locator('.ui-control-surface__indicator');
        await expect(indicator).toHaveAttribute('data-ready', 'true');
        expect(
          await indicator.evaluate((element) => getComputedStyle(element).transitionProperty),
        ).toBe('transform');

        const settleOn = async (index: number) => {
          await items.nth(index).click();
          const flight = await indicator.evaluate((element) => {
            const node = element as HTMLElement;
            return {
              transform: node.style.transform,
              left: node.style.left,
              offsetLeft: node.offsetLeft,
              offsetWidth: node.offsetWidth,
              visualLeft: node.getBoundingClientRect().left,
            };
          });
          expect(flight.transform).toContain('translate');
          // A few compositor frames into the 420ms flight the visual box has
          // moved, but the layout box (offsetLeft/offsetWidth exclude transform)
          // must not: that is precisely "the indicator adds no per-frame layout".
          // Poll the movement itself; three animation frames are not guaranteed
          // to composite on software-rendered mobile and produced false zeros.
          let mid:
            | {
                transform: string;
                offsetLeft: number;
                offsetWidth: number;
                visualLeft: number;
              }
            | undefined;
          await expect
            .poll(async () => {
              const sample = await indicator.evaluate((element) => {
                const node = element as HTMLElement;
                return {
                  transform: node.style.transform,
                  offsetLeft: node.offsetLeft,
                  offsetWidth: node.offsetWidth,
                  visualLeft: node.getBoundingClientRect().left,
                };
              });
              if (
                sample.transform === '' ||
                Math.abs(sample.visualLeft - flight.visualLeft) <= 0.5
              ) {
                return false;
              }
              mid = sample;
              return true;
            })
            .toBe(true);
          if (mid === undefined) throw new Error('The indicator flight never progressed');
          expect(mid.transform).toContain('translate');
          expect(mid.offsetLeft).toBe(flight.offsetLeft);
          expect(mid.offsetWidth).toBe(flight.offsetWidth);
          expect(Math.abs(mid.visualLeft - flight.visualLeft)).toBeGreaterThan(0.5);
          await expect
            .poll(() => indicator.evaluate((element) => (element as HTMLElement).style.transform))
            .toBe('');
          const geometry = await indicator.evaluate(indicatorGeometry);
          expect(geometry.left).toBeLessThan(0.5);
          expect(geometry.top).toBeLessThan(0.5);
          expect(geometry.width).toBeLessThan(0.5);
          expect(geometry.height).toBeLessThan(0.5);
          expect(geometry.radius).toBe(geometry.markerRadius);
          expect(
            await indicator.evaluate((element) => (element as HTMLElement).style.left),
          ).not.toBe(flight.left);
        };

        await settleOn(1);
        await settleOn(3);

        // Rapid consecutive selections retarget the flight and settle on the last item.
        await items.nth(0).click();
        await items.nth(2).click();
        await items.nth(1).click();
        await expect
          .poll(() => indicator.evaluate((element) => (element as HTMLElement).style.transform))
          .toBe('');
        const geometry = await indicator.evaluate(indicatorGeometry);
        expect(geometry.left).toBeLessThan(0.5);
        expect(geometry.top).toBeLessThan(0.5);
        expect(geometry.width).toBeLessThan(0.5);
        expect(geometry.height).toBeLessThan(0.5);
        expect(errors).toEqual([]);
      });
    }

    test('the indicator commits directly to the active item when motion is reduced', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/frame?theme=light&lang=en#dock');
      const dock = page.locator('[data-dock-specimen="standard"] .ui-dock');
      const indicator = dock.locator('.ui-control-surface__indicator');
      await expect(indicator).toHaveAttribute('data-ready', 'true');
      await dock.locator('.ui-navigation-item').nth(2).click();
      expect(await indicator.evaluate((element) => (element as HTMLElement).style.transform)).toBe(
        '',
      );
      const geometry = await indicator.evaluate(indicatorGeometry);
      expect(geometry.left).toBeLessThan(0.5);
      expect(geometry.top).toBeLessThan(0.5);
      expect(geometry.width).toBeLessThan(0.5);
      expect(geometry.height).toBeLessThan(0.5);
    });

    test('the compact dock indicator settles on the smaller compact geometry', async ({ page }) => {
      await page.goto('/frame?theme=light&lang=en#dock');
      const standard = page.locator(
        '[data-dock-specimen="standard"] .ui-control-surface__indicator',
      );
      const compact = page.locator('[data-dock-specimen="compact"] .ui-dock');
      const indicator = compact.locator('.ui-control-surface__indicator');
      await expect(indicator).toHaveAttribute('data-ready', 'true');
      const standardWidth = await standard.evaluate(
        (element) => (element as HTMLElement).offsetWidth,
      );
      const compactWidth = await indicator.evaluate(
        (element) => (element as HTMLElement).offsetWidth,
      );
      expect(compactWidth).toBeLessThan(standardWidth);
      await compact.locator('.ui-navigation-item').nth(3).click();
      await expect
        .poll(() => indicator.evaluate((element) => (element as HTMLElement).style.transform))
        .toBe('');
      const geometry = await indicator.evaluate(indicatorGeometry);
      expect(geometry.left).toBeLessThan(0.5);
      expect(geometry.top).toBeLessThan(0.5);
      expect(geometry.width).toBeLessThan(0.5);
      expect(geometry.height).toBeLessThan(0.5);
      expect(geometry.radius).toBe(geometry.markerRadius);
      expect(await indicator.evaluate((element) => (element as HTMLElement).offsetWidth)).toBe(
        compactWidth,
      );
    });

    test('the React dock indicator shares the transform flight contract', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('/react-fixture?theme=light&lang=en');
      const dock = page.locator('[data-parity-dock]');
      const items = dock.locator('.ui-navigation-item');
      const indicator = dock.locator('.ui-control-surface__indicator');
      await expect(indicator).toHaveAttribute('data-ready', 'true');
      expect(
        await indicator.evaluate((element) => getComputedStyle(element).transitionProperty),
      ).toBe('transform');

      await items.nth(1).click();
      const flight = await indicator.evaluate((element) => ({
        transform: (element as HTMLElement).style.transform,
        left: (element as HTMLElement).style.left,
      }));
      expect(flight.transform).toContain('translate');
      await expect
        .poll(() => indicator.evaluate((element) => (element as HTMLElement).style.transform))
        .toBe('');
      const geometry = await indicator.evaluate(indicatorGeometry);
      expect(geometry.left).toBeLessThan(0.5);
      expect(geometry.top).toBeLessThan(0.5);
      expect(geometry.width).toBeLessThan(0.5);
      expect(geometry.height).toBeLessThan(0.5);
      expect(geometry.radius).toBe(geometry.markerRadius);
      expect(await indicator.evaluate((element) => (element as HTMLElement).style.left)).not.toBe(
        flight.left,
      );
      expect(errors).toEqual([]);
    });
  });
});
