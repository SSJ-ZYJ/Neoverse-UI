import type { Locator } from '@playwright/test';
import { expect, test } from '../support/e2e';

test.describe('segmented control', () => {
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

  test('React segmented control keeps its selection and tab stop after a rejected update', async ({
    page,
  }) => {
    await page.goto('/react-fixture?theme=light&lang=en&contract-fixtures=1');
    const group = page.locator('[data-react-adapter="UiSegmentedControl"]');
    const radios = group.getByRole('radio');

    await page.locator('[data-parity-reject]').click();
    await radios.nth(2).click();
    await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
    await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'false');
    await expect(radios.nth(2)).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(radios.first()).toHaveAttribute('tabindex', '0');
    await expect(radios.nth(2)).toHaveAttribute('tabindex', '-1');

    await page.locator('[data-parity-disabled]').click();
    for (const radio of await radios.all()) await expect(radio).toBeDisabled();
    await page.locator('[data-parity-disabled]').click();
    await page.locator('[data-parity-options]').click();
    await expect(
      page.locator('[data-parity-uncontrolled]').getByRole('radio', { checked: true }),
    ).toHaveText('C');
  });

  test('Vue segmented control selects with pointer and keyboard and returns focus to the selection', async ({
    page,
  }) => {
    await page.goto('/frame?theme=light&lang=en#controls');
    const group = page.locator('#controls-segmented-control .ui-segmented-control').first();
    const radios = group.getByRole('radio');

    await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
    await expect(radios.nth(1)).toBeDisabled();
    await radios.nth(2).click();
    await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'true');
    await expect(radios.first()).toHaveAttribute('aria-checked', 'false');
    await expect(radios.nth(2)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(radios.nth(2)).toHaveAttribute('tabindex', '0');
    await expect(radios.first()).toHaveAttribute('tabindex', '-1');
    await page.keyboard.press('Shift+Tab');
    await expect(radios.nth(2)).toBeFocused();

    await radios.nth(2).press('ArrowRight');
    await expect(radios.first()).toBeFocused();
    await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
  });

  const visibleBox = async (locator: Locator) => {
    const box = await locator.boundingBox();
    if (!box) throw new Error(`No visible box for ${locator}`);
    return box;
  };

  for (const framework of ['Vue', 'React'] as const) {
    const url =
      framework === 'Vue'
        ? '/frame?theme=light&lang=en#controls-segmented-control'
        : '/react-fixture?theme=light&lang=en&contract-fixtures=1';
    const selector =
      framework === 'Vue'
        ? '#controls-segmented-control [data-contract-state="default"] .ui-segmented-control'
        : '[data-react-adapter="UiSegmentedControl"]';

    test(`segmented control previews a held choice without committing canceled input in ${framework}`, async ({
      page,
    }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(url);
      const group = page.locator(selector);
      const first = group.getByRole('radio').first();
      const last = group.getByRole('radio').last();
      const thumb = group.locator('.ui-segmented-control__slider');
      const touch = testInfo.project.use.hasTouch ? await page.context().newCDPSession(page) : null;
      await expect(thumb).toHaveAttribute('data-ready', 'true');
      await page.evaluate(() => document.fonts.ready);
      await last.scrollIntoViewIfNeeded();
      const original = await visibleBox(thumb);
      const destination = await visibleBox(last);
      const center = destination.x + destination.width / 2;
      const distanceTo = async (option: Locator) => {
        const plate = await visibleBox(thumb);
        const button = await visibleBox(option);
        return Math.abs(plate.x + plate.width / 2 - button.x - button.width / 2);
      };

      if (touch) {
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x: center, y: destination.y + destination.height / 2 }],
        });
      } else {
        await last.hover();
        await page.mouse.down();
      }
      await expect.poll(() => distanceTo(last)).toBeLessThan(2);
      await expect
        .poll(async () => (await visibleBox(thumb)).height)
        .toBeLessThan(original.height * 0.9);
      await expect
        .poll(async () => {
          const box = await visibleBox(thumb);
          return box.width / destination.width - box.height / destination.height;
        })
        .toBeGreaterThan(0.08);
      await expect(last).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      await expect
        .poll(() => thumb.evaluate((node) => getComputedStyle(node, '::after').backgroundColor))
        .not.toBe('rgba(0, 0, 0, 0)');
      await expect(first).toBeChecked();
      await expect(last).not.toBeChecked();
      if (touch) {
        await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
        await touch.detach();
      } else {
        await page.mouse.move(center, destination.y + destination.height + 18);
        await page.mouse.up();
      }
      await expect.poll(() => distanceTo(first)).toBeLessThan(2);
      await expect(first).toBeChecked();

      if (testInfo.project.use.hasTouch) await last.tap();
      else await last.click();
      await expect(last).toBeChecked();
      await expect.poll(() => distanceTo(last)).toBeLessThan(2);
      await expect
        .poll(async () => Math.abs((await visibleBox(thumb)).width - destination.width))
        .toBeLessThan(1);

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(thumb).toHaveCSS('transition-duration', '0s');
      await last.press('Home');
      await expect(first).toBeChecked();
      await expect.poll(() => distanceTo(first)).toBeLessThan(2);
    });

    test(`segmented control follows a horizontal drag and commits only on release in ${framework}`, async ({
      page,
    }, testInfo) => {
      await page.goto(url);
      const group = page.locator(selector);
      const radios = group.getByRole('radio');
      const first = radios.first();
      const disabled = radios.nth(1);
      const last = radios.last();
      const thumb = group.locator('.ui-segmented-control__slider');
      const touch = testInfo.project.use.hasTouch ? await page.context().newCDPSession(page) : null;
      await expect(thumb).toHaveAttribute('data-ready', 'true');
      await page.evaluate(() => document.fonts.ready);
      await last.scrollIntoViewIfNeeded();

      const start = await visibleBox(first);
      const end = await visibleBox(last);
      const x0 = start.x + start.width / 2;
      const x1 = end.x + end.width / 2;
      let y = start.y + start.height / 2;
      const middle = (x0 + x1) / 2;
      const nearLast = x0 * 0.2 + x1 * 0.8;
      const distanceFrom = async (x: number) => {
        const box = await visibleBox(thumb);
        return Math.abs(box.x + box.width / 2 - x);
      };
      const hold = async (x: number) => {
        const current = await visibleBox(first);
        y = current.y + current.height / 2;
        if (touch) {
          await touch.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x, y }],
          });
        } else {
          await page.mouse.move(x, y);
          await page.mouse.down();
        }
      };
      const move = async (x: number) => {
        if (touch) {
          await touch.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x, y }],
          });
        } else {
          await page.mouse.move(x, y);
        }
      };
      const release = async (cancel = false) => {
        if (touch) {
          await touch.send('Input.dispatchTouchEvent', {
            type: cancel ? 'touchCancel' : 'touchEnd',
            touchPoints: [],
          });
        } else {
          if (cancel) await page.mouse.move(nearLast, y + start.height + 18);
          await page.mouse.up();
        }
      };

      await hold(x0);
      await move(middle);
      await expect.poll(() => distanceFrom(middle)).toBeLessThan(2);
      await expect(first).toBeChecked();
      await expect(disabled).not.toBeChecked();
      await move(nearLast);
      await expect.poll(() => distanceFrom(nearLast)).toBeLessThan(2);
      await move(x1 + 16);
      await expect.poll(() => distanceFrom(x1)).toBeLessThan(2);
      await release(true);
      await expect.poll(() => distanceFrom(x0)).toBeLessThan(2);
      await expect(first).toBeChecked();

      await hold(x0);
      await move(nearLast);
      await expect.poll(() => distanceFrom(nearLast)).toBeLessThan(2);
      await expect(first).toBeChecked();
      await release();
      await expect(last).toBeChecked();
      const centerOf = async (option: Locator) => {
        const box = await visibleBox(option);
        return box.x + box.width / 2;
      };
      await expect.poll(async () => distanceFrom(await centerOf(last))).toBeLessThan(2);

      await page.emulateMedia({ reducedMotion: 'reduce' });
      const left = await centerOf(first);
      await hold(await centerOf(last));
      await move(left);
      await expect.poll(() => distanceFrom(left)).toBeLessThan(2);
      await expect(last).toBeChecked();
      await release();
      await expect(first).toBeChecked();
      await touch?.detach();
    });

    test(`segmented control presents named theme icons and equal-width language labels in ${framework}`, async ({
      page,
    }) => {
      await page.goto(url);
      const scope = page.locator(
        framework === 'Vue' ? '#controls-segmented-control' : '[data-react-parity-fixture]',
      );
      const icons =
        framework === 'Vue'
          ? scope.locator('[data-segmented-example="icon"]')
          : page.locator('[data-react-theme-control]');
      const system = icons.getByRole('radio', { name: 'System' });
      const light = icons.getByRole('radio', { name: 'Light' });
      const dark = icons.getByRole('radio', { name: 'Dark' });
      await expect(system.locator('svg')).toBeVisible();
      await expect(light.locator('svg')).toBeVisible();
      await expect(dark.locator('svg')).toBeVisible();
      await expect(dark).toHaveText('');
      await light.press('ArrowRight');
      await expect(dark).toBeFocused();
      await expect(dark).toBeChecked();
      await dark.press('ArrowRight');
      await expect(system).toBeChecked();

      const languages = scope.locator('[data-segmented-example="language"]');
      for (const well of [icons, languages]) {
        const thumb = well.locator('.ui-segmented-control__slider');
        await expect(well).toHaveCSS('border-top-left-radius', '9999px');
        await expect(thumb).toHaveCSS('border-top-left-radius', '9999px');
        await expect(thumb.locator('..')).toHaveCSS('overflow-x', 'hidden');
      }
      const english = languages.getByRole('radio', { name: 'English' });
      const chinese = languages.getByRole('radio', { name: '中文' });
      await expect(english).toHaveText('EN');
      const englishBox = await visibleBox(english);
      const chineseBox = await visibleBox(chinese);
      expect(englishBox.width).toBeCloseTo(chineseBox.width);
      await chinese.click();
      await expect(chinese).toBeChecked();
    });

    test(`circular and rounded segmented thumbs shrink uniformly from center when pressed in ${framework}`, async ({
      page,
    }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(url);
      const icons = page.locator(
        framework === 'Vue'
          ? '#controls-segmented-control [data-segmented-example="icon"]'
          : '[data-react-theme-control]',
      );
      const rounded = page.locator(
        framework === 'Vue'
          ? '#controls-segmented-control .ui-segmented-control--rounded'
          : '[data-parity-uncontrolled]',
      );
      const touch = testInfo.project.use.hasTouch ? await page.context().newCDPSession(page) : null;

      const verifyUniformPress = async (
        well: Locator,
        expectedCircular: string,
        maxScale: number,
        minScale: number,
      ) => {
        const active = well.getByRole('radio', { checked: true });
        const thumb = well.locator('.ui-segmented-control__slider');
        await expect(thumb).toHaveAttribute('data-ready', 'true');
        await page.evaluate(() => document.fonts.ready);
        await active.scrollIntoViewIfNeeded();
        const original = await visibleBox(thumb);
        const target = await visibleBox(active);
        const cx = target.x + target.width / 2;
        const cy = target.y + target.height / 2;

        if (touch) {
          await touch.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x: cx, y: cy }],
          });
        } else {
          await active.hover();
          await page.mouse.down();
        }
        await expect(thumb).toHaveAttribute('data-pressed', '');
        await expect(thumb).toHaveAttribute('data-circular', expectedCircular);
        await expect
          .poll(async () => {
            const [box, button] = await Promise.all([visibleBox(thumb), visibleBox(active)]);
            const ratioX = box.width / original.width;
            const ratioY = box.height / original.height;
            const offsetX = Math.abs(box.x + box.width / 2 - (button.x + button.width / 2));
            const offsetY = Math.abs(box.y + box.height / 2 - (button.y + button.height / 2));
            return (
              ratioX <= maxScale &&
              ratioX >= minScale &&
              Math.abs(ratioX - ratioY) < 0.02 &&
              offsetX < 1 &&
              offsetY < 1
            );
          })
          .toBe(true);

        if (touch) {
          await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        } else {
          await page.mouse.up();
        }
      };

      await verifyUniformPress(icons, 'true', 0.92, 0.84);
      await verifyUniformPress(rounded, 'false', 0.99, 0.94);
      await touch?.detach();
    });
  }

  for (const theme of ['light', 'dark'] as const) {
    test(`segmented control keyboard focus keeps the primary focus ring in ${theme}`, async ({
      page,
    }) => {
      await page.goto(`/frame?theme=${theme}&lang=en#controls-segmented-control`, {
        waitUntil: 'domcontentloaded',
      });
      const group = page.locator('#controls-segmented-control .ui-segmented-control').first();
      const selected = group.getByRole('radio', { checked: true }).first();
      await selected.focus();

      const { outlineColor, expected } = await selected.evaluate((element) => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--neoverse-color-focus-ring)';
        document.body.append(probe);
        const expected = getComputedStyle(probe).color;
        probe.remove();
        return { outlineColor: getComputedStyle(element).outlineColor, expected };
      });
      expect(outlineColor).toBe(expected);
    });

    test(`segmented control preserves the Aurora Glass well and pill/rounded geometry in ${theme}`, async ({
      page,
    }, testInfo) => {
      await page.goto(`/frame?theme=${theme}&lang=en#controls-segmented-control`, {
        waitUntil: 'domcontentloaded',
      });
      const pill = page
        .locator(
          '#controls-segmented-control .ui-segmented-control--pill[data-surface="glass-subtle"]',
        )
        .first();
      const rounded = page
        .locator(
          '#controls-segmented-control .ui-segmented-control--rounded[data-surface="glass-subtle"]',
        )
        .first();
      await expect(pill).toBeVisible();
      await expect(rounded).toBeVisible();

      const pillMetrics = await pill.evaluate((element) => {
        const style = getComputedStyle(element);
        const slider = element.querySelector<HTMLElement>('.ui-segmented-control__slider');
        const sliderStyle = slider ? getComputedStyle(slider) : null;
        return {
          radius: Number.parseFloat(style.borderTopLeftRadius),
          bg: style.backgroundColor,
          backdrop: style.backdropFilter,
          sliderRadius: sliderStyle ? Number.parseFloat(sliderStyle.borderTopLeftRadius) : 0,
          sliderBgColor: sliderStyle?.backgroundColor ?? '',
          sliderBgImage: sliderStyle?.backgroundImage ?? '',
          sliderBgOrigin: sliderStyle?.backgroundOrigin ?? '',
          sliderBgRepeat: sliderStyle?.backgroundRepeat ?? '',
          sliderBackdrop: sliderStyle?.backdropFilter ?? '',
          sliderBoxShadow: sliderStyle?.boxShadow ?? '',
        };
      });
      expect(pillMetrics.radius).toBeGreaterThanOrEqual(999);
      expect(pillMetrics.sliderRadius).toBeGreaterThanOrEqual(999);
      expect(pillMetrics.bg).toContain('/ 0.15');
      expect(pillMetrics.backdrop).toContain('blur(12px)');
      expect(pillMetrics.sliderBackdrop).toContain('blur(12px)');
      expect(pillMetrics.sliderBackdrop).toContain('saturate(1.32)');
      expect(pillMetrics.sliderBgColor).not.toBe('rgb(255, 255, 255)');
      expect(pillMetrics.sliderBgImage).toContain('linear-gradient');
      expect(pillMetrics.sliderBgOrigin).toContain('border-box');
      expect(pillMetrics.sliderBgRepeat).toContain('no-repeat');
      expect(pillMetrics.sliderBoxShadow).toBe('none');

      const roundedMetrics = await rounded.evaluate((element) => {
        const style = getComputedStyle(element);
        const slider = element.querySelector<HTMLElement>('.ui-segmented-control__slider');
        const sliderStyle = slider ? getComputedStyle(slider) : null;
        return {
          radius: Number.parseFloat(style.borderTopLeftRadius),
          sliderRadius: sliderStyle ? Number.parseFloat(sliderStyle.borderTopLeftRadius) : 0,
          sliderBoxShadow: sliderStyle?.boxShadow ?? '',
        };
      });
      expect(roundedMetrics.radius).toBeCloseTo(12, 0);
      expect(roundedMetrics.sliderRadius).toBeLessThan(roundedMetrics.radius);
      expect(roundedMetrics.sliderRadius).toBeGreaterThan(6);
      expect(roundedMetrics.sliderBoxShadow).toBe('none');

      if (!testInfo.project.use.hasTouch) {
        const activeOption = pill.locator('.ui-segmented-control__option--active');
        const slider = pill.locator('.ui-segmented-control__slider');
        const restColor = await slider.evaluate((el) => getComputedStyle(el).backgroundColor);
        await activeOption.hover();
        await expect
          .poll(() => slider.evaluate((el) => getComputedStyle(el).backgroundColor))
          .not.toBe(restColor);
        if (theme === 'dark') {
          const primaryHover = await slider.evaluate((el) => {
            const probe = document.createElement('span');
            probe.style.backgroundColor = 'var(--neoverse-control-primary-hover-background)';
            el.parentElement?.append(probe);
            const value = getComputedStyle(probe).backgroundColor;
            probe.remove();
            return value;
          });
          await expect(slider).toHaveCSS('background-color', primaryHover);
        }
      }
    });
  }
});
