import type { Locator } from '@playwright/test';
import { expect, test } from '../support/e2e';
import { chooseOption, showInspector } from '../support/playground';

/** The committed layout box of the indicator, independent of any flight. */
type IndicatorBox = {
  left: string;
  width: string;
  offsetLeft: number;
  offsetWidth: number;
};

/** One style write of the indicator while a flight is running. */
type FlightSample = IndicatorBox & { transform: string };

/** The committed layout box the flight landed on. */
type FlightCommit = { box: IndicatorBox };

type FlightRecorder = {
  committed: () => FlightCommit | undefined;
  stop: () => { samples: FlightSample[]; commit: FlightCommit };
};

type FlightHost = Window & { __neoverseIndicatorFlight?: FlightRecorder };

/** Reads the committed layout box; the flight lives only in the transform. */
const readIndicatorBox = (indicator: Locator): Promise<IndicatorBox> =>
  indicator.evaluate((element) => {
    const node = element as HTMLElement;
    return {
      left: node.style.left,
      width: node.style.width,
      offsetLeft: node.offsetLeft,
      offsetWidth: node.offsetWidth,
    };
  });

/**
 * A click under software rendering can take longer than the 420ms indicator
 * flight, so reading `style.transform` after `click()` resolves samples a
 * flight that has already committed and cleared itself. Record the flight in
 * the page instead, from the write that sets the transform to the commit that
 * clears it, and assert on the recording. The recorder freezes at the commit:
 * a follow-up measurement may start another short flight, and that belongs to
 * the next interaction, not this one.
 */
const clickAndRecordIndicatorFlight = async (
  indicator: Locator,
  target: Locator,
): Promise<{ samples: FlightSample[]; commit: FlightCommit }> => {
  await indicator.evaluate((element) => {
    const node = element as HTMLElement;
    const samples: FlightSample[] = [];
    let started = false;
    let commit: FlightCommit | undefined;
    const readBox = (): IndicatorBox => ({
      left: node.style.left,
      width: node.style.width,
      offsetLeft: node.offsetLeft,
      offsetWidth: node.offsetWidth,
    });
    const record = () => {
      if (commit) return;
      const box = readBox();
      samples.push({ ...box, transform: node.style.transform });
      if (node.style.transform !== '') {
        started = true;
        return;
      }
      if (!started) return;
      commit = { box };
    };
    const changes = new MutationObserver(record);
    changes.observe(node, { attributes: true, attributeFilter: ['style'] });
    (window as unknown as FlightHost).__neoverseIndicatorFlight = {
      committed: () => commit,
      stop: () => {
        changes.disconnect();
        delete (window as unknown as FlightHost).__neoverseIndicatorFlight;
        if (!commit) throw new Error('The indicator flight never committed');
        return { samples, commit };
      },
    };
  });
  const page = indicator.page();
  await target.click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as FlightHost).__neoverseIndicatorFlight?.committed() !== undefined,
      ),
    )
    .toBe(true);
  return page.evaluate(() => {
    const recorder = (window as unknown as FlightHost).__neoverseIndicatorFlight;
    if (!recorder) throw new Error('The indicator flight recorder is not installed');
    return recorder.stop();
  });
};

/**
 * The flight must be a compositor transform of the committed layout box, and
 * its final vector must equal the geometry the commit lands on. Sampling
 * painted frames is not part of the proof: the software compositor starves
 * requestAnimationFrame during a WebKit click, so only the style writes are
 * deterministic across engines.
 */
