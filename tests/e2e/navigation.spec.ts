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
    await expect(page.locator('[data-navigation="custom"] .ui-breadcrumb__separator')).toHaveText([
      '/',
      '›',
    ]);
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
      // Park the pointer in the far corner. The stage can scroll the trail to
      // the top edge, where 0,0 still falls inside the grown plate hit box.
      const viewport = page.viewportSize();
      await page.mouse.move((viewport?.width ?? 1280) - 2, (viewport?.height ?? 720) - 2);
      await page.mouse.up();
      // Firefox keeps `:focus-visible` on a link pressed with the pointer, which
      // keeps the plate lit for a keyboard reason. Clear it so the exit below
      // measures the hover state the test is about.
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      });

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
    await expect(page.locator('[data-dock-section]')).toHaveJSProperty('tagName', 'SECTION');

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
    const itemHeight = () => item.evaluate((element) => element.getBoundingClientRect().height);
    expect(await iconWidth()).toBe(16);
    expect(await itemHeight()).toBe(32);

    const inspector = await showInspector(page, testInfo.project.name === 'mobile');
    await chooseOption(inspector, 'size', 'Small');
    await expect.poll(iconWidth).toBe(14);
    await expect.poll(itemHeight).toBe(28);
    await chooseOption(inspector, 'size', 'Large');
    await expect.poll(iconWidth).toBe(20);
    await inspector.getByRole('switch', { name: 'Compact' }).press('Space');
    await expect.poll(iconWidth).toBe(20);
    await expect.poll(itemHeight).toBe(40);
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

    test('the indicator settles on the active item inside a magnified preview', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/?theme=light&lang=en&fps=0#controls-surface', {
        waitUntil: 'domcontentloaded',
      });
      const surface = page.locator('#controls-surface .ui-control-surface');
      const indicator = surface.locator('.ui-control-surface__indicator');
      await expect(indicator).toHaveAttribute('data-ready', 'true');
      await page.locator('[data-stage-zoom="range"]').fill('750');
      const stage = await surface.boundingBox();
      if (!stage) throw new Error('Missing navigation geometry');

      const settleInside = async (index: number) => {
        await surface.locator('.ui-navigation-item').nth(index).click();
        await expect
          .poll(() => indicator.evaluate((element) => (element as HTMLElement).style.transform))
          .toBe('');
        await expectIndicatorOnActiveMarker(indicator);
        const box = await indicator.boundingBox();
        if (!box) throw new Error('Missing indicator geometry');
        expect(box.x).toBeGreaterThanOrEqual(stage.x);
        expect(box.x + box.width).toBeLessThanOrEqual(stage.x + stage.width);
      };

      await settleInside(1);
      await settleInside(2);
    });

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