const expectTransformFlight = (samples: FlightSample[], commit: FlightCommit): void => {
  const flying = samples.filter((sample) => sample.transform.includes('translate'));
  if (flying.length === 0) throw new Error('The indicator never started a transform flight');
  for (const sample of flying) {
    // The layout box (left/width and offsetLeft/offsetWidth) excludes the
    // transform, so it must stay at the committed geometry while the plate
    // flies: a per-frame layout would move it with the animation.
    expect(
      Math.abs(sample.offsetLeft - Math.round(Number.parseFloat(sample.left))),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(sample.offsetWidth - Math.round(Number.parseFloat(sample.width))),
    ).toBeLessThanOrEqual(1);
  }
  const last = flying[flying.length - 1];
  if (last === undefined) throw new Error('The indicator flight has no samples');
  // Every engine drops defaulted components when it serializes the inline
  // transform: WebKit writes translate(88px) scale(1, 1), Firefox writes
  // translate(88px) scale(1). Parse the function list instead of one shape.
  const parts = Array.from(
    last.transform.matchAll(/([a-z]+)\(([^)]*)\)/g),
    ([, name = '', args = '']) => ({
      name,
      args: args.split(',').map((arg) => Number.parseFloat(arg)),
    }),
  );
  const translate = parts.find((part) => part.name === 'translate');
  const scale = parts.find((part) => part.name === 'scale');
  if (!translate || !scale)
    throw new Error(`Unexpected indicator flight transform: ${last.transform}`);
  const [translateX = Number.NaN, translateY = 0] = translate.args;
  const [scaleX = Number.NaN, scaleY = scaleX] = scale.args;
  expect(
    Math.abs(translateX - (Number.parseFloat(commit.box.left) - Number.parseFloat(last.left))),
  ).toBeLessThan(0.5);
  expect(Math.abs(translateY)).toBeLessThan(0.5);
  expect(
    Math.abs(scaleX - Number.parseFloat(commit.box.width) / Number.parseFloat(last.width)),
  ).toBeLessThan(0.01);
  expect(Math.abs(scaleY - 1)).toBeLessThan(0.01);
};

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

  test('breadcrumb hover paints a large readable plate without moving the trail', async ({
    page,
  }, testInfo) => {
    await page.goto('/react-fixture?theme=light&lang=en');
    const breadcrumb = page.locator('[data-navigation="default"]');
    const link = breadcrumb.getByRole('link', { name: 'Documentation' });
    await link.scrollIntoViewIfNeeded();

    const trailBefore = await breadcrumb.boundingBox();
    const lineHeight = (await breadcrumb.locator('.ui-breadcrumb__current').boundingBox())?.height;
    const rest = await link.evaluate((node) => {
      const style = getComputedStyle(node);
      const plate = getComputedStyle(node, '::after');
      return {
        color: style.color,
        plateOpacity: plate.opacity,
        plateRadius: plate.borderTopLeftRadius,
        paddingBlock: Number.parseFloat(style.paddingTop),
        paddingInline: Number.parseFloat(style.paddingLeft),
        marginBlock: Number.parseFloat(style.marginTop),
        marginInline: Number.parseFloat(style.marginLeft),
        height: node.getBoundingClientRect().height,
        overflow: style.overflowX,
      };
    });

    // The plate covers the padded link box, which is taller than the breadcrumb's
    // single line, and the negative margin returns the same space to the trail.
    expect(rest.overflow).toBe('clip');
    expect(rest.paddingBlock).toBeGreaterThan(0);
    expect(rest.paddingInline).toBe(rest.paddingBlock);
    expect(rest.marginBlock).toBeCloseTo(-rest.paddingBlock, 1);
    expect(rest.marginInline).toBeCloseTo(-rest.paddingInline, 1);
    expect(rest.plateOpacity).toBe('0');
    expect(rest.plateRadius).not.toBe('0px');
    expect(rest.height).toBeGreaterThan((lineHeight ?? 0) + 1);

    if (!testInfo.project.use.hasTouch) {
      const readPlate = () =>
        link.evaluate((node) => {
          const plate = getComputedStyle(node, '::after');
          return {
            color: getComputedStyle(node).color,
            opacity: plate.opacity,
            background: plate.backgroundColor,
            image: plate.backgroundImage,
            transform: plate.transform,
          };
        });

      // Hovering the padding — outside the glyphs, clear of the rounded corner —
      // must still answer, which is the point of growing the hit box instead of
      // tinting the text line.
      await link.hover({ position: { x: 2, y: 12 } });
      // The wash and the label color both animate, so poll instead of
      // sampling the first frame.
      await expect.poll(async () => (await readPlate()).opacity).toBe('1');
      const hovered = await readPlate();
      expect(hovered.background).not.toBe('rgba(0, 0, 0, 0)');
      expect(hovered.color).not.toBe(rest.color);

      // Pressing deepens the plate instead of fading it and pulls it in.
      await page.mouse.down();
      await expect.poll(async () => (await readPlate()).image).toContain('gradient');
      await expect.poll(async () => (await readPlate()).transform).not.toBe('none');
      expect((await readPlate()).background).toBe(hovered.background);
      await page.mouse.move(0, 0);
      await page.mouse.up();

      // Hover must not resize the link or shift the trail.
      const afterBox = await link.boundingBox();
      expect(afterBox?.height).toBeCloseTo(rest.height, 1);
      const trailAfter = await breadcrumb.boundingBox();
      expect(trailAfter?.width).toBeCloseTo(trailBefore?.width ?? 0, 1);
      expect(trailAfter?.height).toBeCloseTo(trailBefore?.height ?? 0, 1);

      await expect.poll(async () => (await readPlate()).opacity).toBe('0');
      await expect.poll(async () => (await readPlate()).color).toBe(rest.color);
    }
  });

  test('the Design Lab breadcrumb specimen keeps real anchors but stays on its route', async ({
    page,
  }) => {
    await page.goto('/?lang=en#controls-breadcrumb', { waitUntil: 'domcontentloaded' });
    const breadcrumb = page.locator('#controls-breadcrumb .ui-breadcrumb');
    const link = breadcrumb.getByRole('link', { name: 'Home' });

    await expect(link).toBeVisible();
    // Native anchor semantics stay: the specimen demonstrates the real markup.
    expect(await link.getAttribute('href')).toBe('#top');

    await link.click();
    await expect(page).toHaveURL(/#controls-breadcrumb$/);

    await link.focus();
    await link.press('Enter');
    await expect(page).toHaveURL(/#controls-breadcrumb$/);
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

  test('segmented control reconciles rejected and disabled updates', async ({ page }) => {
    await page.goto('/react-fixture?theme=light&lang=en&contract-fixtures=1');
    const group = page.locator('[data-react-adapter="UiSegmentedControl"]');
    const radios = group.getByRole('radio');

    await page.locator('[data-parity-reject]').click();
    await radios.nth(2).click();
    await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
    await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'false');

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

  test('a blurred segmented control keeps the checked option as the only tab stop', async ({
    page,
  }) => {
    await page.goto('/react-fixture?theme=light&lang=en&contract-fixtures=1');
    const group = page.locator('[data-react-adapter="UiSegmentedControl"]');
    const radios = group.getByRole('radio');

    await page.locator('[data-parity-reject]').click();
    await radios.nth(2).click();
    await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
    await expect(radios.nth(2)).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(radios.first()).toHaveAttribute('tabindex', '0');
    await expect(radios.nth(2)).toHaveAttribute('tabindex', '-1');
  });

  test('the Vue segmented control restores its checked option when focus returns', async ({
    page,
  }) => {
    await page.goto('/frame?theme=light&lang=en#controls');
    const group = page.locator('#controls-segmented-control .ui-segmented-control').first();
    const radios = group.getByRole('radio');

    await radios.nth(2).click();
    await expect(radios.nth(2)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(radios.nth(2)).toHaveAttribute('tabindex', '0');
    await expect(radios.first()).toHaveAttribute('tabindex', '-1');
    await page.keyboard.press('Shift+Tab');
    await expect(radios.nth(2)).toBeFocused();
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
      await last.scrollIntoViewIfNeeded();

      const start = await visibleBox(first);
      const end = await visibleBox(last);
      const x0 = start.x + start.width / 2;
      const x1 = end.x + end.width / 2;
      const y = start.y + start.height / 2;
      const middle = (x0 + x1) / 2;
      const nearLast = x0 * 0.2 + x1 * 0.8;
      const distanceFrom = async (x: number) => {
        const box = await visibleBox(thumb);
        return Math.abs(box.x + box.width / 2 - x);
      };
      const hold = async (x: number) => {
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
          if (cancel) await page.mouse.move(nearLast, end.y + end.height + 18);
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
  }

  for (const theme of ['light', 'dark'] as const) {
    test(`segmented control preserves the Aurora Glass well and pill/rounded geometry in ${theme}`, async ({
      page,
    }) => {
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
          sliderBgImage: sliderStyle?.backgroundImage ?? '',
        };
      });
      expect(pillMetrics.radius).toBeGreaterThanOrEqual(999);
      expect(pillMetrics.sliderRadius).toBeGreaterThanOrEqual(999);
      expect(pillMetrics.bg).toContain('/ 0.15');
      expect(pillMetrics.backdrop).toContain('blur(12px)');
      expect(pillMetrics.sliderBgImage).toContain('linear-gradient');

      const roundedMetrics = await rounded.evaluate((element) => {
        const style = getComputedStyle(element);
        const slider = element.querySelector<HTMLElement>('.ui-segmented-control__slider');
        return {
          radius: Number.parseFloat(style.borderTopLeftRadius),
          sliderRadius: slider
            ? Number.parseFloat(getComputedStyle(slider).borderTopLeftRadius)
            : 0,
        };
      });
      expect(roundedMetrics.radius).toBeCloseTo(12, 0);
      expect(roundedMetrics.sliderRadius).toBeLessThan(roundedMetrics.radius);
      expect(roundedMetrics.sliderRadius).toBeGreaterThan(6);
    });
  }

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

  test('holding the current navigation item tints it without moving it or losing selection', async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/frame?theme=light&lang=en#controls-navigation-item');
    const current = page.locator(
      '#controls-navigation-item [data-contract-state="default"] a[aria-current="page"]',
    );
    await current.scrollIntoViewIfNeeded();
    const rest = await current.evaluate((node) => getComputedStyle(node).backgroundImage);
    await current.hover();
    const hover = await current.evaluate((node) => getComputedStyle(node).backgroundImage);
    if (!testInfo.project.use.hasTouch) expect(hover).not.toBe(rest);
    const shadow = await current.evaluate((node) => getComputedStyle(node).boxShadow);
    const bounds = await current.boundingBox();
    await page.mouse.down();
    try {
      await expect(current).not.toHaveCSS('background-image', hover);
      await expect(current).toHaveCSS('box-shadow', shadow);
      expect(await current.boundingBox()).toEqual(bounds);
      await expect(current).toHaveAttribute('aria-current', 'page');
    } finally {
      await page.mouse.up();
    }
    await expect(current).toHaveCSS('background-image', hover);
  });

  test('a compact large navigation item scales its icon with the size token', async ({
    page,
  }, testInfo) => {
    await page.goto('/?theme=light&lang=en#controls-navigation-item', {
      waitUntil: 'domcontentloaded',
    });
    const item = page.locator('[data-design-lab-region="specimen"] .ui-navigation-item');
    const iconWidth = () =>
      item.evaluate((element) => {
        const svg = element.querySelector('svg');
        if (!(svg instanceof SVGElement)) throw new Error('The navigation icon is missing');
        return svg.getBoundingClientRect().width;
      });
    expect(await iconWidth()).toBe(16);

    const inspector = await showInspector(page, testInfo.project.name === 'mobile');
    await chooseOption(inspector, 'size', 'Large');
    await expect.poll(iconWidth).toBe(20);
    await inspector.getByRole('switch', { name: 'Compact' }).press('Space');
    await expect.poll(iconWidth).toBe(20);
    expect(await item.evaluate((element) => element.getBoundingClientRect().height)).toBe(40);
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

    /**
     * The committed geometry can still land a sub-pixel correction after the
     * transition ends, so convergence is polled instead of sampled once.
     */
    const expectIndicatorOnActiveMarker = async (indicator: Locator): Promise<void> => {
      await expect
        .poll(async () => {
          const geometry = await indicator.evaluate(indicatorGeometry);
          return Math.max(geometry.left, geometry.top, geometry.width, geometry.height);
        })
        .toBeLessThan(0.5);
      const geometry = await indicator.evaluate(indicatorGeometry);
      expect(geometry.radius).toBe(geometry.markerRadius);
    };

    for (const theme of ['light', 'dark'] as const) {
      test(`the indicator glides on transform and settles on the active item in ${theme}`, async ({
        page,
      }) => {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
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
          const before = await readIndicatorBox(indicator);
          const { samples, commit } = await clickAndRecordIndicatorFlight(
            indicator,
            items.nth(index),
          );
          expectTransformFlight(samples, commit);
          // The commit clears the transform and writes the settled geometry.
          expect(commit.box).not.toEqual(before);
          await expectIndicatorOnActiveMarker(indicator);
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
        await expectIndicatorOnActiveMarker(indicator);
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
      await expectIndicatorOnActiveMarker(indicator);
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
      await expectIndicatorOnActiveMarker(indicator);
      expect(await indicator.evaluate((element) => (element as HTMLElement).offsetWidth)).toBe(
        compactWidth,
      );
    });

    test('the React dock indicator shares the transform flight contract', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
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

      const before = await readIndicatorBox(indicator);
      const { samples, commit } = await clickAndRecordIndicatorFlight(indicator, items.nth(1));
      expectTransformFlight(samples, commit);
      expect(commit.box).not.toEqual(before);
      await expectIndicatorOnActiveMarker(indicator);
      expect(errors).toEqual([]);
    });
  });
});
